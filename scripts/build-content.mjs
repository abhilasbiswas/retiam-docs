import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspectSources, discoverExamples } from './source-model.mjs';
import { compactApiEntries, compactSearchRecords } from '../src/lib/data-payload.mjs';
import { resolveDocsConfig } from './docs-config.mjs';

export const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const root = site;
export const contentDirectory = path.join(site, 'content');
const outputDirectory = path.join(site, 'src/data/generated');
const schemaPath = path.join(site, 'src/data/docs-schema.json');
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${path.relative(site, file)}: ${error.message}`);
  }
}

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Content symlinks are unsupported: ${file}`);
    if (entry.isDirectory()) yield* walk(file);
    else yield file;
  }
}

export function* blocks(items) {
  for (const block of items) {
    yield block;
    if (block.type === 'tabs') for (const tab of block.tabs) yield* blocks(tab.blocks);
    if (block.type === 'details') yield* blocks(block.blocks);
  }
}

// Keep the authoring schema derived from the existing runtime block definitions.
// codeFile is resolved before the runtime schema is validated.
export function generateAuthoringSchema() {
  const schema = readJson(schemaPath);
  schema.$ref = '#/definitions/ContentPage';
  schema.definitions.ContentPage.properties.$schema = { type: 'string' };
  for (const name of ['CodeBlock', 'PlaygroundBlock']) {
    const inline = schema.definitions[name];
    const file = structuredClone(inline);
    delete file.properties.code;
    file.properties.codeFile = { type: 'string' };
    file.required = file.required.map(key => key === 'code' ? 'codeFile' : key);
    schema.definitions[name] = { anyOf: [inline, file] };
  }
  writeIfChanged(path.join(site, 'src/data/docs-authoring-schema.json'), JSON.stringify(schema, null, 2) + '\n');
}

// The checked-in runtime schema uses these draft-07 keywords. Fail on extensions
// rather than silently accepting rules this lightweight validator cannot enforce.
function validateSchema(value, schema) {
  const keywords = new Set(['$ref', '$schema', 'definitions', 'type', 'properties',
    'required', 'additionalProperties', 'items', 'anyOf', 'const', 'enum']);
  function check(rule) {
    for (const [key, item] of Object.entries(rule)) {
      if (!keywords.has(key)) throw new Error(`Unsupported schema keyword: ${key}`);
      if (key === 'definitions' || key === 'properties') Object.values(item).forEach(check);
      else if (key === 'items') check(item);
      else if (key === 'anyOf') item.forEach(check);
    }
  }
  function validate(item, rule, location) {
    if (rule.$ref) return validate(item, rule.$ref.slice(2).split('/').reduce((obj, key) => obj[key], schema), location);
    if (rule.anyOf) {
      return rule.anyOf.some(option => validate(item, option, location).length === 0)
        ? [] : [`${location}: does not match any allowed schema shape`];
    }
    const errors = [];
    const actualType = Array.isArray(item) ? 'array' : item === null ? 'null' : typeof item;
    if (rule.type && actualType !== rule.type) return [`${location}: expected ${rule.type}, received ${actualType}`];
    if ('const' in rule && item !== rule.const) errors.push(`${location}: expected ${rule.const}`);
    if (rule.enum && !rule.enum.includes(item)) errors.push(`${location}: outside enum`);
    if (actualType === 'object') {
      for (const key of rule.required || []) if (!(key in item)) errors.push(`${location}: missing ${key}`);
      for (const [key, child] of Object.entries(item)) {
        if (rule.properties?.[key]) errors.push(...validate(child, rule.properties[key], `${location}.${key}`));
        else if (rule.additionalProperties === false) errors.push(`${location}: unknown property ${key}`);
      }
    }
    if (actualType === 'array' && rule.items) item.forEach((child, index) => errors.push(...validate(child, rule.items, `${location}[${index}]`)));
    return errors;
  }
  check(schema);
  return validate(value, schema, 'content');
}

