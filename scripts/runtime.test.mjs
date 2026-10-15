import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ts } from './source-model.mjs';
import { runtimeSourceTransformer, inspectRuntimeSource, isLoopbackOrigin, runtimeRequirements } from './runtime/source-transform.js';
import { resolveDocsAsset } from './runtime/asset-url.js';
import { collectAuthoredMediaAssets, copyRuntimeAssets } from './runtime-assets.mjs';

function transpile(code, resolveImport = specifier => specifier) {
  return ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    transformers: { after: [runtimeSourceTransformer(ts, { assetModule: 'https://example.org/Retiam/runtime/asset-url.js', resolveImport })] },
  }).outputText;
}

test('canonical and blob modules resolve assets from the deployment root', () => {
  for (const base of ['https://example.org/runtime/asset-url.js', 'https://example.org/Retiam/runtime/asset-url.js']) {
    const root = new URL('../', base).href;
    for (const asset of ['/res/media/image.jpg', '/fonts/custom.ttf', '/src/assets/fonts/roboto-msdf.json']) {
      assert.equal(resolveDocsAsset(asset, base), `${root}${asset.slice(1)}`);
    }
    assert.equal(resolveDocsAsset('https://cdn.example.org/image.jpg', base), 'https://cdn.example.org/image.jpg');
  }
});

