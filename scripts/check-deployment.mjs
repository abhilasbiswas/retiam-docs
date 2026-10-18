import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(site, 'dist');
const checkRuntime = process.argv.includes('--runtime');
const catalog = JSON.parse(fs.readFileSync(path.join(site, 'src/data/generated/page-catalog.json'), 'utf8'));
const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
const base = html.match(/src="([^"?]*?)assets\/index-[^"]+\.js"/)?.[1];
assert.ok(base?.startsWith('/'), 'Build the docs with an absolute base path before checking deployment.');
for (const folder of ['src', 'libs']) assert.equal(fs.existsSync(path.join(output, 'runtime/sources', folder)), false, 'Public output must not contain engine implementation files.');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.mp4': 'video/mp4' };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (base !== '/' && url.pathname === base.slice(0, -1)) {
    response.writeHead(301, { Location: `${base}${url.search}` }); response.end(); return;
  }
  const mount = base;
  const directory = output;
  if (!url.pathname.startsWith(mount)) { response.writeHead(404); response.end(); return; }
  let relative;
  try { relative = decodeURIComponent(url.pathname.slice(mount.length)); } catch { response.writeHead(400); response.end(); return; }
  let file = path.resolve(directory, relative);
  if (file !== directory && !file.startsWith(`${directory}${path.sep}`)) { response.writeHead(404); response.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) { response.writeHead(301, { Location: `${url.pathname}/${url.search}` }); response.end(); return; }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser, page;
