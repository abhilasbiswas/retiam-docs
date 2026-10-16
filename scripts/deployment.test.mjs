import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDocsConfig, normalizeBasePath, isLoopbackUrl } from './docs-config.mjs';
import { staticPageEntries } from './static-pages.mjs';
import { checkModuleCdn } from './check-cdn.mjs';

test('local and public CDN deployment use the configuration file', () => {
  const local = { cdnUrl: 'http://localhost:3000/retiam.es.js' };
  assert.deepEqual(resolveDocsConfig(local, {}), local);
  assert.deepEqual(resolveDocsConfig(local, { RETIAM_DOCS_DEPLOY: '1' }), local);
  const result = resolveDocsConfig({ ...local, cdnUrl: 'https://cdn.example.org/retiam@1.0.0/dist/retiam.es.js' }, {
    RETIAM_DOCS_DEPLOY: '1',
    RETIAM_DOCS_MSEDGE_ENDPOINT: 'https://api.example.org/tts/',
  });
  assert.equal(result.services.msedgeEndpoint, 'https://api.example.org/tts');
  assert.equal(local.cdnUrl, 'http://localhost:3000/retiam.es.js');
  for (const cdnUrl of ['http://127.0.0.1/lib.js', 'https://localhost./lib.js', 'http://engine.localhost:3000/lib.js', 'http://[::1]/lib.js', 'http://[::ffff:127.0.0.1]/lib.js', 'http://2130706433/lib.js']) {
    assert.equal(isLoopbackUrl(cdnUrl), true, cdnUrl);
    assert.equal(resolveDocsConfig({ cdnUrl }, { RETIAM_DOCS_DEPLOY: '1' }).cdnUrl, new URL(cdnUrl).href);
  }
  for (const cdnUrl of ['https://192.168.0.1/lib.js', 'https://[::ffff:192.168.0.1]/lib.js', 'http://cdn.example.org/lib.js', 'http://localhost.example.org/lib.js', 'https://engine.local/lib.js', 'https://[::]/lib.js']) {
    assert.equal(isLoopbackUrl(cdnUrl), false, cdnUrl);
    assert.throws(() => resolveDocsConfig({ cdnUrl }, { RETIAM_DOCS_DEPLOY: '1' }), /public HTTPS/);
  }
  for (const cdnUrl of ['javascript:alert(1)', '/retiam.es.js', 'https://user:secret@example.org/lib.js', 'https://example.org/lib.js#fragment']) {
    assert.throws(() => resolveDocsConfig({ cdnUrl }, {}), /HTTP\(S\)/);
  }
  assert.throws(() => resolveDocsConfig({ ...local, services: { msedgeEndpoint: 'http://localhost:8000/tts' } }, { RETIAM_DOCS_DEPLOY: '1' }), /public HTTPS/);
  assert.throws(() => resolveDocsConfig({ cdnUrl: ['https://cdn.example.org/lib.js'] }, {}), /URL string/);
  assert.throws(() => resolveDocsConfig({ ...local, services: { msedgeEndpoint: ['https://speech.example.org'] } }, {}), /URL string/);
  assert.throws(() => resolveDocsConfig({ ...local, services: null }, {}), /services must be an object/);
});

test('base paths support repository hosting and reject ambiguous relative paths', () => {
  assert.equal(normalizeBasePath('/'), '/');
  assert.equal(normalizeBasePath('/Retiam'), '/Retiam/');
  assert.equal(normalizeBasePath('/Retiam/'), '/Retiam/');
  for (const base of ['Retiam', '//example.org', '/a/../b', '/a/%2e%2e/', '/a?b', '/a\\b']) assert.throws(() => normalizeBasePath(base));
});

test('every page gets a static entry with escaped metadata and stable section URLs', () => {
  const html = '<html><head><title>Default</title><meta name="description" content="Default" /></head><body><script type="module" src="/Retiam/assets/main.js"></script></body></html>';
  const [[file, source]] = staticPageEntries(html, [{ id: 'first-scene', title: 'A <scene>', summary: 'Use "safe" & explicit URLs' }], '/Retiam/');
  assert.equal(file, 'first-scene/index.html');
  assert.ok(source.includes('A &lt;scene&gt; | Retiam Documentation'));
  assert.ok(source.includes('Use &quot;safe&quot; &amp; explicit URLs'));
  assert.ok(source.includes('src="/Retiam/assets/main.js"'));
  for (const id of ['../escape', 'runtime', 'invalid/route']) assert.throws(() => staticPageEntries(html, [{ id, title: 'Unsafe' }], '/Retiam/'));
});

test('publishing checks reject missing packages, HTML responses, and incompatible CDN CORS', async () => {
  const url = 'https://cdn.example.org/retiam@1.0.0/dist/retiam.es.js';
  const origin = 'https://docs.example.org';
  const respond = (status, type, cors, body = 'export const version = "1.0.0";') => async () => new Response(body, { status, headers: { 'content-type': type, ...(cors ? { 'access-control-allow-origin': cors } : {}) } });
  await checkModuleCdn(url, origin, respond(200, 'application/javascript', '*'));
  await checkModuleCdn('http://localhost:3000/retiam.es.js', origin, respond(200, 'text/javascript', '*'));
  await assert.rejects(checkModuleCdn('http://localhost:3000/retiam.es.js', origin, respond(200, 'text/javascript')), /cross-origin module/);
  await checkModuleCdn(url, origin, respond(200, 'text/javascript', origin));
  await checkModuleCdn(`${origin}/engine/retiam.es.js`, origin, respond(200, 'text/javascript'));
  await assert.rejects(checkModuleCdn(url, origin, respond(404, 'text/plain', '*')), /configured engine module/);
  await assert.rejects(checkModuleCdn(url, origin, respond(200, 'text/html', '*')), /serve JavaScript/);
  await assert.rejects(checkModuleCdn(url, origin, respond(200, 'text/javascript', 'https://other.example.org')), /cross-origin module/);
});