function resolveCodeFiles(value, location, dependencies, directory) {
  if (Array.isArray(value)) return value.map((item, index) => resolveCodeFiles(item, `${location}[${index}]`, dependencies, directory));
  if (!value || typeof value !== 'object') return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveCodeFiles(item, `${location}.${key}`, dependencies, directory)]));
  if ('codeFile' in result) {
    if (!['code', 'playground'].includes(result.type) || 'code' in result || typeof result.codeFile !== 'string') {
      throw new Error(`${location}: codeFile requires a code/playground block without inline code`);
    }
    const file = path.resolve(directory, result.codeFile);
    const relative = path.relative(directory, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !relative.startsWith(`playgrounds${path.sep}`)) {
      throw new Error(`${location}: codeFile must point inside content/playgrounds/`);
    }
    // Also reject a symlink that resolves outside the allowed example directory.
    const realRelative = path.relative(fs.realpathSync(path.join(directory, 'playgrounds')), fs.realpathSync(file));
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) throw new Error(`${location}: codeFile escapes content/playgrounds/`);
    dependencies.add(file);
    result.code = fs.readFileSync(file, 'utf8');
    delete result.codeFile;
  }
  return result;
}

function validatePages(content, model) {
  const errors = validateSchema(content, readJson(schemaPath));
  if (errors.length) throw new Error(errors.join('\n'));
  const pages = new Map();
  const playgroundIds = new Set();
  for (const page of content.pages) {
    if (pages.has(page.id)) errors.push(`Duplicate page: ${page.id}`);
    if (!slug.test(page.id)) errors.push(`Unsafe page slug: ${page.id}`);
    const anchors = new Set();
    for (const section of page.sections) {
      if (anchors.has(section.id)) errors.push(`Duplicate anchor: ${page.id}#${section.id}`);
      if (!slug.test(section.id)) errors.push(`Unsafe anchor: ${page.id}#${section.id}`);
      anchors.add(section.id);
      if (section.blocks[0]?.type !== 'heading') errors.push(`Section needs leading heading: ${page.id}#${section.id}`);
      for (const block of blocks(section.blocks)) {
        if (block.type === 'class-hierarchy') {
          const matches = model?.hierarchy?.nodes.filter(node => node.id === block.root || node.name === block.root || `${node.source}:${node.name}` === block.root) || [];
          if (matches.length !== 1) errors.push(`Unknown or ambiguous hierarchy root: ${block.root}`);
        }
        if (block.type === 'api-reference') {
          if (!model || !Object.hasOwn(model.api,block.source)) errors.push(`Unknown API source: ${block.source}`);
          for (const entry of model && Object.hasOwn(model.api, block.source) ? model.api[block.source] : []) {
            if (anchors.has(entry.id)) errors.push(`Duplicate API anchor: ${page.id}#${entry.id}`);
            anchors.add(entry.id);
          }
        }
        if (block.type === 'example' && (!model || !Object.hasOwn(model.examples,block.example))) errors.push(`Unknown example: ${block.example}`);
        if (block.type === 'table') for (const row of block.rows) {
          if (row.cells.length !== block.columns.length) errors.push(`Table width mismatch: ${page.id}#${section.id}`);
          if (row.id) {
            if (!slug.test(row.id) || anchors.has(row.id)) errors.push(`Unsafe or duplicate table anchor: ${page.id}#${row.id}`);
            anchors.add(row.id);
          }
        }
        if (block.type === 'playground') {
          if (!block.id || playgroundIds.has(block.id)) errors.push(`Missing/duplicate playground ID: ${block.id}`);
          playgroundIds.add(block.id);
          if (!/export default class \w+ extends Scene/.test(block.code)) errors.push(`Playground default export: ${block.id}`);
        }
      }
    }
    pages.set(page.id, anchors);
  }
  function checkLink(url, pageId) {
    if (!url.startsWith('/') && !url.startsWith('#')) return;
    const [path, anchor] = url.startsWith('#') ? [pageId, url.slice(1)] : url.slice(1).split('#');
    const target = path.split('?')[0];
    if (!pages.has(target)) errors.push(`Broken page link from ${pageId}: ${url}`);
    else if (anchor && !pages.get(target).has(anchor)) errors.push(`Broken anchor from ${pageId}: ${url}`);
    const hierarchyRoot = target === 'class-hierarchy' && new URLSearchParams(path.split('?')[1]).get('type');
    if (hierarchyRoot && model) {
      const matches = model.hierarchy?.nodes.filter(node => node.id === hierarchyRoot || node.name === hierarchyRoot || `${node.source}:${node.name}` === hierarchyRoot) || [];
      if (matches.length !== 1) errors.push(`Broken hierarchy type from ${pageId}: ${url}`);
    }
  }
  function checkInline(value, pageId) {
    if (typeof value === 'string') {
      for (const match of value.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) checkLink(match[1], pageId);
    } else if (Array.isArray(value)) value.forEach(item => checkInline(item, pageId));
    else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
      if (key !== 'code' && key !== 'tex') checkInline(item, pageId);
    }
  }
  for (const page of content.pages) {
    checkInline(page, page.id);
    for (const section of page.sections) for (const block of blocks(section.blocks)) {
      if (block.type === 'link') checkLink(block.url, page.id);
    }
  }
  if (model) {
    for (const url of new Set(Object.values(model.lookup).flat().map(target=>target.url))) checkLink(url, 'API navigation');
    for (const [name, note] of Object.entries(model.notes || {})) checkInline(note, `API note ${name}`);
    for (const example of Object.values(model.examples)) {
      checkInline(example, `example ${example.id}`);
      for (const name of example.authoredRelated || []) if (!Object.hasOwn(model.lookup,name)) errors.push(`Unknown related API: ${example.id}: ${name}`);
    }
    for (const entries of Object.values(model.api)) for (const entry of entries) {
      if (entry.example && !Object.hasOwn(model.examples, entry.example)) errors.push(`Unknown API example: ${entry.qualified}: ${entry.example}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

export function loadContent(directory = contentDirectory, model) {
  const config = resolveDocsConfig(readJson(path.join(directory, 'config.json')));
  const navigation = readJson(path.join(directory, 'navigation.json'));
  if (Object.keys(navigation).some(key => !['groups'].includes(key)) || !Array.isArray(navigation.groups) || !navigation.groups.length) {
    throw new Error('content/navigation.json: expected a nonempty groups array');
  }
  const dependencies = new Set();
  const pageSources = new Map();
  const pages = new Map();
  // Any folder can contain pages. Top-level JSON files are the three manifests.
  for (const file of walk(directory)) {
    if (path.dirname(file) === directory || !file.endsWith('.json') || ['playgrounds', 'example-notes', 'api-notes'].some(folder => file.startsWith(path.join(directory, folder) + path.sep))) continue;
    const source = readJson(file);
    const { $schema, ...page } = source;
    if ($schema !== undefined && typeof $schema !== 'string') throw new Error(`${file}: $schema must be a string`);
    if (typeof page.id !== 'string' || !slug.test(page.id) || pages.has(page.id)) throw new Error(`${file}: missing, unsafe or duplicate page ID: ${page.id}`);
    const resolved = resolveCodeFiles(page, path.relative(site, file), dependencies, directory);
    pages.set(page.id, resolved);
    pageSources.set(page.id, path.relative(site, file).split(path.sep).join('/'));
  }
  const ordered = [];
  const included = new Set();
  const groupTitles = new Set();
  for (const group of navigation.groups) {
    if (!group || Object.keys(group).some(key => !['title', 'kind', 'pages'].includes(key)) || typeof group.title !== 'string' || !group.title.trim() || !Array.isArray(group.pages) || !group.pages.length || (group.kind !== undefined && !['guide', 'tutorial', 'reference'].includes(group.kind))) {
      throw new Error('content/navigation.json: each group needs a title and a nonempty pages array');
    }
    if (groupTitles.has(group.title)) throw new Error(`Duplicate navigation group: ${group.title}`);
    groupTitles.add(group.title);
    for (const id of group.pages) {
      if (typeof id !== 'string' || !pages.has(id)) throw new Error(`Navigation page does not exist: ${id}`);
      if (included.has(id)) throw new Error(`Duplicate navigation page: ${id}`);
      const page = pages.get(id);
      if (page.group !== group.title) throw new Error(`${id}: page group '${page.group}' differs from navigation group '${group.title}'`);
      included.add(id);
      ordered.push(page);
    }
  }
  for (const id of pages.keys()) if (!included.has(id)) throw new Error(`Page missing from navigation: ${id}`);
  for (const page of ordered) {
    if (page.estimatedMinutes !== undefined && (!Number.isInteger(page.estimatedMinutes) || page.estimatedMinutes < 1)) throw new Error(`Invalid tutorial time: ${page.id}`);
    const group = navigation.groups.find(group => group.title === page.group);
    if ((group.kind === 'tutorial' || page.difficulty) && page.id !== 'tutorials' && (!page.summary || !page.outcome || !page.difficulty || !page.estimatedMinutes || !page.prerequisites?.length)) throw new Error(`Tutorial needs summary, prerequisites, outcome, difficulty and time: ${page.id}`);
  }
  const content = { config, pages: ordered };
  validatePages(content, model);
  return { content, navigation, pageSources, dependencies };
}

// Authored guides supply a purpose statement. Generated reference pages get a
// concise description of their scope without repeating a section's prose.
export function pageSummary(page) {
  if (page.summary) return page.summary;
  if (page.id.startsWith('api-')) {
    const sources = page.sections.flatMap(section => [...blocks(section.blocks)])
      .filter(block => block.type === 'api-reference').map(block => path.basename(block.source));
    const scope = sources.slice(0, 3).map(name => `\`${name}\``).join(', ');
    return `Public signatures, arguments and implementation details${scope ? ` for ${scope}${sources.length > 3 ? ' and related modules' : ''}` : ''}. Internal and protected members can be included when exploring extensions.`;
  }
  if (page.group === 'Engineering notebooks') {
    const original = page.sections.flatMap(section => [...blocks(section.blocks)])
      .find(block => block.type === 'callout' && block.content.startsWith('Engineering notebook from'));
    const file = original?.content.match(/`([^`]+)`/)?.[1];
    return file ? `Original design rationale and implementation notes from \`${file}\`. Consult the linked API contracts for current behavior.` : 'Original design rationale and implementation notes, preserved alongside the current API contracts.';
  }
  if (page.group === 'Examples') return 'Editable scenes with source walkthroughs and experiments. Choose a scene, inspect how it works, and try your own changes.';
  if (page.group === 'Shader reference') return 'WGSL source and resource contracts for this stage of the rendering pipeline.';
  return undefined;
}

