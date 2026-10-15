import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, buildSearchIndex, compactSymbols, assertExampleExplanations, pageSummary } from './build-content.mjs';
import { inspectSources, discoverExamples, validateNote, ts } from './source-model.mjs';
import { buildClassHierarchy } from './hierarchy-model.mjs';
import { declarationContract, contractSummary, parameterContract } from './api-contracts.mjs';
import { compactApiEntries, expandApiEntries, compactSearchRecords, expandSearchRecords } from '../src/lib/data-payload.mjs';

// Test the actual browser lookup without importing React or generated assets.
const symbolSource = fs.readFileSync(new URL('../src/lib/symbols.ts',import.meta.url),'utf8');
const {resolveSymbol,shouldLinkSymbol,splitSymbolText} = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(symbolSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64')}`);
async function browserModule(name){
  const source=fs.readFileSync(new URL(`../src/lib/${name}.ts`,import.meta.url),'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64')}`);
}
const {matchesSearchFilter,prioritizeSearch}=await browserModule('search');
const {readDraft,saveDraft}=await browserModule('drafts');
const {parseInline}=await browserModule('inline');
const {adjacentPages,readExpandedGroups,filterTutorials}=await browserModule('navigation');
const {groupApiEntries,matchesApiEntry}=await browserModule('apiBrowsing');
const {resolveHierarchyRoot,hierarchyView,hierarchyDiagram}=await browserModule('hierarchy');
const {diagramAnchor,diagramScroll,clampDiagramZoom}=await browserModule('diagram-view');
const {routeHierarchyEdges}=await browserModule('hierarchy-routing');
const {createExampleLoader}=await browserModule('example-loader');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'retiam-content-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const write = (file, value) => {
    const destination = path.join(directory, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, typeof value === 'string' ? value : JSON.stringify(value));
  };
  const page = (id, extra = []) => ({
    id, title: id, group: 'Guides', sections: [{ id: 'intro', blocks: [
      { type: 'heading', level: 2, text: 'Introduction' }, ...extra,
    ] }],
  });
  write('config.json', { cdnUrl: 'https://cdn.example.com/retiam.es.js' });
  write('navigation.json', { groups: [{ title: 'Guides', pages: ['first', 'second'] }] });
  write('guides/first.json', page('first'));
  write('guides/second.json', page('second'));
  return { directory, write, page };
}

test('API contracts distinguish immediate branches from deferred callbacks and keep distinct writes', () => {
  const source=ts.createSourceFile('contract.ts',`class Sample {
    run(value: number) {
      if (value < 0) return null;
      this.count = value;
      this.count += 1;
      schedule(() => { this.later = value; return 'later'; });
      const helpers = { later() { this.deferred = 5; return 'nested method'; } };
      class Deferred { get value() { return 'nested class'; } }
      if (value === 0) throw new Error('zero');
      return this;
    }
    empty() {}
  }`,ts.ScriptTarget.Latest,true);
  const method=source.statements[0].members[0], contract=declarationContract(ts,method,source);
  assert.deepEqual(contract.returns.map(value=>value.expression),['null','this']);
  assert.deepEqual(contract.writes.map(value=>[value.target,value.operation]),[['this.count','='],['this.count','+=']]);
  assert.ok(!contract.writes.some(value=>value.target==='this.later'));
  assert.ok(!contract.writes.some(value=>value.target==='this.deferred'));
  assert.deepEqual(contract.guards.map(value=>value.condition),['value < 0','value === 0']);
  assert.match(contract.throws[0].expression,/new Error\('zero'\)/);
  assert.equal(contract.empty,false);
  assert.match(contractSummary({contract,qualified:'Sample.run'}),/branch taken/);
  const empty=declarationContract(ts,source.statements[0].members[1],source);
  assert.match(contractSummary({contract:empty,qualified:'Sample.empty'}),/empty implementation/);
});

test('API parameter facts do not attribute a shadowed callback parameter to the outer argument', t => {
  const {directory,write}=fixture(t);
  write('contract.ts',`class Sample {
    constructor(public size: number = 1) {}
    run(value: number = 2) {
      schedule((value: string) => consume(value));
      this.size = value * 3;
      return this.size;
    }
  }`);
  const program=ts.createProgram([path.join(directory,'contract.ts')],{noEmit:true});
  const source=program.getSourceFile(path.join(directory,'contract.ts')), checker=program.getTypeChecker();
  const run=declarationContract(ts,source.statements[0].members[1],source,checker);
  assert.ok(!run.parameters.value.some(use=>use.target==='consume'));
  assert.ok(run.parameters.value.some(use=>use.target==='value * 3'&&use.kind==='calculated'));
  assert.match(parameterContract({name:'value',default:'2'},{contract:run}),/defaults to `2`/);
  const ctor=declarationContract(ts,source.statements[0].members[0],source,checker);
  assert.ok(ctor.parameters.size.some(use=>use.kind==='stored'&&use.target==='this.size'));
  const field=declarationContract(ts,source.statements[0].members[0].parameters[0],source,checker);
  assert.match(contractSummary({contract:field,name:'size',qualified:'Sample.size',kind:'property'}),/constructor argument/);
  assert.match(contractSummary({contract:field,name:'size',qualified:'Sample.size',kind:'property'}),/defaults to `1` when omitted/);
  assert.doesNotMatch(contractSummary({contract:field,name:'size',qualified:'Sample.size',kind:'property'}),/starts as/);
});

test('long API definitions remain available without duplicating them as enormous introductions', () => {
  const source=ts.createSourceFile('contract.ts',`export type Value = 'a' | 'b';`,ts.ScriptTarget.Latest,true);
  const contract=declarationContract(ts,source.statements[0],source);
  assert.deepEqual(contract.variants,["'a'","'b'"]);
  const definition='VeryLongExpression'.repeat(30);
  assert.ok(contractSummary({name:'Large',contract:{definition}}).length<150);
});

test('source summaries preserve template literals and distinguish construction, iteration and conditional returns', () => {
  const source=ts.createSourceFile('summary.ts','class Sample { constructor() {} *empty() {} *values() { yield 1; return 2; } maybe(flag:boolean) { if(flag) return this; } }',ts.ScriptTarget.Latest,true);
  const members=source.statements[0].members;
  const summarize=(index,kind='method')=>contractSummary({qualified:'Sample.member',kind,contract:declarationContract(ts,members[index],source)});
  assert.doesNotMatch(summarize(0,'constructor'),/returns no value/);
  assert.match(summarize(1),/iteration completes immediately/);
  assert.match(summarize(2),/Generator completion expression/);
  assert.deepEqual(declarationContract(ts,members[2],source).yields.map(value=>value.expression),['1']);
  assert.match(summarize(3),/Explicit return expression/);
  assert.doesNotMatch(summarize(3),/Returns this instance/);
  const literal='`prefix-${value}`';
  const summary=parameterContract({name:'label',default:literal},{contract:{declarationOnly:true}});
  assert.ok(parseInline(summary).some(token=>token.type==='code'&&token.text.trim()===literal));
});

test('implementation references resolve this through the declaring owner without rewriting their label', () => {
  const target={name:'Entity.move',url:'/api-entity#move'}, root={name:'Entity',url:'/api-entity#entity'};
  const lookup={'Entity.move':[target],Entity:[root]};
  assert.equal(resolveSymbol(lookup,'this.move','api-entity','Entity'),target);
  assert.equal(resolveSymbol(lookup,'this','api-entity','Entity'),root);
  assert.equal(resolveSymbol(lookup,'this.move','api-entity'),undefined);
  assert.equal(resolveSymbol(lookup,'this.missing','api-entity','Entity'),undefined);
  assert.deepEqual(splitSymbolText('this.move(value)'),['','this.move','(','value',')']);
});

test('diagram zoom preserves the SVG point under the pointer when centered content becomes scrollable', () => {
  const initial = { viewport:{width:800,height:600}, size:{width:1000,height:900}, scale:0.75 };
  const point = { x:600,y:350 }, scroll = { left:0,top:120 };
  const anchor = diagramAnchor(initial,point,scroll);
  const zoomed = { ...initial,scale:1.5 };
  const next = diagramScroll(zoomed,point,anchor);
  assert.deepEqual(diagramAnchor(zoomed,point,next),anchor);
  const restored = diagramScroll(initial,point,anchor);
  assert.deepEqual(restored,scroll);
});

test('diagram pinch can move its midpoint while keeping the original anchor and respecting bounds', () => {
  const geometry = { viewport:{width:400,height:600}, size:{width:900,height:1200}, scale:1 };
  const anchor = diagramAnchor(geometry,{x:150,y:200},{left:100,top:160});
  const nextGeometry = { ...geometry,scale:2 };
  const nextPoint = { x:220,y:240 };
  const scroll = diagramScroll(nextGeometry,nextPoint,anchor);
  assert.deepEqual(diagramAnchor(nextGeometry,nextPoint,scroll),anchor);
  assert.deepEqual(diagramScroll(geometry,{x:300,y:300},{x:0,y:0}),{left:0,top:0});
  assert.equal(clampDiagramZoom(0),0.1);
  assert.equal(clampDiagramZoom(20),8);
  assert.equal(clampDiagramZoom(1.25),1.25);
});

function assertRoutesAvoidBoxes(routes, boxes) {
  for (const route of routes) for (let i = 1; i < route.points.length; i++) {
    const a = route.points[i-1], b = route.points[i];
    assert.ok(a.x === b.x || a.y === b.y, 'Hierarchy segments must be orthogonal.');
    for (const box of boxes) {
      const left=box.x-box.width/2, right=box.x+box.width/2, top=box.y-box.height/2, bottom=box.y+box.height/2;
      const enters = a.x === b.x ? a.x > left && a.x < right && Math.max(a.y,b.y) > top && Math.min(a.y,b.y) < bottom :
        a.y > top && a.y < bottom && Math.max(a.x,b.x) > left && Math.min(a.x,b.x) < right;
      assert.ok(!enters, `${route.id} must avoid ${box.id}'s box.`);
    }
  }
}