test('AST rewriting covers URL values, template literals and static/dynamic imports without changing strings containing code', () => {
  const output = transpile(`import { helper } from './helper';
    export { other } from './other';
    const source = '/res/media/image.jpg';
    const font = \`/fonts/custom.ttf\`;
    const dynamicAsset = \`/res/media/\${name}.jpg\`;
    const explanation = "import './helper'";
    const key = { '/res/keep-key': source };
    void import('./dynamic');
    export { helper, source, font, dynamicAsset, explanation, key };`, value => value.startsWith('.') ? `https://example.org/Retiam/runtime/${value.slice(2)}.js` : value);
  assert.match(output, /import \{ docsAssetUrl as __docsAssetUrl_\d+ \} from "https:\/\/example.org\/Retiam\/runtime\/asset-url.js"/);
  assert.match(output, /source = __docsAssetUrl_\d+\("\/res\/media\/image.jpg"\)/);
  assert.match(output, /font = __docsAssetUrl_\d+\("\/fonts\/custom.ttf"\)/);
  assert.match(output, /dynamicAsset = __docsAssetUrl_\d+\(`/);
  assert.match(output, /from "https:\/\/example.org\/Retiam\/runtime\/helper.js"/);
  assert.match(output, /import\("https:\/\/example.org\/Retiam\/runtime\/dynamic.js"\)/);
  assert.match(output, /explanation = "import '\.\/helper'"/);
  assert.match(output, /'\/res\/keep-key': source/);
});

test('service requirements are explicit and do not start local services accidentally', () => {
  const edge = inspectRuntimeSource(ts, `import { speak } from 'retiam/tts'; await speak(scene, 'Hello', { provider: 'msedge' });`);
  assert.deepEqual(edge.services, ['msedgeEndpoint']);
  assert.match(runtimeRequirements(edge).join(' '), /RETIAM_DOCS_MSEDGE_ENDPOINT/);
  assert.deepEqual(runtimeRequirements(edge, { msedgeEndpoint: 'https://speech.example.org/api/tts' }), []);
  const kokoro = inspectRuntimeSource(ts, `import { TTS } from 'retiam/tts'; TTS.synthesize('Hello');`);
  assert.deepEqual(kokoro.services, ['modelBaseUrl']);
  assert.deepEqual(runtimeRequirements(kokoro, { modelBaseUrl: 'https://assets.example.org/models/' }), []);
  const local = inspectRuntimeSource(ts, `// fetch('http://localhost:9999/comment')
    const document = 'http://localhost:5173/studio/index.html';`);
  assert.equal(local.localUrls.length, 1);
  assert.match(runtimeRequirements(local)[0], /Edit the source/);
  assert.equal(inspectRuntimeSource(ts, `fetch('http://192.168.1.10/api'); fetch('http://[::1]:3000/');`).localUrls.length, 2);
  assert.deepEqual(inspectRuntimeSource(ts, 'export const ready = true;').services, []);
});

test('referenced assets include OBJ materials, textures and MSDF atlases without unrelated files', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'retiam-runtime-assets-'));
  const root = path.join(temporary, 'repository'), publicDirectory = path.join(temporary, 'output');
  const write = (name, text) => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
  try {
    write('public/res/model/scene.obj', 'mtllib scene.mtl\nv 0 0 0\n');
    write('public/res/model/scene.mtl', 'map_Kd -s 1 1 1 textures/color.png\nbump textures/normal.png\n');
    write('public/res/model/textures/color.png', 'color');
    write('public/res/model/textures/normal.png', 'normal');
    write('public/res/unrelated-large-file.mp4', 'unused');
    write('src/assets/fonts/custom.json', '{}');
    write('src/assets/fonts/custom.png', 'atlas');
    const result = copyRuntimeAssets({ root, publicDirectory, assets: ['/res/model/scene.obj', '/src/assets/fonts/custom.json'] });
    assert.equal(result.copied.length, 6);
    assert.deepEqual(result.missing, []);
    assert.equal(fs.readFileSync(path.join(publicDirectory, 'res/model/textures/color.png'), 'utf8'), 'color');
    assert.equal(fs.existsSync(path.join(publicDirectory, 'res/unrelated-large-file.mp4')), false);
    assert.throws(() => copyRuntimeAssets({ root, publicDirectory, assets: ['/res/../../outside'] }), /escapes its root/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test('authored image and video blocks retain their own media through nested tabs and details', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'retiam-authored-media-'));
  const root = path.join(temporary, 'repository'), contentDirectory = path.join(root, 'docs-site/content'), publicDirectory = path.join(temporary, 'output');
  const write = (name, text) => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
  try {
    write('public/images/diagram.png', 'image');
    write('public/res/video/tutorial.mp4', 'video');
    write('public/images/unused.png', 'unused');
    write('docs-site/content/guides/media.json', JSON.stringify({ id: 'media', sections: [{ blocks: [
      { type: 'image', url: '/images/diagram.png' },
      { type: 'tabs', tabs: [{ label: 'Watch', blocks: [{ type: 'details', blocks: [
        { type: 'video', url: '/res/video/tutorial.mp4?download=1' },
        { type: 'image', url: '/images/diagram.png' },
        { type: 'image', url: 'https://cdn.example.org/external.png' },
        { type: 'video', url: '//cdn.example.org/external.mp4' },
      ] }] }] },
    ] }] }));
    const assets = collectAuthoredMediaAssets(contentDirectory);
    assert.deepEqual(assets, ['/images/diagram.png', '/res/video/tutorial.mp4?download=1']);
    const result = copyRuntimeAssets({ root, publicDirectory, assets });
    assert.deepEqual(result.missing, []);
    assert.equal(fs.readFileSync(path.join(publicDirectory, 'images/diagram.png'), 'utf8'), 'image');
    assert.equal(fs.readFileSync(path.join(publicDirectory, 'res/video/tutorial.mp4'), 'utf8'), 'video');
    assert.equal(fs.existsSync(path.join(publicDirectory, 'images/unused.png')), false);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test('explicit local service runs work on loopback docs origins while public docs block local targets', () => {
  const metadata = inspectRuntimeSource(ts, `new RTHTML(24, 24, 'http://localhost:5173/studio/index.html');`);
  for (const origin of ['http://localhost:5174', 'http://127.0.0.1:4173', 'https://[::1]:4173', 'http://docs.localhost:4173']) {
    assert.equal(isLoopbackOrigin(origin), true);
    assert.deepEqual(runtimeRequirements(metadata, {}, { allowLocalServices: isLoopbackOrigin(origin) }), []);
  }
  for (const origin of ['https://abhilasbiswas.github.io', 'https://localhost.example.org', 'https://192.168.1.1', 'null']) {
    assert.equal(isLoopbackOrigin(origin), false);
    assert.match(runtimeRequirements(metadata, {}, { allowLocalServices: isLoopbackOrigin(origin) })[0], /local service/);
  }
  assert.match(runtimeRequirements(metadata)[0], /local service/);
});
