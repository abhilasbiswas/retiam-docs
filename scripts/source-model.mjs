import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import ts from 'typescript';
export { ts };
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = site;

export const slug = name => `api-${name.replace(/[^\w]+/g, '-').replace(/_/g, '-').toLowerCase()}`;
export function validateNote(note, kind, location) {
  const allowed = kind === 'api-notes' ? ['description','notes','example','parameters','returnsDescription'] : ['title','description','walkthrough','experiments','requirements','related','controls'];
  if (!note || typeof note !== 'object' || Array.isArray(note)) throw new Error(`${location}: expected a note object`);
  for (const [field,value] of Object.entries(note)) {
    if (!allowed.includes(field)) throw new Error(`${location}: unknown note field ${field}`);
    if (['description','title','example','returnsDescription'].includes(field) && typeof value !== 'string') throw new Error(`${location}.${field}: expected text`);
    if (['notes','walkthrough','experiments','requirements','related'].includes(field) && (!Array.isArray(value) || value.some(item=>typeof item!=='string'))) throw new Error(`${location}.${field}: expected an array of text`);
    if (field === 'parameters' && (!value || Array.isArray(value) || typeof value!=='object' || Object.values(value).some(item=>typeof item!=='string'))) throw new Error(`${location}.parameters: expected parameter descriptions`);
    if (field === 'controls') {
      if (!Array.isArray(value)) throw new Error(`${location}.controls: expected controls`);
      const names = new Set();
      for (const control of value) {
        if (!control || Object.keys(control).some(key=>!['name','label','value','options','min','max','step'].includes(key)) || typeof control.name!=='string' || !control.name || typeof control.label!=='string' || names.has(control.name)) throw new Error(`${location}: invalid or duplicate control`);
        names.add(control.name);
        if (control.options) {
          if (!Array.isArray(control.options) || !control.options.length || control.options.some(option=>typeof option!=='string') || !control.options.includes(control.value)) throw new Error(`${location}.${control.name}: default must be a selector option`);
        } else if (![control.min,control.max,control.step,control.value].every(Number.isFinite) || control.min>=control.max || control.step<=0 || control.value<control.min || control.value>control.max) throw new Error(`${location}.${control.name}: invalid slider range or default`);
      }
    }
  }
}
export function readNotes(folder) {
  const directory = path.join(site, 'content', folder);
  const notes=Object.create(null);
  if(!fs.existsSync(directory))return notes;
  for(const file of fs.readdirSync(directory).filter(f=>f.endsWith('.json')).sort()) {
    for(const [key,value] of Object.entries(JSON.parse(fs.readFileSync(path.join(directory,file),'utf8')))) {
      if(Object.hasOwn(notes,key))throw new Error(`Duplicate ${folder} entry: ${key}`);
      validateNote(value,folder,`${folder}/${file}:${key}`);
      notes[key]=value;
    }
  }
  return notes;
}

function docText(value) {
  return (typeof value === 'string' ? value : (value || []).map(part =>
    [ts.SyntaxKind.JSDocLink, ts.SyntaxKind.JSDocLinkCode, ts.SyntaxKind.JSDocLinkPlain].includes(part.kind) ? part.getText() : part.text || '').join(''))
    .replace(/\[\[([^\]]+)\]\]/g,'`$1`')
    .replace(/\{@link(?:code|plain)?\s+([^}\s]+)(?:\s+([^}]+))?\}/g,(_match,target,label)=>label?`${label} (\`${target}\`)`:`\`${target}\``);
}
function comment(node) { return (node.jsDoc || []).map(doc => docText(doc.comment)).join('\n\n'); }
export function readEngineReference() {
  const reference = JSON.parse(gunzipSync(fs.readFileSync(path.join(site, 'reference/engine.json.gz'))));
  if (reference.schemaVersion !== 1 || !reference.version || !reference.api || !reference.hierarchy || !Array.isArray(reference.libraries) || !Array.isArray(reference.coreExports)) {
    throw new Error('Invalid versioned engine reference. Refresh it with npm run reference:import -- /path/to/Retiam.');
  }
  return reference;
}

// Normal builds read versioned documentation data, never a private checkout.
export function inspectSources() {
  const reference = readEngineReference();
  reference.coverage = JSON.parse(fs.readFileSync(path.join(site, 'content/coverage.json'), 'utf8'));
  reference.notes = readNotes('api-notes');
  const entries = Object.values(reference.api).flat();
  for (const [key, note] of Object.entries(reference.notes)) {
    const separator = key.indexOf(':');
    const matches = entries.filter(entry => separator === -1 ? entry.qualified === key : `${entry.source}:${entry.qualified}` === key);
    if (!matches.length) throw new Error(`Unknown API note: ${key}`);
    for (const entry of matches) {
      for (const field of ['description', 'notes', 'example', 'returnsDescription']) if (note[field] !== undefined) entry[field] = note[field];
      if (note.description !== undefined) entry.descriptionOrigin = 'authored';
      for (const [name, description] of Object.entries(note.parameters || {})) {
        const parameters = (entry.overloads || [{ parameters: entry.parameters }]).flatMap(overload => overload.parameters).filter(parameter => parameter.name === name);
        if (!parameters.length) throw new Error(`Unknown API parameter: ${key}.${name}`);
        for (const parameter of parameters) { parameter.description = description; parameter.descriptionOrigin = 'authored-or-jsdoc'; }
      }
    }
  }
  return reference;
}