test('hierarchy branches leave the right port and avoid intervening sibling boxes', () => {
  const boxes=[{id:'base',x:100,y:400,width:160,height:40},{id:'sibling',x:100,y:100,width:190,height:40},{id:'derived',x:400,y:100,width:160,height:40}];
  const routes=routeHierarchyEdges(boxes,[{id:'branch',from:'base',to:'derived',kind:'extends'}]);
  assertRoutesAvoidBoxes(routes,boxes);
  assert.deepEqual(routes[0].points[0],{x:180,y:400});
});

test('different hierarchy parents and relationship kinds have distinct trunk lanes', () => {
  const boxes=[{id:'a',x:100,y:100,width:160,height:40},{id:'b',x:100,y:300,width:160,height:40},{id:'c',x:400,y:100,width:160,height:40},{id:'d',x:400,y:300,width:160,height:40}];
  const edges=[{id:'one',from:'a',to:'d',kind:'extends'},{id:'two',from:'b',to:'c',kind:'extends'},{id:'three',from:'a',to:'c',kind:'implements'}];
  const routes=routeHierarchyEdges(boxes,edges);
  assertRoutesAvoidBoxes(routes,boxes);
  assert.equal(new Set(routes.map(route=>route.points[1].x)).size,3);
  assert.equal(new Set(routes.map(route=>route.branch)).size,3);
  assert.deepEqual(routes.map(({from,to,kind})=>({from,to,kind})),edges.map(({from,to,kind})=>({from,to,kind})));
});

test('long hierarchy edges avoid intermediate columns and extend the diagram bounds', () => {
  const boxes=[{id:'base',x:100,y:100,width:160,height:40},{id:'intermediate',x:400,y:100,width:190,height:120},{id:'derived',x:700,y:100,width:160,height:40}];
  const routes=routeHierarchyEdges(boxes,[{id:'long',from:'base',to:'derived',kind:'implements'}]);
  assertRoutesAvoidBoxes(routes,boxes);
  assert.ok(Math.min(...routes[0].points.map(point=>point.y)) < 40);
});

test('hierarchy extraction resolves imported aliases and generic bases, distinguishes implementation and keeps unindexed bases honest', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'retiam-hierarchy-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const sources = {
    'base.ts': 'export abstract class Base<T> {} export interface Contract {} export type AliasContract = Contract; class Hidden {} export class HiddenChild extends Hidden {} export interface Options extends Partial<Contract> {}',
    'other.ts': 'export class Base {}',
    'child.ts': "import { Base as Imported, Contract, AliasContract } from './base'; import { Base as OtherBase } from './other'; export class Derived extends Imported<string> implements Contract {} export class OtherDerived extends OtherBase {} export class AliasDerived implements AliasContract {}",
  };
  for (const [file, code] of Object.entries(sources)) fs.writeFileSync(path.join(directory, file), code);
  const program = ts.createProgram(Object.keys(sources).map(file => path.join(directory, file)), { noEmit: true, target: ts.ScriptTarget.ESNext });
  const api = {}, lookup = {};
  for (const file of Object.keys(sources)) {
    api[file] = program.getSourceFile(path.join(directory, file)).statements.filter(node => node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)).map(node => {
      const entry = { id: `${file}-${node.name.text}`, name: node.name.text, qualified: node.name.text, kind: ts.isInterfaceDeclaration(node) ? 'interface' : ts.isTypeAliasDeclaration(node) ? 'type' : 'class', visibility: 'public' };
      (lookup[entry.name] ||= []).push({ source: file, url: `/fixture#${entry.id}` });
      return entry;
    });
  }
  const graph = buildClassHierarchy({ program, checker: program.getTypeChecker(), api, lookup, root: directory, ts });
  assert.ok(graph.nodes.find(node => node.id === 'base.ts-Base').abstract);
  assert.ok(graph.edges.some(edge => edge.from === 'base.ts-Base' && edge.to === 'child.ts-Derived' && edge.kind === 'extends'));
  assert.ok(graph.edges.some(edge => edge.from === 'base.ts-Contract' && edge.to === 'child.ts-Derived' && edge.kind === 'implements'));
  assert.ok(graph.edges.some(edge => edge.from === 'other.ts-Base' && edge.to === 'child.ts-OtherDerived'));
  assert.ok(!graph.edges.some(edge => edge.from === 'other.ts-Base' && edge.to === 'child.ts-Derived'));
  const hidden = graph.nodes.find(node => node.name === 'Hidden');
  assert.ok(hidden.external && !hidden.url);
  assert.ok(graph.edges.some(edge => edge.from === hidden.id && edge.to === 'base.ts-HiddenChild'));
  assert.ok(graph.edges.some(edge => edge.from === 'base.ts-AliasContract' && edge.to === 'child.ts-AliasDerived' && edge.kind === 'implements'));
  assert.equal(graph.nodes.find(node => node.name === 'AliasContract').url,'/fixture#base.ts-AliasContract');
  assert.equal(graph.nodes.find(node => node.name === 'Partial').kind,'type');
});

