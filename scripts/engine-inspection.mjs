import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildClassHierarchy } from './hierarchy-model.mjs';
import { declarationContract, contractSummary, parameterContract } from './api-contracts.mjs';
import { readNotes, slug, ts } from './source-model.mjs';
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function docText(value) {
  return (typeof value === 'string' ? value : (value || []).map(part =>
    [ts.SyntaxKind.JSDocLink, ts.SyntaxKind.JSDocLinkCode, ts.SyntaxKind.JSDocLinkPlain].includes(part.kind) ? part.getText() : part.text || '').join(''))
    .replace(/\[\[([^\]]+)\]\]/g,'`$1`')
    .replace(/\{@link(?:code|plain)?\s+([^}\s]+)(?:\s+([^}]+))?\}/g,(_match,target,label)=>label?`${label} (\`${target}\`)`:`\`${target}\``);
}
function comment(node) { return (node.jsDoc || []).map(doc => docText(doc.comment)).join('\n\n'); }
function tagText(tag) { return docText(tag.comment); }
function signature(node, file) {
  const end = node.body?.pos ?? node.end;
  return node.getText(file).slice(0, end - node.getStart(file)).trim().replace(/;$/, '');
}
export function inspectEngineSources(engineRoot) {
  const root = path.resolve(engineRoot);
  const coverage = JSON.parse(fs.readFileSync(path.join(site, 'content/coverage.json'), 'utf8'));
  const notes = readNotes('api-notes');
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile).config;
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);
  const files = coverage.files.filter(f => /^(src|libs)\/.*\.ts$/.test(f.path));
  const program = ts.createProgram(files.map(f => path.join(root, f.path)), { ...parsed.options, noEmit: true });
  const checker = program.getTypeChecker();
  const api = Object.create(null), lookup = Object.create(null), aliases = [], modules = Object.create(null);
  function register(name, item) {
    const targets = lookup[name] ||= [];
    if (!targets.some(t => t.url === item.url)) targets.push(item);
  }
  for (const file of files) {
    const source = program.getSourceFile(path.join(root, file.path));
    if (!source || !file.pageId.startsWith('api-')) continue;
    const entries = [], seen = new Map(), bodies = new Map();
    modules[file.path] = { url: `/${file.pageId}#${file.sectionId}`, name: file.path };
    function record(node, name, owner, kind) {
      const qualified = owner ? `${owner}.${name}` : name;
      const key = `${file.path}:${qualified}`;
      const id = `${slug(qualified)}-${crypto.createHash('sha1').update(file.path + ':' + qualified).digest('hex').slice(0,7)}`;
      const tags = (node.jsDoc || []).flatMap(d => d.tags || []);
      const visibility = node.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword) || name.startsWith('_') || tags.some(t => t.tagName.text === 'internal') ? 'internal' : node.modifiers?.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword) ? 'protected' : 'public';
      const target = { url: `/${file.pageId}#${id}`, name: qualified, source: file.path, visibility };
      const note = notes[key] || notes[qualified] || {};
      const parameters = (node.parameters || []).map(p => ({ name: p.name.getText(source),
        type: p.type?.getText(source) || checker.typeToString(checker.getTypeAtLocation(p)),
        optional: !!p.questionToken || !!p.initializer, rest: !!p.dotDotDotToken,
        default: p.initializer?.getText(source),
        description: note.parameters?.[p.name.getText(source)] || tags.filter(t => t.tagName.text === 'param' && t.name?.getText(source) === p.name.getText(source)).map(tagText).join(' ') }));
      let entry = seen.get(qualified);
      const text = signature(node, source);
      if (entry) {
        const implementation = node.body && !bodies.get(qualified) && ['method','function','constructor'].includes(kind);
        if (!implementation && !entry.signatures.includes(text)) {
          entry.overloads ||= [{signature:entry.signatures[0],parameters:entry.parameters}];
          entry.overloads.push({signature:text,parameters});
          entry.signatures.push(text);
        }
        if (implementation) {
          for (const overload of entry.overloads || [{parameters:entry.parameters}]) for (const parameter of overload.parameters) {
            const actual = parameters.find(p=>p.name===parameter.name);
            if (actual?.default!==undefined) parameter.default=actual.default;
            if (!parameter.description && actual?.description) parameter.description=actual.description;
          }
        }
        if (node.body) bodies.set(qualified,true);
        if (node.body) {
          const actual = declarationContract(ts,node,source,checker);
          if (!entry.contract || entry.contract.declarationOnly) entry.contract = actual;
          else for (const field of ['returns','yields','writes','calls','throws','guards']) {
            const existing = new Set(entry.contract[field].map(value=>JSON.stringify(value)));
            entry.contract[field].push(...actual[field].filter(value=>!existing.has(JSON.stringify(value))));
          }
          entry.contract.parameters = {...entry.contract.parameters,...actual.parameters};
          entry.contract.empty &&= actual.empty;
        }
        entry.endLine = source.getLineAndCharacterOfPosition(node.end).line + 1;
        if (!entry.description && comment(node)) {
          entry.description = comment(node);
          entry.descriptionOrigin = 'jsdoc';
        }
        return;
      }
      const type = checker.getTypeAtLocation(node);
      entry = { id, name, qualified, kind, visibility, source: file.path,
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        endLine: source.getLineAndCharacterOfPosition(node.end).line + 1,
        entryPoints: file.entryPoints || [], signatures: [text],
        description: note.description || comment(node), notes: note.notes || [], example: note.example,
        descriptionOrigin: note.description ? 'authored' : comment(node) ? 'jsdoc' : 'source',
        contract: declarationContract(ts,node,source,checker),
        parameters,
        returns: node.parameters && !ts.isConstructorDeclaration(node) ? node.type?.getText(source) || checker.typeToString(checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(node))) : '',
        returnsDescription: note.returnsDescription || tags.filter(t => ['returns','return'].includes(t.tagName.text)).map(tagText).join(' '),
        default: node.initializer?.getText(source),
        tags: tags.filter(t => !['param', 'internal'].includes(t.tagName.text)).map(t => ({ name: t.tagName.text, text: tagText(t) })),
      };
      if (kind === 'class' || kind === 'interface') {
        // Keep full declarations in the original reference; this header is readable.
        entry.signatures = [text.split('{')[0].trim()];
        entry.bases = (node.heritageClauses || []).flatMap(c => c.types.map(t => t.getText(source)));
        for (const base of checker.getBaseTypes(type) || []) {
          for (const member of checker.getPropertiesOfType(base)) aliases.push({ alias: `${name}.${member.name}`, declaration: member.valueDeclaration || member.declarations?.[0], ownerEntry:entry });
        }
      }
      entries.push(entry); seen.set(qualified, entry);
      bodies.set(qualified,!!node.body);
      register(qualified, target);
      if (!owner) register(name, target);
    }
    for (const node of source.statements) {
      // Public prototype shortcuts declared through module augmentation belong
      // to the augmented type, even though their signatures live in another file.
      if (ts.isModuleDeclaration(node) && node.body && ts.isModuleBlock(node.body)) {
        for (const declaration of node.body.statements.filter(ts.isInterfaceDeclaration)) {
          for (const member of declaration.members) if (member.name) record(member,member.name.getText(source),declaration.name.text,ts.isMethodSignature(member)?'method':'property');
        }
      }
      if (!node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name)) continue;
          // The doc comment belongs to the variable statement.
          record(declaration, declaration.name.text, '', 'constant');
          const entry = seen.get(declaration.name.text);
          if (entry && !entry.description && comment(node)) {
            entry.description = comment(node);
            entry.descriptionOrigin = 'jsdoc';
          }
        }
      } else if (node.name) {
        const kind = ts.isClassDeclaration(node) ? 'class' : ts.isInterfaceDeclaration(node) ? 'interface' : ts.isEnumDeclaration(node) ? 'enum' : ts.isTypeAliasDeclaration(node) ? 'type' : 'function';
        record(node, node.name.getText(source), '', kind);
        for (const member of node.members || []) {
          if (member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword) || member.name && ts.isPrivateIdentifier(member.name)) continue;
          const name = ts.isConstructorDeclaration(member) ? 'constructor' : member.name?.getText(source).replace(/^['"]|['"]$/g, '');
          if (name) record(member, name, node.name.getText(source), ts.isConstructorDeclaration(member) ? 'constructor' : ts.isMethodDeclaration(member) || ts.isMethodSignature(member) ? 'method' : ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member) ? 'accessor' : 'property');
          // TypeScript parameter properties are part of the class API even
          // though their declarations are written inside its constructor.
          if (ts.isConstructorDeclaration(member)) for (const parameter of member.parameters) {
            if (ts.isParameterPropertyDeclaration(parameter, member) && !parameter.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.PrivateKeyword)) record(parameter, parameter.name.getText(source), node.name.getText(source), 'property');
          }
        }
      }
    }
    api[file.path] = entries;
  }
  for (const entry of Object.values(api).flat()) {
    if (!entry.description) entry.description = contractSummary(entry);
    for (const parameter of (entry.overloads || [{parameters:entry.parameters}]).flatMap(overload=>overload.parameters)) {
      if (!parameter.description) {
        parameter.description = parameterContract(parameter,entry);
        parameter.descriptionOrigin = 'source';
      } else parameter.descriptionOrigin = 'authored-or-jsdoc';
    }
  }
  for (const { alias, declaration, ownerEntry } of aliases) {
    if (!declaration?.name) continue;
    const owner = ts.isParameter(declaration) && ts.isConstructorDeclaration(declaration.parent) ? declaration.parent.parent.name?.getText() : declaration.parent?.name?.getText();
    const name = declaration.name.getText();
    const target = lookup[`${owner}.${name}`]?.find(t => t.source === path.relative(root, declaration.getSourceFile().fileName).split(path.sep).join('/'));
    if (target && !api[ownerEntry.source].some(entry=>entry.qualified===alias)) {
      register(alias, target);
      ownerEntry.inherited ||= [];
      if (!ownerEntry.inherited.some(member=>member.name===name)) ownerEntry.inherited.push({name,declaredBy:target.name,url:target.url,visibility:target.visibility});
    }
  }
  for (const [file, target] of Object.entries(modules)) {
    register(file, target);
    // Filenames resolve only if unique; context selects local modules otherwise.
    register(path.basename(file), target);
  }
  // Resolve barrel aliases to the declaration actually exported by the package.
  for (const entryFile of [path.join(root,'src/index.ts'), ...fs.readdirSync(path.join(root,'libs')).map(name=>path.join(root,'libs',name,'index.ts'))]) {
    const source=program.getSourceFile(entryFile), module=source&&checker.getSymbolAtLocation(source);
    if(!module)continue;
    for(const exported of checker.getExportsOfModule(module)) {
      const actual=exported.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(exported):exported;
      const declaration=actual.declarations?.[0];if(!declaration)continue;
      const sourcePath=path.relative(root,declaration.getSourceFile().fileName).split(path.sep).join('/');
      const target=lookup[actual.name]?.find(t=>t.source===sourcePath);
      if(target) {register(exported.name,{...target,canonical:true}); if(path.relative(root,entryFile)==='src/index.ts')target.canonical=true;}
    }
  }
  for (const key of Object.keys(notes)) {
    const separator=key.indexOf(':');
    if (separator===-1 ? !lookup[key] : !api[key.slice(0,separator)]?.some(entry=>entry.qualified===key.slice(separator+1))) throw new Error(`Unknown API note: ${key}`);
    const matches = Object.values(api).flat().filter(entry => separator === -1 ? entry.qualified === key : `${entry.source}:${entry.qualified}` === key);
    for (const name of Object.keys(notes[key].parameters || {})) if (!matches.some(entry => (entry.overloads || [{parameters:entry.parameters}]).some(overload=>overload.parameters.some(parameter=>parameter.name===name)))) throw new Error(`Unknown API parameter: ${key}.${name}`);
  }
  const hierarchy = buildClassHierarchy({ program, checker, api, lookup, root, ts });
  return { api, lookup, coverage, program, checker, notes, hierarchy };
}

