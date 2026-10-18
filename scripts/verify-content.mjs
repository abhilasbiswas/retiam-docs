import fs from 'node:fs';
import path from 'node:path';
import { buildContent, blocks, site } from './build-content.mjs';
import { readEngineReference } from './source-model.mjs';

let content, model;
try { ({ content, model } = buildContent()); }
catch (error) { console.error(error.message); process.exit(1); }
const coverage = model.coverage;
const reference = readEngineReference();
const recordedReference = new Set(reference.coverage.files.map(file => file.path));
const errors = [], recorded = new Set();
const pages = new Map(content.pages.map(page => [page.id, new Set(page.sections.map(section => section.id))]));
let blockCount = 0;
for (const page of content.pages) for (const section of page.sections) {
  blockCount += [...blocks(section.blocks)].length;
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

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Verified ${content.pages.length} pages, ${blockCount} blocks and ${coverage.files.length} reference destinations using the checked-in Retiam ${reference.version} API snapshot.`);