test('hierarchy views retain ancestors, limit descendants and distinguish interface relationships', () => {
  const index = { nodes: ['Base','Middle','Leaf','Deep','Sibling','Contract'].map(name => ({ id: name, name, source: 'src/example.ts', kind: name === 'Contract' ? 'interface' : 'class' })),
    edges: [['Base','Middle','extends'],['Middle','Leaf','extends'],['Leaf','Deep','extends'],['Base','Sibling','extends'],['Contract','Middle','implements']].map(([from,to,kind]) => ({ from,to,kind })) };
  assert.deepEqual(hierarchyView(index,'Middle',1,false).nodes.map(node => node.name),['Base','Middle','Leaf']);
  assert.deepEqual(hierarchyView(index,'Middle','all',true).nodes.map(node => node.name),['Base','Middle','Leaf','Deep','Contract']);
  assert.equal(hierarchyView(index,'Contract',1,true).descendants,1);
  assert.throws(() => hierarchyView(index,'Missing',1,false), /Unknown or ambiguous/);
  const cyclic = { ...index, edges: [...index.edges,{from:'Deep',to:'Base',kind:'extends'}] };
  assert.equal(new Set(hierarchyView(cyclic,'Base','all',false).nodes.map(node=>node.id)).size,5);
});

test('hierarchy diagrams disambiguate duplicate labels and keep exact API destinations', () => {
  const index = { nodes: [{id:'a',name:'Base',source:'src/a.ts',url:'/api-a#base',kind:'class'}, {id:'b',name:'Base',source:'libs/b.ts',url:'/api-b#base',kind:'class'}, {id:'c',name:'Leaf',source:'src/c.ts',kind:'class'}], edges:[{from:'a',to:'c',kind:'extends'},{from:'b',to:'c',kind:'extends'}] };
  assert.equal(resolveHierarchyRoot(index,'Base'),undefined);
  assert.equal(resolveHierarchyRoot(index,'src/a.ts:Base').id,'a');
  const diagram = hierarchyDiagram(hierarchyView(index,'c',1,false));
  assert.match(diagram.code,/Base \(src\/a.ts\)/);
  assert.match(diagram.code,/Base \(libs\/b.ts\)/);
  assert.deepEqual(Object.values(diagram.links).map(link => link.url),['/api-a#base','/api-b#base']);
  assert.equal(Object.keys(diagram.links).length,2);
});

test('authored hierarchy roots and query-string navigation are validated', t => {
  const {directory,write,page} = fixture(t);
  const model = { api:{}, lookup:{}, examples:{}, hierarchy:{nodes:[{id:'entity',name:'Entity',source:'src/Entity.ts'}]} };
  write('navigation.json',{groups:[{title:'Guides',pages:['first','class-hierarchy']}]});
  write('guides/second.json',page('class-hierarchy'));
  write('guides/first.json',page('first',[{type:'class-hierarchy',root:'Entity',depth:2},{type:'paragraph',text:'[Explore](/class-hierarchy?type=Entity#intro)'}]));
  assert.doesNotThrow(() => loadContent(directory,model));
  write('guides/first.json',page('first',[{type:'paragraph',text:'[Missing](/class-hierarchy?type=Missing#intro)'}]));
  assert.throws(() => loadContent(directory,model),/Broken hierarchy type/);
  write('guides/first.json',page('first',[{type:'class-hierarchy',root:'Missing'}]));
  assert.throws(() => loadContent(directory,model),/Unknown or ambiguous hierarchy root/);
  write('guides/first.json',page('first',[{type:'class-hierarchy',root:'Entity',depth:0}]));
  assert.throws(() => loadContent(directory,model),/schema shape/);
});

test('navigation defines reading order even when files move between folders', t => {
  const { directory, write, page } = fixture(t);
  fs.unlinkSync(path.join(directory, 'guides/second.json'));
  write('reference/nested/second.json', page('second'));
  write('navigation.json', { groups: [{ title: 'Guides', pages: ['second', 'first'] }] });
  assert.deepEqual(loadContent(directory).content.pages.map(page => page.id), ['second', 'first']);
});

test('guide pagination follows the authored course while reference pagination stays in its group', () => {
  const groups=[{title:'Basics',kind:'guide',pages:['start','entities']},{title:'Examples',kind:'reference',pages:['gallery','demo']},{title:'Animation',kind:'guide',pages:['motion','export']}];
  const pages=groups.flatMap(group=>group.pages.map(id=>({id,title:id,group:group.title})));
  assert.equal(adjacentPages('entities',pages,groups).next.id,'motion');
  assert.equal(adjacentPages('motion',pages,groups).previous.id,'entities');
  assert.equal(adjacentPages('export',pages,groups).next,undefined);
  assert.equal(adjacentPages('gallery',pages,groups).previous,undefined);
  assert.equal(adjacentPages('gallery',pages,groups).next.id,'demo');
  assert.equal(adjacentPages('demo',pages,groups).next,undefined);
});

test('guides preserve the original linear reading order and canonical destinations', () => {
  const navigation=JSON.parse(fs.readFileSync(new URL('../content/navigation.json',import.meta.url),'utf8'));
  const guideIds=navigation.groups.filter(group=>group.kind==='guide').flatMap(group=>group.pages);
  const expected=(
    "getting-started installation first-scene coordinates-colors entities transforms scene-composition " +
    "layout application-integration lifecycle-resources vector-paths paint-effects curves-subdivision path-modifiers " +
    "sketch boolean-geometry typography svg-sprites rich-media font-pipeline animation " +
    "animation-catalog updates-trackers animation-control asset-workflows export tooling interaction " +
    "audio speech-subtitles plotting math-noise-fields cameras three-d morphing " +
    "sdf-raymarching layers-masks libraries procedural-shapes charts graphs physics " +
    "automata-walkthrough project-animated-chart project-draggable-diagram project-mathematical-explanation project-interactive-3d best-practices troubleshooting " +
    "performance testing-scenes limitations rendering-architecture path-pipelines gpu-memory shader-system " +
    "compute-instancing frame-graph render-targets transparency-post plugins extension-workshop path-tracing"
  ).split(' ');
  assert.deepEqual(guideIds,expected);
  const pages=navigation.groups.flatMap(group=>group.pages.map(id=>({id,title:id,group:group.title})));
  for (let index=0;index<guideIds.length;index++) {
    const adjacent=adjacentPages(guideIds[index],pages,navigation.groups);
    assert.equal(adjacent.previous?.id,guideIds[index-1]);
    assert.equal(adjacent.next?.id,guideIds[index+1]);
  }
});

