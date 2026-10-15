import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import fs from 'node:fs'
import { buildContent, contentDirectory, site } from './scripts/build-content.mjs'
import { normalizeBasePath } from './scripts/docs-config.mjs'
import { writeStaticPages } from './scripts/static-pages.mjs'

const execute = promisify(execFile)

function documentationContent(): Plugin {
  return {
    name: 'retiam-documentation-content',
    config() {
      buildContent()
    },
    configureServer(server) {
      const sourceDirectories = ['examples', 'assets', 'reference'].map(folder => path.join(site, folder))
      const configurationFiles = ['package.json', 'package-lock.json'].map(file => path.join(site, file))
      server.watcher.add([contentDirectory, ...sourceDirectories, ...configurationFiles])
      let timer: ReturnType<typeof setTimeout> | undefined
      let running = false, pending = false, runtimeChanged = false, closed = false
      const refresh = async () => {
        if (running || closed) return
        running = true
        pending = false
        const prepareRuntime = runtimeChanged
        runtimeChanged = false
        try {
          if (prepareRuntime) await execute(process.execPath, ['scripts/build-runtime.mjs'], { cwd: site, maxBuffer: 16 * 1024 * 1024 })
          if (closed) return
          buildContent()
          server.moduleGraph.invalidateAll()
          server.ws.send({ type: 'full-reload' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          server.config.logger.error(message)
          server.ws.send({ type: 'error', err: { message, stack: '', plugin: 'retiam-documentation-content' } })
        } finally {
          running = false
          if (pending && !closed) void refresh()
        }
      }
      const rebuild = (_event: string, file: string) => {
        const contentChanged = file.startsWith(contentDirectory + '/')
        const sourceChanged = sourceDirectories.some(directory => file.startsWith(directory + '/')) || configurationFiles.includes(file)
        if (!contentChanged && !sourceChanged) return
        runtimeChanged ||= sourceChanged || file === path.join(contentDirectory, 'config.json') || (contentChanged && file.endsWith('.ts'))
        pending = true
        clearTimeout(timer)
        timer = setTimeout(() => { void refresh() }, 150)
      }
      server.watcher.on('all', rebuild)
      server.httpServer?.once('close', () => {
        clearTimeout(timer)
        closed = true
        server.watcher.off('all', rebuild)
      })
    },
  }
}

function staticDocumentationPages(): Plugin {
  let outputDirectory: string
  let base: string
  return {
    name: 'retiam-static-documentation-pages',
    apply: 'build',
    configResolved(config) {
      outputDirectory = path.resolve(config.root, config.build.outDir)
      base = config.base
    },
    writeBundle() {
      const catalog = JSON.parse(fs.readFileSync(path.join(site, 'src/data/generated/page-catalog.json'), 'utf8'))
      writeStaticPages(outputDirectory, catalog.pages, base)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ isPreview }) => {
  const builtIndex = path.join(site, 'dist/index.html')
  const previewBase = isPreview && fs.existsSync(builtIndex)
    ? fs.readFileSync(builtIndex, 'utf8').match(/src="([^"?]*?)assets\/index-[^"]+\.js"/)?.[1]
    : undefined
  return {
    base: normalizeBasePath(process.env.RETIAM_DOCS_BASE_PATH || previewBase || '/'),
    plugins: [documentationContent(), react(), staticDocumentationPages()],
    // The runtime HTML uses its own import map and is served as a static asset.
    // Scanning it as an application entry would try to resolve `retiam` in Vite.
    optimizeDeps: { entries: ['index.html'] },
    server: {
      port: 4000,
      open: true,
      watch: { ignored: ['**/src/data/generated/**'] },
    },
  }
})