const cellText = cell => typeof cell === 'string' ? cell : cell.text;
const isDeclarationSnapshot = block => block.type === 'details' && block.title === 'Declaration snapshot and implementation notes';
function* searchBlocks(items) {
  for (const block of items) {
    // The live reference indexes each member already. Keep the historical body
    // inventory readable without duplicating it in search results.
    if (isDeclarationSnapshot(block)) continue;
    yield block;
    if (block.type === 'tabs') for (const tab of block.tabs) yield* searchBlocks(tab.blocks);
    if (block.type === 'details') yield* searchBlocks(block.blocks);
  }
}
function extractText(block) {
  if (isDeclarationSnapshot(block)) return '';
  const parts = [];
  if (block.text) parts.push(block.text);
  if (block.content) parts.push(block.content.replace(/\*\*/g, ''));
  if (block.items) {
    const listText = items => items.flatMap(item => typeof item === 'string' ? [item] : [item.text, ...listText(item.children || [])]);
    parts.push(...listText(block.items));
  }
  if (block.code) parts.push(block.code.slice(0, 200));
  if (block.rows) for (const row of block.rows) parts.push(...row.cells.map(cell => cellText(cell).replace(/\*\*/g, '')));
  if (block.tabs) for (const tab of block.tabs) parts.push(tab.label, ...tab.blocks.map(extractText));
  if (block.blocks) parts.push(block.title, ...block.blocks.map(extractText));
  return parts.join(' ').trim();
}