test('tutorial pagination stays in its group without interrupting the guide sequence', () => {
  const groups=[{title:'Basics',kind:'guide',pages:['setup','concept']},{title:'Tutorials',kind:'tutorial',pages:['first','second']},{title:'Internals',kind:'guide',pages:['memory']}];
  const pages=groups.flatMap(group=>group.pages.map(id=>({id,title:id,group:group.title})));
  assert.equal(adjacentPages('first',pages,groups).previous,undefined);
  assert.equal(adjacentPages('first',pages,groups).next.id,'second');
  assert.equal(adjacentPages('second',pages,groups).next,undefined);
  assert.equal(adjacentPages('concept',pages,groups).next.id,'memory');
  assert.equal(adjacentPages('memory',pages,groups).previous.id,'concept');
});

test('tutorial filtering combines text, difficulty and topic with accurate metadata', () => {
  const pages=[{id:'compute',title:'Compute a grid',summary:'Custom WGSL',outcome:'A GPU image',group:'Extending',difficulty:'advanced'},
    {id:'chart',title:'Build a chart',group:'Projects',difficulty:'intermediate'}];
  assert.deepEqual(filterTutorials(pages,'gpu','advanced','Extending').map(page=>page.id),['compute']);
  assert.equal(filterTutorials(pages,'gpu','intermediate','').length,0);
  assert.equal(filterTutorials(pages,'','','').length,2);
  const record={type:'section',pageId:'compute',category:'tutorial'};
  assert.equal(matchesSearchFilter(record,'tutorial'),true);
  assert.equal(matchesSearchFilter(record,'guide'),false);
  const guideRecord={...record,category:'guide',tutorial:true};
  assert.equal(matchesSearchFilter(guideRecord,'tutorial'),true);
  assert.equal(matchesSearchFilter(guideRecord,'guide'),true);
  const indexed=buildSearchIndex([{id:'first-scene',title:'Your first scene',group:'Start here',difficulty:'beginner',sections:[]}],{},[{title:'Start here',kind:'guide',pages:['first-scene']}]);
  assert.equal(matchesSearchFilter(indexed[0],'tutorial'),true);
  assert.equal(matchesSearchFilter(indexed[0],'guide'),true);
});

test('tutorial metadata rejects incomplete lessons and invalid time estimates', t => {
  const {directory,write,page}=fixture(t);
  write('navigation.json',{groups:[{title:'Tutorials',kind:'tutorial',pages:['first','second']}]});
  const metadata={group:'Tutorials',summary:'Build a scene.',outcome:'A circle.',difficulty:'beginner',estimatedMinutes:15,prerequisites:['[Second](/second)']};
  write('guides/first.json',{...page('first'),...metadata});
  write('guides/second.json',{...page('second'),...metadata,prerequisites:['[First](/first)']});
  assert.doesNotThrow(()=>loadContent(directory));
  for (const estimatedMinutes of [0,-1,1.5]) {
    write('guides/first.json',{...page('first'),...metadata,estimatedMinutes});
    assert.throws(()=>loadContent(directory),/Invalid tutorial time/);
  }
  for (const field of ['summary','outcome','difficulty','estimatedMinutes','prerequisites']) {
    const incomplete={...page('first'),...metadata}; delete incomplete[field];
    write('guides/first.json',incomplete);
    assert.throws(()=>loadContent(directory),/Tutorial needs/);
  }
});

test('saved sidebar groups survive reload while a deep-linked active group is revealed', () => {
  const groups=[{title:'Start here',pages:['start']},{title:'Engine API',pages:['entity']},{title:'Examples',pages:['demo']}];
  assert.deepEqual(readExpandedGroups('["Examples","deleted",4]',groups,'Engine API'),['Examples','Engine API']);
  assert.deepEqual(readExpandedGroups('broken JSON',groups,'Engine API'),['Start here','Engine API']);
  assert.deepEqual(readExpandedGroups('[]',groups,'Examples'),['Examples']);
});

test('page header prerequisites use the same validated destinations as body links', t => {
  const {directory,write,page}=fixture(t);
  write('guides/first.json',{...page('first'),summary:'Understand local motion.',prerequisites:['[Second](/second#intro)'],outcome:'A moving circle.'});
  const first=loadContent(directory).content.pages[0];
  assert.equal(first.summary,'Understand local motion.');
  assert.equal(buildSearchIndex([first])[0].snippet,first.summary);
  write('guides/first.json',{...first,prerequisites:['[Missing](/second#removed)']});
  assert.throws(()=>loadContent(directory),/Broken anchor/);
});

test('reference headers describe their scope and authored summaries take precedence', () => {
  const page={id:'api-entity',group:'Engine API',sections:[{blocks:[{type:'api-reference',source:'src/Entity.ts'}]}]};
  assert.match(pageSummary(page),/Entity.ts/);
  assert.equal(pageSummary({...page,summary:'Entity ownership and transforms.'}),'Entity ownership and transforms.');
});

test('API grouping preserves every member destination and keeps construction, transforms and styling together', () => {
  const entry=(qualified,kind)=>({id:`anchor-${qualified}`,qualified,name:qualified.split('.').at(-1),kind,visibility:'public',signatures:[],notes:[],parameters:[],description:''});
  const entries=[entry('Entity','class'),entry('Entity.constructor','constructor'),entry('Entity.move','method'),entry('Entity.rotate','method'),entry('Entity.setOpacity','method'),entry('Entity.destroy','method'),entry('Entity.setEvent','method'),entry('Entity.getLocalAABB','method'),entry('Entity.getPosition','method'),entry('hex','function')];
  const groups=groupApiEntries(entries);
  const entity=groups.find(group=>group.owner==='Entity');
  assert.deepEqual(entity.categories.find(group=>group.title==='Transforms').entries.map(entry=>entry.name),['move','rotate','getPosition']);
  assert.equal(entity.categories.find(group=>group.title==='Construction').entries[0].name,'constructor');
  assert.equal(entity.categories.find(group=>group.title==='Appearance').entries[0].name,'setOpacity');
  assert.deepEqual(groups.flatMap(group=>group.categories.flatMap(category=>category.entries)).map(entry=>entry.id).sort(),entries.map(entry=>entry.id).sort());
});

test('API public filtering applies to parameter and behavior searches without deleting implementation entries', () => {
  const entry={qualified:'Entity.move',visibility:'public',description:'Move to a position',signatures:[],notes:['Preserves scale.'],parameters:[{name:'target',description:'World-space destination'}]};
  assert.equal(matchesApiEntry(entry,'world-space',false),true);
  assert.equal(matchesApiEntry(entry,'preserves scale',false),true);
  assert.equal(matchesApiEntry({...entry,visibility:'protected'},'',false),false);
  assert.equal(matchesApiEntry({...entry,visibility:'protected'},'',true),true);
  assert.equal(matchesApiEntry({...entry,visibility:'internal'},'world-space',true),true);
});

