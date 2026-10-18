# Deployment

This is a standalone Vite/React application. Publish only `dist/`. Its editable scenes load Retiam from the module URL in `content/config.json`.

## GitHub Pages

1. Create a public repository named `retiam-docs` and push this project to it.
2. Set `cdnUrl` in `content/config.json` to the published Retiam module URL, such as `https://cdn.jsdelivr.net/npm/retiam@latest/dist/retiam.es.min.js`. jsDelivr serves its sublibraries, chunks, and assets at their original relative paths. No installed engine package or engine checkout is required.
3. Open **Settings → Pages → Build and deployment** and set **Source → GitHub Actions**.
4. Push to `main` or run **Actions → Documentation Pages → Run workflow**.
5. Wait for the `build` and `deploy` jobs. The expected site is `https://abhilasbiswas.github.io/retiam-docs/`.

The workflow gets its base path from Pages. Pull requests run validation without deploying. Local previews and the deployed site both load Retiam from the public CDN. The workflow checks its availability, JavaScript MIME type, and CORS before deploying. Optional service URLs must use public HTTPS for deployment. No repository CDN variable is required.

The old engine repository needs no Pages workflow or documentation build scripts.

## Local checks

```bash
npm ci
npm run lint
npm test
RETIAM_DOCS_BASE_PATH=/retiam-docs/ npm run build
npm run preview
```

Open the preview URL printed by Vite, including `/retiam-docs/`. The base path must match the destination repository name.

```bash
npm run check:deployment
npm run check:deployment -- --runtime
npm run check:cdn
```

The deployment checker uses a temporary ordinary static server with no SPA fallback. It checks physical routes, reloads, anchors, search, and the compiler. `--runtime` also exercises an edited WebGPU scene using the CDN configured in `content/config.json`, a CDN font, and a documentation image. This optional runtime check needs network access to that CDN and a WebGPU-capable browser; neither check installs or serves a local engine package.

On macOS, use installed Chrome if Puppeteer's cached browser is incompatible:

```bash
PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run check:deployment -- --runtime
```

`check:cdn` probes the URL in `content/config.json`, including localhost when run on your machine, and verifies JavaScript MIME and appropriate CORS headers. Only GitHub Actions skips the probe for loopback URLs. Public CDN URLs are checked in both environments.

## Routes, content, and privacy

The build writes a physical `<page-id>/index.html` for every registered page, plus `404.html` and `.nojekyll`. Direct navigation and refreshes work on GitHub Pages. Unknown paths remain 404s.

Content, API data, search, example metadata, the editor, and scene media load on demand. Referenced media is copied from this repository's `assets/`; the engine's built-in assets remain part of its own package/CDN.

The site publishes its examples, versioned API descriptions, and engineering notes. Engine implementation files are not copied into `runtime/sources`. Reference data can describe internal APIs and behavior, so review it as public documentation before publishing. A private engine repository does not make the documentation or compiled npm library private.

## Optional services

GitHub Pages runs no backend. Demos that need external services require an explicit Run and report missing configuration.

Optional public service configuration belongs in `content/config.json`:

```json
{
  "cdnUrl": "https://cdn.jsdelivr.net/npm/retiam@latest/dist/retiam.es.min.js",
  "services": {
    "msedgeEndpoint": "https://speech.example.org/api/tts/msedge"
  }
}
```

Edge synthesis in the browser requires a compatible proxy with CORS. This service is not included in the site. Keep credentials on the service itself.

Local Studio, recording services, and CLI rendering run separately from the static documentation. WebGPU availability depends on the visitor's browser and GPU. Features requiring cross-origin isolation need hosting that supplies the necessary headers; GitHub Pages does not provide custom response headers.
