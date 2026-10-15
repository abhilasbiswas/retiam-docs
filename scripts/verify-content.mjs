import fs from 'node:fs';
import path from 'node:path';
import { buildContent, blocks, site } from './build-content.mjs';
import { readEngineReference, ts } from './source-model.mjs';

let content, model;
try { ({ content, model } = buildContent()); }
catch (error) { console.error(error.message); process.exit(1); }
const coverage = model.coverage;
const reference = readEngineReference();
const recordedReference = new Set(reference.coverage.files.map(file => file.path));
const errors = [], recorded = new Set(), playgrounds = [];
const pages = new Map(content.pages.map(page => [page.id, new Set(page.sections.map(section => section.id))]));
let blockCount = 0;
for (const page of content.pages) for (const section of page.sections) for (const block of blocks(section.blocks)) {
  blockCount++;
  if (block.type === 'playground') playgrounds.push({ ...block, pageId: page.id, sectionId: section.id });
}
for (const item of coverage.files) {
  if (recorded.has(item.path)) errors.push(`Duplicate coverage file: ${item.path}`);
  recorded.add(item.path);
  if (!recordedReference.has(item.path)) errors.push(`Reference snapshot has no coverage for: ${item.path}`);
  if (item.path.startsWith('examples/') && !fs.existsSync(path.join(site, item.path))) errors.push(`Example removed: ${item.path}`);
  if (!pages.get(item.pageId)?.has(item.sectionId)) errors.push(`Coverage destination missing: ${item.path}`);
  if (item.exports?.length) {
    const section = content.pages.find(page => page.id === item.pageId)?.sections.find(section => section.id === item.sectionId);
    if (!section) continue;
    const text = JSON.stringify(section) + (item.path.startsWith('examples/demos/') ? JSON.stringify(model.examples[item.path.slice('examples/demos/'.length, -3)]) : '');
    for (const name of item.exports) if (name !== 'default' && !text.includes(name)) errors.push(`Export missing from reference: ${item.path}: ${name}`);
  }
}

// Check scenes against the installed package's declarations, not private source.
const examples = [...playgrounds];
for (const example of Object.values(model.examples).filter(example => example.id.startsWith('labs/') && example.scenes.length)) examples.push({
  type: 'playground', code: fs.readFileSync(path.join(site, example.source), 'utf8'), filename: example.source, pageId: 'interactive-labs', sectionId: example.id,
});
for (const page of content.pages.filter(page => page.group !== 'Engineering notebooks' && !page.id.startsWith('api-'))) {
  for (const section of page.sections) for (const block of blocks(section.blocks)) {
    if (block.type === 'code' && block.language === 'typescript' && /export (?:default )?class/.test(block.code)) examples.push({ ...block, pageId: page.id, sectionId: section.id });
  }
}
const options = {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], types: ['@webgpu/types', 'vite/client'],
  strict: false, skipLibCheck: true, noEmit: true, experimentalDecorators: true,
};
const directory = path.join(site, '.docs-validation');
const virtual = new Map(examples.map((example, index) => [path.join(directory, `${index}.ts`), {
  code: (example.type === 'playground' && !/^import\s/m.test(example.code) ? `import { ${reference.coreExports.join(', ')} } from 'retiam';\n` : '') + example.code,
  location: `${example.pageId}#${example.sectionId}: ${example.filename || 'complete class example'}`,
}]));
const host = ts.createCompilerHost(options);
const originalRead = host.readFile, originalExists = host.fileExists, originalGet = host.getSourceFile, originalDirectory = host.directoryExists;
host.readFile = file => virtual.has(file) ? virtual.get(file).code : originalRead(file);
host.fileExists = file => virtual.has(file) || originalExists(file);
host.directoryExists = file => file === directory || originalDirectory(file);
host.getSourceFile = (file, language, onError, fresh) => virtual.has(file) ? ts.createSourceFile(file, virtual.get(file).code, language, true) : originalGet(file, language, onError, fresh);
const program = ts.createProgram([...virtual.keys()], options, host);
for (const diagnostic of ts.getPreEmitDiagnostics(program).filter(item => !item.file || virtual.has(item.file.fileName))) {
  const position = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start);
  const location = diagnostic.file ? `${virtual.get(diagnostic.file.fileName).location}:${position.line + 1}` : 'TypeScript configuration';
  errors.push(`${location}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Verified ${content.pages.length} pages, ${blockCount} blocks, ${coverage.files.length} reference destinations and ${examples.length} scene examples against Retiam ${reference.version}.`);