test('nested codeFile references embed exact source and leave no authoring fields', t => {
  const { directory, write, page } = fixture(t);
  const code = 'export default class Example extends Scene {\n}\n';
  write('playgrounds/example.ts', code);
  write('guides/first.json', { $schema: '../../schema.json', ...page('first', [{
    type: 'tabs', tabs: [{ label: 'Example', blocks: [{
      type: 'playground', id: 'example', filename: 'Example.ts', codeFile: 'playgrounds/example.ts',
    }] }],
  }]) });
  const pageResult = loadContent(directory).content.pages[0];
  const block = pageResult.sections[0].blocks[1].tabs[0].blocks[0];
  assert.equal(block.code, code);
  assert.equal('codeFile' in block, false);
  assert.equal('$schema' in pageResult, false);
});

test('navigation rejects missing, repeated, unlisted, and mismatched pages', t => {
  const { directory, write } = fixture(t);
  for (const [groups, error] of [
    [[{ title: 'Guides', pages: ['first', 'missing'] }], /does not exist/],
    [[{ title: 'Guides', pages: ['first', 'first'] }], /Duplicate navigation page/],
    [[{ title: 'Guides', pages: ['first'] }], /missing from navigation/],
    [[{ title: 'Other', pages: ['first', 'second'] }], /differs from navigation group/],
  ]) {
    write('navigation.json', { groups });
    assert.throws(() => loadContent(directory), error);
  }
});

test('cross-page anchors are validated across independently authored files', t => {
  const { directory, write, page } = fixture(t);
  write('guides/first.json', page('first', [{ type: 'paragraph', text: '[Next](/second#intro)' }]));
  assert.doesNotThrow(() => loadContent(directory));
  write('guides/first.json', page('first', [{ type: 'paragraph', text: '[Next](/second#removed)' }]));
  assert.throws(() => loadContent(directory), /Broken anchor/);
});

test('codeFile rejects escape paths and ambiguous inline/file code', t => {
  const { directory, write, page } = fixture(t);
  write('guides/first.json', page('first', [{ type: 'code', language: 'typescript', codeFile: '../outside.ts' }]));
  assert.throws(() => loadContent(directory), /must point inside/);
  write('guides/first.json', page('first', [{ type: 'code', language: 'typescript', codeFile: 'playgrounds/example.ts', code: 'ambiguous' }]));
  assert.throws(() => loadContent(directory), /without inline code/);
});

test('runtime schema still rejects invalid blocks after resolving authoring references', t => {
  const { directory, write, page } = fixture(t);
  write('guides/first.json', page('first', [{ type: 'paragraph', text: 'Text', unsupported: true }]));
  assert.throws(() => loadContent(directory), /allowed schema shape/);
});

test('search keeps destination anchors and indexes structured table cells inside tabs', t => {
  const { directory, write, page } = fixture(t);
  write('guides/first.json', page('first', [{ type: 'tabs', tabs: [{ label: 'API', blocks: [{
    type: 'table', columns: ['Name', 'Type', 'Description'], rows: [{ cells: [
      { text: 'SDFSphere', type: 'code' }, { text: 'SDFNode' }, { text: 'Sphere geometry' },
    ] }],
  }] }] }]));
  const records = buildSearchIndex(loadContent(directory).content.pages);
  const record = records.find(record => record.type === 'api' && record.heading.includes('SDFSphere'));
  assert.equal(record.pageId, 'first');
  assert.equal(record.sectionId, 'intro');
  assert.match(record.snippet, /Sphere geometry/);
});

test('examples and API anchors inside details use the same validated destinations', t => {
  const { directory, write, page } = fixture(t);
  const model = { api: { 'src/Entity.ts': [{ id: 'api-entity-move' }] }, examples: { 'shapes/move': {} }, lookup: { 'Entity.move': [{ url: '/first#api-entity-move' }] } };
  write('guides/first.json', page('first', [{ type: 'details', title: 'Explore', blocks: [
    { type: 'api-reference', source: 'src/Entity.ts' }, { type: 'example', example: 'shapes/move' },
  ] }]));
  write('guides/second.json', page('second', [{ type: 'paragraph', text: '[Move](/first#api-entity-move)' }]));
  assert.doesNotThrow(() => loadContent(directory, model));
  model.lookup['Entity.move'][0].url = '/first#deleted-member';
  assert.throws(() => loadContent(directory, model), /Broken anchor/);
});

test('unknown example and API source references fail before reaching the browser', t => {
  const { directory, write, page } = fixture(t);
  const model = { api: {}, examples: {}, lookup: {} };
  write('guides/first.json', page('first', [{ type: 'example', example: 'missing' }]));
  assert.throws(() => loadContent(directory, model), /Unknown example/);
  write('guides/first.json', page('first', [{ type: 'api-reference', source: 'removed.ts' }]));
  assert.throws(() => loadContent(directory, model), /Unknown API source/);
  write('guides/first.json', page('first', [{ type: 'api-reference', source: 'constructor' }]));
  assert.throws(() => loadContent(directory, model), /Unknown API source/);
  write('guides/first.json', page('first', [{ type: 'example', example: 'constructor' }]));
  assert.throws(() => loadContent(directory, model), /Unknown example/);
});

test('notes cannot silently accept misspelled fields or unusable controls', () => {
  assert.throws(() => validateNote({ descriptions: 'typo' }, 'api-notes', 'fixture'), /unknown note field/);
  assert.throws(() => validateNote({ controls: [{ name: 'scale', label: 'Scale', min: 1, max: 0, step: 1, value: 1 }] }, 'example-notes', 'fixture'), /invalid slider/);
  assert.throws(() => validateNote({ controls: [{ name: 'curve', label: 'Curve', value: 'missing', options: ['linear'] }] }, 'example-notes', 'fixture'), /selector option/);
  assert.doesNotThrow(() => validateNote({ description: 'Rotate', parameters: { angle: 'Radians' } }, 'api-notes', 'fixture'));
});

test('compact navigation shares inherited targets without changing resolution data', () => {
  const target = { name: 'Entity.move', url: '/entity#move' };
  const lookup = { 'Entity.move': [target], 'Circle.move': [{ ...target }] };
  const compact = compactSymbols(lookup);
  assert.equal(compact.targets.length, 1);
  assert.deepEqual(Object.fromEntries(Object.entries(compact.symbols).map(([name,ids])=>[name,ids.map(id=>compact.targets[id])])), lookup);
});