const errors = [], missing = [], browserConsole = [], failedRequests = [];
try {
  // This server deliberately has no SPA fallback and no isolation headers.
  for (let offset = 0; offset < catalog.pages.length; offset += 20) {
    await Promise.all(catalog.pages.slice(offset, offset + 20).map(async page => {
      const response = await fetch(`${origin}${base}${page.id}/`);
      assert.equal(response.status, 200, `${page.id} must have a physical HTML entry.`);
      assert.ok((await response.text()).includes('assets/index-'), `${page.id} must load the app.`);
    }));
  }
  assert.equal((await fetch(`${origin}${base}missing-page/`)).status, 404);
  assert.equal((await fetch(`${origin}${base}runtime/missing.js`)).status, 404);
  const options = { headless: 'new', args: ['--no-sandbox'] };
  if (checkRuntime) options.args.push('--enable-unsafe-webgpu', '--autoplay-policy=no-user-gesture-required');
  if (process.env.PUPPETEER_EXECUTABLE_PATH) options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  browser = await puppeteer.launch(options);
  page = await browser.newPage();
  const reloadPage = async () => {
    const previousDocument = await page.evaluate(() => performance.timeOrigin);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(previous => performance.timeOrigin !== previous, {}, previousDocument);
  };
  await page.setViewport({ width: 1440, height: 1000 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') browserConsole.push(message.text()); });
  page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400) missing.push(response.url());
  });
  await page.goto(`${origin}${base}installation/?source=deployment-check`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
  await page.waitForFunction(title => document.querySelector('h1')?.textContent === title, {}, catalog.pages.find(item => item.id === 'installation').title);
  assert.equal(await page.evaluate(() => window.Prism?.manual), true, 'Automatic Prism DOM highlighting must be disabled for React-owned code.');
  await reloadPage();
  const nextHandle = await page.waitForFunction(title => document.querySelector('h1')?.textContent === title && document.querySelector('.doc-content-area')?.getAttribute('aria-busy') === 'false' && document.querySelector('.doc-pagination .next')?.getAttribute('href'), {}, catalog.pages.find(item => item.id === 'installation').title);
  const next = await nextHandle.jsonValue();
  assert.ok(next, 'Installation must retain its next page after refresh.');
  assert.ok(next.startsWith(base), 'Navigation must retain the deployment base.');
  await page.click('.doc-pagination .next');
  await page.waitForFunction(expected => location.pathname === expected, {}, next);
  await page.waitForSelector('.toc a');
  const anchor = await page.$eval('.toc a', element => element.getAttribute('href'));
  await page.click('.toc a');
  await page.waitForFunction(expected => location.hash === new URL(expected, location.href).hash, {}, anchor);
  await reloadPage();
  await page.waitForSelector('.toc a');
  await page.click('button[aria-label="Search documentation"]');
  await page.waitForSelector('#search-input');
  await page.type('#search-input', 'Scene.play');
  await page.waitForFunction(() => document.querySelector('.search-result-title')?.textContent === 'Scene.play', { timeout: 30000 });
  await page.click('.search-result-item');
  await page.waitForFunction(() => location.hash.startsWith('#api-scene-play'));
  await page.waitForFunction(() => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    return target && target.getBoundingClientRect().height > 0;
  });
  const compiler = await page.evaluate(async url => {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = url;
      script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
    });
    return { version: window.ts.version, output: window.ts.transpileModule('const value: number = 7;', { compilerOptions: { target: window.ts.ScriptTarget.ES2022 } }).outputText };
  }, `${base}runtime/typescript.js`);
  assert.ok(compiler.version && compiler.output.includes('const value = 7;'), 'The shared minified compiler must execute.');
  if (checkRuntime) {
    const result = await page.evaluate(async runtimeBase => {
      const token = crypto.randomUUID();
      const code = `import { Scene, FontResolver, RTImage, hex } from 'retiam';
        export default class DeploymentProbe extends Scene {
          async run() {
            const font = await FontResolver.resolve('roboto');
            if (!font.buffer.length) throw new Error('Missing CDN font');
            this.clearColor(hex('#080c14'));
            this.renderConfig.raytraceEnabled = false;
            this.camera.position.set([0, 0, 15]);
            const image = new RTImage(8, 4.5, '/res/media/image.jpg');
            this.add(image); this.camera.frame(image, { padding: 0.28 });
            await this.wait(1000);
          }
        }`;
      const frame = document.createElement('iframe');
      frame.style.cssText = 'width:800px;height:600px';
      const result = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Live scene startup timed out.')), 45000);
        const listener = event => {
          if (event.source !== frame.contentWindow || event.data?.token !== token) return;
          if (event.data.type === 'request-code') frame.contentWindow.postMessage({ type: 'run', token, code }, location.origin);
          if (event.data.type === 'ready') { clearTimeout(timer); window.removeEventListener('message', listener); resolve('ready'); }
          if (event.data.type === 'error') { clearTimeout(timer); window.removeEventListener('message', listener); reject(new Error(event.data.message)); }
        };
        window.addEventListener('message', listener);
      });
      frame.src = `${runtimeBase}viewer.html?${new URLSearchParams({ example: 'labs/pg-image', token, edited: '1' })}`;
      document.body.prepend(frame);
      try { return await result; } finally { frame.remove(); }
    }, `${base}runtime/`);
    assert.equal(result, 'ready');
    console.log('Verified a live WebGPU scene from edited TypeScript using the configured CDN, a CDN font, and a base-relative demo image.');
  }
  assert.deepEqual(errors, [], 'The documentation app must not throw browser errors.');
  assert.deepEqual(missing, [], 'The tested pages must not request missing local files.');
  console.log(`Verified ${catalog.pages.length} physical routes at ${base}, refreshes, section anchors, decoded API/search data, and compiler ${compiler.version}.`);
} catch (error) {
  if (page && !page.isClosed()) console.error('Deployment browser state:', { errors, missing, browserConsole, failedRequests, document: await page.evaluate(() => ({ url: location.href, ready: document.readyState, heading: document.querySelector('h1')?.textContent, root: document.querySelector('#root')?.innerHTML.slice(0, 300), text: document.querySelector('main')?.textContent.slice(0, 600) })).catch(() => null) });
  throw error;
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