export function buildSearchIndex(pages, examples = {}, groups = []) {
  const records = [];
  for (const page of pages) {
    const base = { pageId: page.id, title: page.title, group: page.group, tutorial: Boolean(page.difficulty), category: groups.find(group => group.title === page.group)?.kind || 'guide' };
    records.push({ ...base, sectionId: '', heading: page.title, snippet: page.summary || page.group, type: 'page' });
    for (const section of page.sections) {
      const heading = section.blocks.find(block => block.type === 'heading')?.text || '';
      for (const block of searchBlocks(section.blocks)) {
        if (block.type === 'example' && examples[block.example]) {
          const example = examples[block.example];
          records.push({ ...base, sectionId: section.id, heading: block.title || example.title,
            snippet: [example.description, ...(example.walkthrough || []), ...(example.sourceNotes || [])].join(' ').replace(/\s+/g, ' ').slice(0, 360), type: 'example' });
        }
        if (block.type !== 'table') continue;
        for (const row of block.rows) {
          if (!row.cells.length) continue;
          const name = cellText(row.cells[0]);
          const parameter = row.cells[1] ? cellText(row.cells[1]) : '';
          const description = row.cells[2] ? cellText(row.cells[2]).replace(/\*\*/g, '') : '';
          records.push({ ...base, sectionId: row.id || section.id, heading: `${heading} › ${name}`, snippet: `${parameter}  —  ${description}`, type: 'api' });
        }
      }
      if (heading) records.push({ ...base, sectionId: section.id, heading,
        snippet: section.blocks.map(extractText).join(' ').replace(/\s+/g, ' ').trim().slice(0, 180), type: 'section' });
    }
  }
  return records;
}