test('normalized search data preserves snippets, optional filters and ordering through JSON', () => {
  const records = [
    { pageId: 'first', title: 'First page', group: 'Guides', sectionId: 'member', heading: 'Entity.move', snippet: 'Moves the entity by the given vector.', type: 'api' },
    { pageId: 'first', title: 'First page', group: 'Guides', sectionId: 'intro', heading: 'Transforms', snippet: 'Move, rotate and scale the scene.', type: 'section', tutorial: false, category: 'guide' },
    { pageId: 'second', title: 'Tutorial', group: 'Tutorials', sectionId: '', heading: 'Moving scenes', snippet: 'Build an animated scene.', type: 'page', tutorial: true, category: 'tutorial' },
    { pageId: '__proto__', title: 'Safe key', group: 'Reference', sectionId: '', heading: 'Prototype', snippet: 'A data key.', type: 'page', tutorial: false, category: 'reference' },
  ];
  const before = JSON.stringify(records);
  const payload = JSON.parse(JSON.stringify(compactSearchRecords(records)));
  const restored = expandSearchRecords(payload);
  assert.equal(JSON.stringify(records), before, 'Encoding must not mutate the search model.');
  assert.deepEqual(restored, records);
  for (const filter of ['all', 'guide', 'tutorial', 'api', 'example']) {
    assert.deepEqual(restored.filter(record => matchesSearchFilter(record, filter)), records.filter(record => matchesSearchFilter(record, filter)));
  }
  assert.deepEqual(prioritizeSearch(restored, 'move'), prioritizeSearch(records, 'move'));
  assert.throws(() => compactSearchRecords([...records, { ...records[0], title: 'Wrong title' }]), /Inconsistent search metadata/);
  assert.throws(() => expandSearchRecords({ format: 'search-v0', records: [] }), /Unsupported search index/);
  assert.throws(() => expandApiEntries({ format: 'api-v0', entries: [] }), /Unsupported API reference/);
});

test('example metadata loads once for concurrent scenes and retries network or malformed responses', async () => {
  const example = { id: 'demo', title: 'A scene', description: 'An example scene.', source: 'examples/demo.ts', sourceHash: 'revision', scenes: [{ name: 'Demo', export: 'default' }], imports: [], calls: [], assets: [] };
  let calls = 0;
  const load = createExampleLoader('/Retiam/assets/examples.json', async url => {
    calls++;
    assert.equal(url, '/Retiam/assets/examples.json');
    return { ok: true, json: async () => ({ demo: example }) };
  });
  assert.deepEqual(await Promise.all([load('demo'), load('demo')]), [example, example]);
  assert.equal(calls, 1);
  await assert.rejects(load('toString'), /Unknown example/);
  assert.deepEqual(await load('demo'), example);
  assert.equal(calls, 1);
  let attempt = 0;
  const retry = createExampleLoader('/examples.json', async () => {
    attempt++;
    if (attempt === 1) throw new Error('Network unavailable');
    if (attempt === 2) return { ok: false, status: 503 };
    return { ok: true, json: async () => attempt === 3 ? { demo: null } : { demo: example } };
  });
  await assert.rejects(retry('demo'), /Network unavailable/);
  await assert.rejects(retry('demo'), /503/);
  await assert.rejects(retry('demo'), /Invalid example metadata/);
  assert.deepEqual(await retry('demo'), example);
  assert.equal(attempt, 4);
});

test('symbol lookup ignores built-in names and resolves only unambiguous registered targets', () => {
  assert.equal(resolveSymbol({},'constructor'),undefined);
  assert.equal(resolveSymbol({},'toString'),undefined);
  assert.equal(resolveSymbol({},'__proto__'),undefined);
  const lookup={Circle:[{name:'Circle',url:'/shapes#circle'},{name:'Circle',url:'/internal#circle',visibility:'internal'}]};
  assert.equal(resolveSymbol(lookup,'Circle').url,'/shapes#circle');
  assert.equal(resolveSymbol({...lookup,Entity:[{name:'Entity',url:'/one#entity'},{name:'Entity',url:'/two#entity'}]},'Entity'),undefined);
});

test('scene search includes walkthroughs and links to the containing section', () => {
  const pages = [{id:'textures',title:'Textures',group:'Examples',sections:[{id:'feedback',blocks:[
    {type:'heading',level:2,text:'Feedback'}, {type:'example',example:'feedback-demo'},
  ]}]}];
  const examples = {'feedback-demo':{title:'Recursive mirror',description:'Previous frame capture',walkthrough:['Display the captured image with a Sprite.']}};
  const record = buildSearchIndex(pages,examples).find(record=>record.heading==='Recursive mirror');
  assert.equal(record.sectionId,'feedback');
  assert.equal(record.type,'example');
  assert.match(record.snippet,/Previous frame capture.*Sprite/);
});

test('search excludes duplicated historical declaration snapshots', () => {
  const pages = [{id:'entity',title:'Entity',group:'API',sections:[{id:'members',blocks:[
    {type:'heading',level:2,text:'Members'},
    {type:'details',title:'Declaration snapshot and implementation notes',blocks:[
      {type:'table',columns:['Name','Type','Description'],rows:[{cells:['privateHelper','void','Historical body inventory']}]},
    ]},
    {type:'table',columns:['Name','Type','Description'],rows:[{cells:['currentBehavior','void','Useful comparison']}]},
  ]}]}];
  const records=buildSearchIndex(pages);
  assert.ok(records.some(record=>record.heading.includes('currentBehavior')));
  assert.ok(records.every(record=>!JSON.stringify(record).includes('privateHelper')));
});

test('authored related APIs and links are validated alongside content blocks', t => {
  const { directory } = fixture(t);
  const model = {api:{},notes:{},lookup:{},examples:{demo:{id:'demo',authoredRelated:['MissingType']}}};
  assert.throws(()=>loadContent(directory,model),/Unknown related API/);
  model.examples.demo.authoredRelated=[];
  model.notes.Example={description:'Read [the missing page](/removed).'};
  assert.throws(()=>loadContent(directory,model),/Broken page link/);
});