export function discoverExamples() {
  const registrySource = fs.readFileSync(path.join(root, 'examples/demos.ts'), 'utf8');
  // The checked-in registry is data-only. Parse its literal with TypeScript; never execute source.
  const registry = new Map();
  const ast = ts.createSourceFile('registry.ts', registrySource, ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const fields = Object.fromEntries(node.properties.filter(p => ts.isPropertyAssignment(p) && ts.isStringLiteral(p.initializer)).map(p => [p.name.getText(ast), p.initializer.text]));
      if (fields.id) registry.set(fields.id, fields);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const notes = readNotes('example-notes'), examples = Object.create(null);
  function walk(directory) { return fs.readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name)).flatMap(e => e.isDirectory() ? walk(path.join(directory,e.name)) : [path.join(directory,e.name)]); }
  const files = [...walk(path.join(root,'examples/demos')), ...walk(path.join(site,'content/playgrounds'))].filter(f => f.endsWith('.ts'));
  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const id = relative.startsWith('examples/demos/') ? relative.slice('examples/demos/'.length,-3) : `labs/${path.basename(file,'.ts')}`;
    const code = fs.readFileSync(file, 'utf8'), source = ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true);
    const scenes = source.statements.filter(n => ts.isClassDeclaration(n) && n.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) && n.heritageClauses?.some(c => c.types.some(t => /(?:^|\.)Scene$/.test(t.expression.getText(source))))).map(n => ({ name:n.name?.text || 'default', export: n.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword) ? 'default' : n.name.text }));
    // A codeFile can be a host or build configuration rather than a scene.
    // Keep those snippets out of the live lab catalog; imported scene helpers
    // are still compiled transitively by build-runtime.
    if (relative.startsWith('content/playgrounds/') && !scenes.length) continue;
    const imports = source.statements.filter(ts.isImportDeclaration).map(n => ({ module:n.moduleSpecifier.text, names:n.importClause?.namedBindings && ts.isNamedImports(n.importClause.namedBindings) ? n.importClause.namedBindings.elements.map(e => (e.propertyName || e.name).text) : [] }));
    const calls = new Set(), constructs = new Set();
    function scan(node) {
      if(ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) calls.add(node.expression.name.text);
      if(ts.isNewExpression(node)) constructs.add(node.expression.getText(source));
      ts.forEachChild(node,scan);
    } scan(source);
    const assetPaths = new Set();
    function findAssets(node) {
      if (ts.isStringLiteralLike(node) && /^\/(res|assets|fonts|vendor)\//.test(node.text)) assetPaths.add(node.text);
      ts.forEachChild(node,findAssets);
    }
    findAssets(source);
    const assets = [...assetPaths];
    const meta = registry.get(id) || {}, note = notes[id] || {};
    const run=source.statements.filter(ts.isClassDeclaration).flatMap(n=>n.members).find(n=>n.name?.getText(source)==='run');
    const sourceNotes = [...(run?.body?.getText(source)||'').matchAll(/^\s*\/\/\s*(?:\d+[.)]\s*)(.+)$/gm)].map(m=>m[1].trim()).filter(text=>text.length>12).slice(0,10);
    const requirements=[];
    for(const asset of assets) if(!fs.existsSync(path.join(site,'assets',asset.slice(1)))) requirements.push(`This source references \`${asset}\`, which is not present in the repository's public assets. Provide that asset or change the source before using that part of the example.`);
    if(imports.some(i=>i.module==='retiam/tts')) {
      requirements.push('Microsoft Edge narration needs the /api/tts/msedge service from the Retiam development server, or a configured msedgeEndpoint. A static documentation preview does not supply that service.');
    }
    if (note.controls?.length && !source.statements.filter(ts.isClassDeclaration).some(node=>node.members.some(member=>member.name?.getText(source)==='setParameter'))) throw new Error(`Example controls need setParameter: ${id}`);
    examples[id] = { id, source:relative, sourceHash:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), title:note.title || meta.name || path.basename(file,'.ts').replace(/_/g,' '), description:note.description || meta.description || comment(source.statements.find(ts.isClassDeclaration) || {}), scenes, imports, calls:[...calls], constructs:[...constructs], assets, sourceNotes, related:imports.flatMap(i=>i.names).filter(n=>!['Scene','Color','Vec2','Vec3'].includes(n)).slice(0,12), ...note, authoredRelated:note.related || [], requirements:[...new Set([...requirements,...(note.requirements||[])])] };
  }
  for (const key of Object.keys(notes)) if (!examples[key]) throw new Error(`Unknown example note: ${key}`);
  return examples;
}