function writeIfChanged(file, text) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Readers never observe a half-written page while the dev server rebuilds.
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, text);
  fs.renameSync(temporary, file);
}

// Inherited aliases share destinations. Store each target once in the browser index.
export function compactSymbols(lookup) {
  const targets = [], symbols = {}, known = new Map();
  for (const [name, entries] of Object.entries(lookup)) symbols[name] = entries.map(entry => {
    const key = JSON.stringify(entry);
    if (!known.has(key)) { known.set(key, targets.length); targets.push(entry); }
    return known.get(key);
  });
  return { targets, symbols };
}

export function assertExampleExplanations(examples) {
  for(const example of Object.values(examples)) {
    if(!example.scenes.length)continue;
    if(!example.walkthrough?.some(text=>text.trim())||!example.experiments?.some(text=>text.trim()))throw new Error(`${example.id}: every runnable example needs an authored walkthrough and experiment in content/example-notes/`);
    if(example.source && fs.readFileSync(path.join(root,example.source),'utf8').split('\n').length>300 &&
      (example.walkthrough.length<4 || example.walkthrough.join(' ').split(/\s+/).length<160)) throw new Error(`${example.id}: large examples need a staged walkthrough covering setup, behavior, interaction and integration constraints`);
  }
}

export function buildContent() {
  generateAuthoringSchema();
  const model = inspectSources();
  model.examples = discoverExamples();
  assertExampleExplanations(model.examples);
  // A class reference can show a repository scene that actually constructs it.
  for (const entries of Object.values(model.api)) for (const entry of entries) {
    if (entry.kind !== 'class' || entry.example) continue;
    const candidates = Object.values(model.examples).filter(example => example.scenes.length && !example.requirements.length && example.constructs.includes(entry.name) && (example.id.startsWith('labs/') || example.imports.some(imported => imported.names.includes(entry.name))));
    candidates.sort((a,b) => Number(b.id.startsWith('labs/')) - Number(a.id.startsWith('labs/')) || (b.walkthrough?.length || 0) - (a.walkthrough?.length || 0) || a.calls.length - b.calls.length || a.id.localeCompare(b.id));
    if (candidates[0]) entry.example = candidates[0].id;
  }
  const entriesById = new Map(Object.values(model.api).flat().map(entry => [entry.id, entry]));
  for (const node of model.hierarchy.nodes) {
    const example = entriesById.get(node.id)?.example;
    if (example) node.example = example;
  }
  for (const file of model.coverage.files) {
    const target = { name:file.path,url:`/${file.pageId}#${file.sectionId}`,source:file.path };
    model.lookup[file.path] ||= [target];
    const filename = path.basename(file.path);
    const destinations = model.lookup[filename] ||= [];
    if (!destinations.some(existing=>existing.url===target.url)) destinations.push(target);
  }
  const result = loadContent(contentDirectory, model);
  const { content, navigation } = result;
  for (const page of content.pages) page.summary ||= pageSummary(page);
  const guidePages = content.pages.filter(page=>!page.id.startsWith('api-') && page.group!=='Engineering notebooks' && page.group!=='Examples' && page.group!=='Shader reference');
  for (const file of model.coverage.files.filter(file=>model.api[file.path])) {
    const candidates = guidePages.filter(page=>JSON.stringify(page).includes(`/${file.pageId}#${file.sectionId}`));
    for (const entry of model.api[file.path]) entry.guides = candidates.slice(0,3).map(page=>({title:page.title,url:`/${page.id}`}));
  }
  const outputPages = path.join(outputDirectory, 'pages');
  fs.mkdirSync(outputPages, { recursive: true });
  for (const page of content.pages) writeIfChanged(path.join(outputPages, `${page.id}.json`), JSON.stringify(page) + '\n');
  const ids = new Set(content.pages.map(page => `${page.id}.json`));
  for (const file of fs.readdirSync(outputPages)) if (file.endsWith('.json') && !ids.has(file)) fs.unlinkSync(path.join(outputPages, file));
  writeIfChanged(path.join(outputDirectory, 'page-catalog.json'), JSON.stringify({
    config: content.config,
    groups: navigation.groups,
    pages: content.pages.map(({ id, title, group, summary, prerequisites, outcome, difficulty, estimatedMinutes }) => ({ id, title, group, summary, prerequisites, outcome, difficulty, estimatedMinutes })),
  }) + '\n');
  writeIfChanged(path.join(outputDirectory, 'symbol-index.json'), JSON.stringify(compactSymbols(model.lookup)) + '\n');
  writeIfChanged(path.join(outputDirectory, 'example-index.json'), JSON.stringify(model.examples) + '\n');
  writeIfChanged(path.join(outputDirectory, 'class-hierarchy.json'), JSON.stringify(model.hierarchy) + '\n');
  const apiFiles = {};
  const memberSearch = [];
  for (const [source, entries] of Object.entries(model.api)) {
    const filename = source.replace(/[^\w.-]/g, '_') + '.json';
    apiFiles[source] = filename;
    writeIfChanged(path.join(outputDirectory, 'api', filename), JSON.stringify(compactApiEntries(entries)) + '\n');
    for (const entry of entries) {
      const target = model.lookup[entry.qualified]?.find(t => t.source === source);
      if (!target) continue;
      const [pageId, sectionId] = target.url.slice(1).split('#');
      const page = content.pages.find(p => p.id === pageId);
      memberSearch.push({ pageId, sectionId, title: page.title, group: page.group, heading: entry.qualified, snippet: entry.description || entry.signatures[0], type:'api' });
    }
  }
  const expectedApiFiles = new Set(Object.values(apiFiles));
  for (const file of fs.readdirSync(path.join(outputDirectory, 'api'))) {
    if (file.endsWith('.json') && !expectedApiFiles.has(file)) fs.unlinkSync(path.join(outputDirectory, 'api', file));
  }
  writeIfChanged(path.join(outputDirectory, 'api-files.json'), JSON.stringify(apiFiles) + '\n');
  writeIfChanged(path.join(outputDirectory, 'search-index.json'), JSON.stringify(compactSearchRecords([...memberSearch, ...buildSearchIndex(content.pages, model.examples, navigation.groups)])) + '\n');
  writeIfChanged(path.join(outputDirectory, 'learning-coverage.json'), JSON.stringify({
    symbols: Object.values(model.api).flat().length,
    described: Object.values(model.api).flat().filter(e => e.description).length,
    narrativeDescriptions: Object.values(model.api).flat().filter(e => e.descriptionOrigin!=='source').length,
    sourceDerivedDescriptions: Object.values(model.api).flat().filter(e=>e.descriptionOrigin==='source').length,
    sourceContracts: Object.values(model.api).flat().filter(e => e.contract).length,
    runnableExamples: Object.values(model.examples).filter(e => e.scenes.length).length,
    supportingModules: Object.values(model.examples).filter(e => !e.scenes.length).length,
    examplesWithAuthoredWalkthrough: Object.values(model.examples).filter(e => e.walkthrough?.length).length,
    examplesWithSourceAnnotations: Object.values(model.examples).filter(e => !e.walkthrough?.length && e.sourceNotes?.length).length,
    largeExamples: Object.values(model.examples).filter(e=>e.scenes.length && fs.readFileSync(path.join(root,e.source),'utf8').split('\n').length>300).length,
    apiNeedingExplanation: Object.values(model.api).flat().filter(e => e.visibility === 'public' && e.descriptionOrigin === 'source').map(e=>({name:e.qualified,source:e.source})),
    parameters: Object.values(model.api).flat().flatMap(e=>(e.overloads||[{parameters:e.parameters}]).flatMap(o=>o.parameters)).length,
    narrativeParameters: Object.values(model.api).flat().flatMap(e=>(e.overloads||[{parameters:e.parameters}]).flatMap(o=>o.parameters)).filter(p=>p.descriptionOrigin!=='source').length,
  },null,2) + '\n');
  result.model = model;
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.includes('--schema-only')) generateAuthoringSchema();
    else {
      const { content } = buildContent();
      console.log(`Built ${content.pages.length} documentation pages and search index.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