test('source extraction preserves overloads, inherited aliases, augmentation and unique stable destinations', () => {
  const model = inspectSources();
  const entries = Object.values(model.api).flat();
  let originalSize = 0, normalizedSize = 0;
  for (const [source, members] of Object.entries(model.api)) {
    const original = JSON.stringify(members);
    const normalized = JSON.stringify(compactApiEntries(members));
    assert.deepEqual(expandApiEntries(JSON.parse(normalized)), JSON.parse(original), `API payload changed declaration details in ${source}`);
    assert.equal(JSON.stringify(members), original, 'Encoding must not mutate extracted source data.');
    originalSize += original.length;
    normalizedSize += normalized.length;
  }
  assert.ok(normalizedSize < originalSize * 0.85, 'Normalize repeated API metadata and inherited member keys without discarding information.');
  assert.ok(entries.every(entry=>entry.contract&&entry.description&&entry.descriptionOrigin), 'Every indexed declaration needs a source contract and recorded explanation origin.');
  assert.ok(entries.flatMap(entry=>(entry.overloads||[{parameters:entry.parameters}]).flatMap(overload=>overload.parameters)).every(parameter=>parameter.description&&parameter.descriptionOrigin));
  assert.equal(entries.find(entry=>entry.qualified==='Scene.play').descriptionOrigin,'authored');
  assert.equal(entries.find(entry=>entry.qualified==='SDFText.toPaths').descriptionOrigin,'authored');
  assert.equal(new Set(entries.map(entry=>entry.id)).size, entries.length);
  const rotate = entries.find(entry=>entry.qualified==='Entity.rotate');
  assert.equal(rotate.returns, 'this');
  assert.equal(rotate.parameters[0].name, 'angle');
  assert.equal(rotate.example, 'labs/lab-transforms');
  assert.ok(rotate.endLine > rotate.line);
  assert.match(model.lookup['Circle.rotate'][0].url, /#api-entity-rotate-/);
  assert.ok(entries.find(entry=>entry.qualified==='Circle').inherited.some(member=>member.declaredBy==='Entity.rotate'));
  assert.ok(model.lookup['VectorEntity.toExcalidraw']);
  assert.match(entries.find(entry=>entry.qualified==='VectorEntity.startBoil').description,/`Excalidraw.startBoil`/);
  assert.ok(entries.find(entry=>entry.qualified==='Scene.always').signatures.length >= 3);
  assert.equal(entries.find(entry=>entry.qualified==='Entity.constructor').returns, '');
  const constructor=entries.find(entry=>entry.qualified==='Model.constructor');
  assert.equal(constructor.signatures.length,4);
  assert.equal(constructor.overloads[3].parameters[0].name,'vertexBuffer');
  assert.ok(constructor.endLine>constructor.line);
  assert.ok(entries.some(entry=>entry.qualified==='SDFCapsule.radius'&&entry.kind==='property'));
  assert.match(entries.find(entry=>entry.qualified==='Scene.play').returnsDescription,/overshoot/i);
  assert.match(entries.find(entry=>entry.qualified==='BarChart.animateData').parameters.find(parameter=>parameter.name==='newData').description,/array index/);
  assert.match(entries.find(entry=>entry.qualified==='Axes.p2c').returnsDescription,/tuple/);
  const hierarchy = model.hierarchy;
  for (const entry of entries.filter(entry => ['class','interface'].includes(entry.kind))) {
    const node = hierarchy.nodes.find(node => node.id === entry.id);
    assert.ok(node?.url && node.source === entry.source, `Missing hierarchy API target: ${entry.source}:${entry.name}`);
  }
  const ids = new Set(hierarchy.nodes.map(node => node.id));
  assert.equal(ids.size,hierarchy.nodes.length);
  assert.ok(hierarchy.edges.every(edge => ids.has(edge.from) && ids.has(edge.to)));
  const animation = hierarchy.nodes.find(node => node.name === 'Animation');
  const stateAnimation = hierarchy.nodes.find(node => node.name === 'StateAnimation');
  assert.ok(hierarchy.edges.some(edge => edge.from === animation.id && edge.to === stateAnimation.id && edge.kind === 'extends'));
});

test('example discovery identifies runnable exports and keeps annotated source dependencies', () => {
  const examples = discoverExamples();
  assert.equal(examples['labs/lab-transforms'].scenes[0].export, 'default');
  assert.equal(examples['labs/lab-transforms'].source, 'content/playgrounds/lab-transforms.ts');
  assert.ok(examples['labs/lab-transforms'].experiments.length);
  assert.ok(examples['media_textures/texture_atlas'].constructs.includes('TextureAtlas') || examples['media_textures/texture_atlas'].calls.includes('load'));
  assert.ok(examples['media_textures/texture_atlas'].walkthrough.length);
  assert.ok(Object.values(examples).some(example=>!example.scenes.length));
  assert.doesNotThrow(()=>assertExampleExplanations(examples));
  assert.match(examples['labs/lab-transforms'].sourceHash,/^[a-f0-9]{64}$/);
});

test('runnable examples outside the repository collection use the focused labs namespace', () => {
  const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
  const invalid = [];
  const visitValue = (value, file) => {
    if (Array.isArray(value)) return value.forEach(item => visitValue(item, file));
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'example' && typeof child === 'string' && !child.startsWith('labs/')) {
        invalid.push(`${path.relative(contentRoot, file)}: ${child}`);
      }
      visitValue(child, file);
    }
  };
  const visitDirectory = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visitDirectory(file);
      else if (entry.name.endsWith('.json')) {
        const value = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (value.group !== 'Repository examples') visitValue(value, file);
      }
    }
  };
  visitDirectory(contentRoot);
  assert.deepEqual(invalid, []);
});

test('API notes and Examples never reuse tutorial, workshop or project scenes', () => {
  const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
  const roots = ['api-notes', path.join('catalogs', 'focused')].map(directory => path.join(contentRoot, directory));
  const invalid = [];
  const visitValue = (value, file) => {
    if (Array.isArray(value)) return value.forEach(item => visitValue(item, file));
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'example' && typeof child === 'string' && /^labs\/(tutorial|workshop|project)-/.test(child)) {
        invalid.push(`${path.relative(contentRoot, file)}: ${child}`);
      }
      visitValue(child, file);
    }
  };
  const visitDirectory = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visitDirectory(file);
      else if (entry.name.endsWith('.json')) visitValue(JSON.parse(fs.readFileSync(file, 'utf8')), file);
    }
  };
  roots.forEach(visitDirectory);
  assert.deepEqual(invalid, []);
});

test('repository example pages embed every repository module exactly once with complete runnable guidance', () => {
  const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
  const repositoryPages = [];
  const visitDirectory = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visitDirectory(file);
      else if (entry.name.endsWith('.json')) {
        const page = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (page.group === 'Repository examples') repositoryPages.push([file, page]);
      }
    }
  };
  visitDirectory(contentRoot);
  assert.ok(repositoryPages.length > 0, 'Expected repository example pages to be present.');
  const embedded = [];
  const visitBlock = (block, file) => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'example') embedded.push({ id:block.example, file:path.relative(contentRoot, file) });
    for (const value of Object.values(block)) {
      if (Array.isArray(value)) value.forEach(item => visitBlock(item, file));
      else visitBlock(value, file);
    }
  };
  repositoryPages.forEach(([file, page]) => page.sections?.forEach(section => section.blocks?.forEach(block => visitBlock(block, file))));
  const examples = Object.values(discoverExamples()).filter(example => example.source.startsWith('examples/demos/'));
  const expected = examples.map(example => example.id).sort();
  const actual = embedded.map(item => item.id).sort();
  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual).size, actual.length, 'Each repository module should be embedded exactly once.');
  const incomplete = examples.filter(example => example.scenes.length &&
    (!example.description?.trim() || !example.walkthrough?.some(text => text.trim()) || !example.experiments?.some(text => text.trim())))
    .map(example => example.id);
  assert.deepEqual(incomplete, [], 'Runnable repository examples need descriptions, walkthroughs and experiments.');
});

test('every runnable documentation lab has an authored example reference', () => {
  const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
  const referenced = new Set();
  const visitValue = value => {
    if (Array.isArray(value)) return value.forEach(visitValue);
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'example' && typeof child === 'string') referenced.add(child);
      visitValue(child);
    }
  };
  const visitDirectory = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visitDirectory(file);
      else if (entry.name.endsWith('.json')) visitValue(JSON.parse(fs.readFileSync(file, 'utf8')));
    }
  };
  visitDirectory(contentRoot);
  const orphaned = Object.values(discoverExamples())
    .filter(example => example.id.startsWith('labs/') && example.scenes.length && !referenced.has(example.id))
    .map(example => example.id);
  assert.deepEqual(orphaned, [], 'Runnable documentation labs must be embedded by a page or API note.');
});

