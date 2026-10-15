import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import { discoverExamples, readEngineReference, ts } from './source-model.mjs';
import { readDocsConfig } from './docs-config.mjs';
import { collectAuthoredMediaAssets, copyRuntimeAssets } from './runtime-assets.mjs';
import { inspectRuntimeSource, runtimeSourceTransformer } from './runtime/source-transform.js';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = site, output = path.join(site, 'public/runtime');
const reference = readEngineReference();
const config = readDocsConfig(), engineModule = config.cdnUrl;
const slash = value => value.split(path.sep).join('/');
const relativeImport = (from, to) => {
  const relative = slash(path.relative(path.dirname(from), to));
  return relative.startsWith('.') ? relative : `./${relative}`;
};

// Runtime is generated: stale scenes, sources and the old bundled engine must
// never leak into a static deployment.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.rmSync(path.join(site, 'src/data/generated/engine-build.json'), { force: true });
// Use the installed compiler for version consistency, minified once and shared
// by both editors. The old public/vendor copy could drift to another version.
const compiler = fs.readFileSync(new URL('../node_modules/typescript/lib/typescript.js', import.meta.url), 'utf8');
const minifiedCompiler = await transform(compiler, { minify: true, target: 'es2022', legalComments: 'eof' });
fs.writeFileSync(path.join(output, 'typescript.js'), minifiedCompiler.code);

const imports = { retiam: engineModule };
for (const folder of reference.libraries) imports[`retiam/${folder}`] = new URL(`libs/${folder}/index.js`, engineModule).href;
fs.writeFileSync(path.join(output, 'unsupported-node.js'), 'throw new Error("This example needs a Node service. See its requirements in the documentation.");\n');
for (const name of ['msedge-tts', 'module', 'node:module']) imports[name] = './unsupported-node.js';
fs.writeFileSync(path.join(output, 'earcut.js'), "export { earcut as default } from 'retiam';\n");
imports.earcut = './earcut.js';

function resolveFile(file, specifier) {
  const absolute = path.resolve(path.dirname(file), specifier);
  return [absolute, `${absolute}.ts`, `${absolute}.js`, path.join(absolute, 'index.ts')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}
const compiled = new Map(), metadata = new Map(), dependencies = new Map(), usedAssets = new Set();
function resolveModule(file, specifier) {
  if (!specifier.startsWith('.')) return specifier;
  const dependency = resolveFile(file, specifier);
  if (!dependency) throw new Error(`Missing import ${specifier} in ${slash(path.relative(root, file))}`);
  dependencies.get(file).add(dependency);
  return relativeImport(compiled.get(file), compile(dependency));
}
function compile(file) {
  if (compiled.has(file)) return compiled.get(file);
  const relative = slash(path.relative(root, file));
  if (relative.startsWith('../')) throw new Error(`Example import escapes repository: ${relative}`);
  const destination = path.join(output, 'modules', relative.replace(/\.ts$/, '.js'));
  compiled.set(file, destination);
  dependencies.set(file, new Set());
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const code = fs.readFileSync(file, 'utf8');
  const details = inspectRuntimeSource(ts, code, file);
  metadata.set(file, details);
  details.assets.forEach(asset => usedAssets.add(asset));
  if (!/\.[tj]s$/.test(file)) { fs.writeFileSync(destination, code); return destination; }
  const result = ts.transpileModule(code, {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, experimentalDecorators: true, verbatimModuleSyntax: false },
    transformers: { after: [runtimeSourceTransformer(ts, {
      assetModule: relativeImport(destination, path.join(output, 'asset-url.js')),
      resolveImport: specifier => resolveModule(file, specifier),
    })] },
  });
  const diagnostics = result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) || [];
  if (diagnostics.length) throw new Error(`${relative}: ${diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')).join('; ')}`);
  fs.writeFileSync(destination, result.outputText);
  return destination;
}
function moduleMetadata(file, visited = new Set()) {
  if (visited.has(file)) return { assets: [], services: [], localUrls: [], nodeImports: [], tts: false };
  visited.add(file);
  const all = [metadata.get(file), ...[...(dependencies.get(file) || [])].map(dependency => moduleMetadata(dependency, visited))];
  return Object.fromEntries(['assets', 'services', 'localUrls', 'nodeImports'].map(key => [key, [...new Set(all.flatMap(item => item?.[key] || []))]])
    .concat([['tts', all.some(item => item?.tts)]]));
}

