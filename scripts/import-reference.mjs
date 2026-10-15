import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { inspectEngineSources } from './engine-inspection.mjs';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engineRoot = process.argv[2] && path.resolve(process.argv[2]);
if (!engineRoot || !fs.existsSync(path.join(engineRoot, 'src/index.ts'))) {
  console.error('Usage: npm run reference:import -- /path/to/Retiam\nThis optional maintainer command refreshes API metadata; normal builds use the checked-in snapshot.');
  process.exit(1);
}
const coverage = JSON.parse(fs.readFileSync(path.join(site, 'content/coverage.json'), 'utf8'));
const recorded = new Set(coverage.files.map(file => file.path));
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const unmapped = ['src', 'libs'].flatMap(folder => walk(path.join(engineRoot, folder))).filter(file => /\.(ts|wgsl)$/.test(file)).map(file => path.relative(engineRoot, file).split(path.sep).join('/')).filter(file => !recorded.has(file));
if (unmapped.length) throw new Error(`Update content/coverage.json and its pages for new engine files before importing:\n${unmapped.join('\n')}`);
const model = inspectEngineSources(engineRoot);
const entry = model.program.getSourceFile(path.join(engineRoot, 'src/index.ts'));
const coreExports = model.checker.getExportsOfModule(model.checker.getSymbolAtLocation(entry)).map(symbol => symbol.name).filter(name => name !== 'default');
const libraries = fs.readdirSync(path.join(engineRoot, 'libs')).filter(name => fs.existsSync(path.join(engineRoot, 'libs', name, 'index.ts')));
const version = JSON.parse(fs.readFileSync(path.join(engineRoot, 'package.json'), 'utf8')).version;
const reference = { schemaVersion: 1, version, libraries, coreExports, api: model.api, lookup: model.lookup, coverage: model.coverage, notes: model.notes, hierarchy: model.hierarchy };
fs.mkdirSync(path.join(site, 'reference'), { recursive: true });
fs.writeFileSync(path.join(site, 'reference/engine.json.gz'), gzipSync(JSON.stringify(reference), { level: 9 }));
console.log(`Imported Retiam ${version} reference data for ${Object.keys(model.api).length} API modules. Engine source files were not copied.`);