test('new runnable demos require both an explanation and an experiment',()=>{
  const runnable={id:'demo',scenes:[{}],walkthrough:['What the scene does.']};
  assert.throws(()=>assertExampleExplanations({demo:runnable}),/authored walkthrough and experiment/);
  assert.doesNotThrow(()=>assertExampleExplanations({demo:{...runnable,experiments:['Change its duration.']},helper:{id:'helper',scenes:[]}}));
});

test('ordinary prose names need explicit API intent while identifiers still link',()=>{
  assert.equal(shouldLinkSymbol('State'),false);assert.equal(shouldLinkSymbol('Pass'),false);
  for(const name of ['Write','Create','Cross']) {
    assert.equal(shouldLinkSymbol(name),false);
    assert.equal(shouldLinkSymbol(name,true),true);
  }
  assert.equal(shouldLinkSymbol('State',true),true);assert.equal(shouldLinkSymbol('Entity.move'),true);
  assert.equal(shouldLinkSymbol('Entity.ts'),true);assert.equal(shouldLinkSymbol('Scene'),true);
  assert.equal(shouldLinkSymbol('run'),false);
  assert.equal(shouldLinkSymbol('Usage'),false);assert.equal(shouldLinkSymbol('Rate'),false);
  assert.equal(shouldLinkSymbol('Usage',true),true);assert.equal(shouldLinkSymbol('Rate',true),true);
  const label='Entity.move in src/engine/_core/Entity.ts (local coordinates)';
  const parts=splitSymbolText(label);
  assert.equal(parts.join(''),label);
  assert.ok(parts.includes('Entity.move'));assert.ok(parts.includes('src/engine/_core/Entity.ts'));
});

test('exact API names outrank fuzzy prose matches and filters keep valid destinations',()=>{
  const records=[{heading:'Move objects with Entity',type:'section',pageId:'transforms'},
    {heading:'Entity',type:'api',pageId:'api-entity'},
    {heading:'Entity.move',type:'api',pageId:'api-entity'},
    {heading:'Move a circle',type:'example',pageId:'transforms'}];
  assert.equal(prioritizeSearch(records,'Entity')[0].type,'api');
  assert.equal(prioritizeSearch(records,'move()')[0].heading,'Entity.move');
  assert.equal(matchesSearchFilter(records[0],'guide'),true);
  assert.equal(matchesSearchFilter(records[1],'guide'),false);
  assert.equal(matchesSearchFilter(records[3],'example'),true);
  assert.equal(matchesSearchFilter({type:'page',pageId:'examples-shapes'},'example'),true);
});

test('drafts persist by source revision, preserve empty edits and reset to canonical source',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  assert.equal(saveDraft('draft-test','r1','edited','source',storage),true);
  assert.equal(values.size,1);assert.equal(readDraft('draft-test','r1',storage),'edited');
  assert.equal(readDraft('draft-test','r2',storage),undefined);
  saveDraft('draft-test','r1','','source',storage);assert.equal(readDraft('draft-test','r1',storage),'');
  saveDraft('draft-test','r1','source','source',storage);
  assert.equal(values.size,0);assert.equal(readDraft('draft-test','r1',storage),undefined);
});

test('storage failures retain the latest edit and a reset without resurrecting old drafts',()=>{
  const storage={getItem:()=> 'old edit',setItem:()=>{throw new Error('Quota');},removeItem:()=>{throw new Error('Quota');}};
  assert.equal(saveDraft('fallback-test','r1','new edit','source',storage),false);
  assert.equal(readDraft('fallback-test','r1',storage),'new edit');
  saveDraft('fallback-test','r1','source','source',storage);assert.equal(readDraft('fallback-test','r1',storage),undefined);
  saveDraft('memory-test','r1','edit','source',undefined);assert.equal(readDraft('memory-test','r1',undefined),'edit');
});

test('nested Markdown preserves formatted link labels without literal delimiters',()=>{
  assert.deepEqual(parseInline('**[`PlayerControls`](/api-control#playercontrols)**'),[
    {type:'strong',children:[{type:'link',url:'/api-control#playercontrols',children:[{type:'code',text:'PlayerControls'}]}]},
  ]);
  assert.deepEqual(parseInline('[**Scene** and _camera_](/scene)'),[
    {type:'link',url:'/scene',children:[{type:'strong',children:[{type:'text',text:'Scene'}]},{type:'text',text:' and '},{type:'em',children:[{type:'text',text:'camera'}]}]},
  ]);
});

test('inline destinations retain balanced parentheses and literal incomplete syntax',()=>{
  assert.deepEqual(parseInline('[API](https://example.test/method(value))'),[
    {type:'link',url:'https://example.test/method(value)',children:[{type:'text',text:'API'}]},
  ]);
  assert.deepEqual(parseInline('gpu_buffer and [unfinished](path'),[{type:'text',text:'gpu_buffer and [unfinished](path'}]);
  assert.deepEqual(parseInline('\\*literal\\*'),[{type:'text',text:'*literal*'}]);
});

test('inline code and math remain literal while explicit breaks are rendered separately',()=>{
  assert.deepEqual(parseInline('`**not bold**`<br/>$\\Delta t$'),[
    {type:'code',text:'**not bold**'},{type:'break'},{type:'math',text:'\\Delta t'},
  ]);
  assert.deepEqual(parseInline('``a ` b``'),[{type:'code',text:'a ` b'}]);
});

test('tree descriptions are supported by the authoring and runtime schemas',t=>{
  const {directory,write,page}=fixture(t);
  write('guides/first.json',page('first',[{type:'tree',variant:'vertical',nodes:[{label:'Scene',description:'Playback state',children:[{label:'PlayerControls',description:'DOM transport'}]}]}]));
  assert.equal(loadContent(directory).content.pages[0].sections[0].blocks[1].nodes[0].description,'Playback state');
});

test('nested lists preserve structure, search text, numbering and link validation',t=>{
  const {directory,write,page}=fixture(t);
  const list={type:'list',ordered:true,start:3,items:[{
    text:'World view',children:['Clear depth.',{text:'Overlay',ordered:true,children:['Preserve scene color.','[Continue](/second#intro)']}],
  }]};
  write('guides/first.json',page('first',[list]));
  const {content}=loadContent(directory);
  assert.deepEqual(content.pages[0].sections[0].blocks[1],list);
  const search=buildSearchIndex(content.pages).find(record=>record.sectionId==='intro'&&record.type==='section');
  assert.match(search.snippet,/World view.*Clear depth.*Overlay.*Preserve scene color/);
  assert.doesNotMatch(search.snippet,/\[object Object\]/);
  list.items[0].children[1].children[1]='[Continue](/second#removed)';
  write('guides/first.json',page('first',[list]));
  assert.throws(()=>loadContent(directory),/Broken anchor/);
  list.items=[{children:['Missing item text']}];
  write('guides/first.json',page('first',[list]));
  assert.throws(()=>loadContent(directory),/allowed schema shape/);
});