const manifest = {}, examples = Object.values(discoverExamples());
for (const example of examples) {
  const sourceDestination = path.join(output, 'sources', example.source);
  fs.mkdirSync(path.dirname(sourceDestination), { recursive: true });
  fs.copyFileSync(path.join(root, example.source), sourceDestination);
  if (!example.scenes.length) continue;
  try {
    const file = path.join(root, example.source), module = compile(file);
    const original = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const replacements = {};
    for (const node of original.statements.filter(ts.isImportDeclaration).filter(node => !node.importClause?.isTypeOnly)) {
      const specifier = node.moduleSpecifier.text;
      if (!specifier.startsWith('.')) continue;
      const resolved = resolveModule(file, specifier);
      replacements[specifier] = resolved.startsWith('.')
        ? `./${slash(path.relative(output, path.resolve(path.dirname(module), resolved)))}` : resolved;
    }
    // Edited source can remove its own service usage. Helper imports retain the
    // requirements of their full module dependency graph.
    const dependencyRequirements = Object.fromEntries([...dependencies.get(file)].map(dependency => [
      `./${slash(path.relative(output, compiled.get(dependency)))}`, moduleMetadata(dependency),
    ]));
    manifest[example.id] = { module: `./${slash(path.relative(output, module))}`, replacements, requirements: moduleMetadata(file), dependencyRequirements };
  } catch (error) { manifest[example.id] = { error: error.message }; }
}

// Publish only documentation examples. Private engine implementations are not copied.
for (const asset of collectAuthoredMediaAssets(path.join(site, 'content'))) usedAssets.add(asset);
for (const folder of ['res', 'fonts', 'vendor', 'src/assets/fonts']) fs.rmSync(path.join(site, 'public', folder), { recursive: true, force: true });
const assets = copyRuntimeAssets({ root, assetDirectory: path.join(site, 'assets'), publicDirectory: path.join(site, 'public'), assets: usedAssets });
fs.writeFileSync(path.join(output, 'assets.json'), JSON.stringify(assets));
fs.writeFileSync(path.join(output, 'examples.json'), JSON.stringify(manifest));
fs.writeFileSync(path.join(output, 'runtime-config.js'), `export const services = ${JSON.stringify(config.services || {}).replace(/</g, '\\u003c')};\n`);
for (const name of ['viewer.js', 'viewer.css', 'asset-url.js', 'source-transform.js', 'check-scenes.html', 'check-scenes.js']) {
  fs.copyFileSync(path.join(site, 'scripts/runtime', name), path.join(output, name));
}
fs.writeFileSync(path.join(output, 'check-scenes.json'), JSON.stringify(examples.flatMap(example => example.scenes.map(scene => ({ id: example.id, source: example.source, sourceHash: example.sourceHash, export: scene.export, requirements: example.requirements })))));
const map = JSON.stringify({ imports }).replace(/</g, '\\u003c');
fs.writeFileSync(path.join(output, 'viewer.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="./viewer.css"><script type="importmap">${map}</script></head><body><canvas id="scene" aria-label="Interactive Retiam scene"></canvas><p id="status" role="status">Preparing scene…</p><script type="module" src="./viewer.js"></script></body></html>`);
console.log(`Prepared ${Object.keys(manifest).length} source-based scenes (${Object.values(manifest).filter(entry => entry.error).length} dependency errors), ${assets.copied.length} referenced assets, using ${engineModule}.`);
if (assets.missing.length) console.warn(`Examples reference unavailable assets: ${assets.missing.join(', ')}`);
if (Object.values(manifest).some(entry => entry.error)) process.exitCode = 1;
