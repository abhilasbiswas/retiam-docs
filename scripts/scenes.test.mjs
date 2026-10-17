import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const engine=path.resolve(path.dirname(fileURLToPath(import.meta.resolve('retiam'))),'..');
const directory=path.join(root,'content/playgrounds');
const files=fs.readdirSync(directory).filter(file=>/^(compare|project|workshop|tutorial|pg|lab)-.*\.ts$/.test(file));
// The engine CLI treats every method named play/wait as asynchronous. Video
// and spatial-audio play() return void; keep their examples idiomatic and only
// exempt diagnostics whose call signature proves there is nothing to await.
const program=ts.createProgram(files.map(file=>path.join(directory,file)),{target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,skipLibCheck:true});
const checker=program.getTypeChecker();
function synchronousCall(file,diagnostic){
  const source=program.getSourceFile(path.join(directory,file));
  let synchronous=false;
  function visit(node){
    if(diagnostic.rule==='retiam/dangling-entity'&&ts.isVariableDeclaration(node)&&node.initializer&&ts.isNewExpression(node.initializer)){
      const position=source.getLineAndCharacterOfPosition(node.getStart(source));
      const symbol=checker.getTypeAtLocation(node).getSymbol();
      // Group is a collection of separately attached entities, not an Entity.
      if(position.line+1===diagnostic.line&&symbol?.name==='Group'&&symbol.declarations?.some(declaration=>/\/_core\/Group\.d\.ts$/.test(declaration.getSourceFile().fileName)))synchronous=true;
    }
    if(diagnostic.rule==='retiam/missing-await'&&ts.isCallExpression(node)){
      const position=source.getLineAndCharacterOfPosition(node.getStart(source));
      if(position.line+1===diagnostic.line&&position.character+1===diagnostic.col){
        const signature=checker.getResolvedSignature(node);
        synchronous=!!signature&&!!(checker.getReturnTypeOfSignature(signature).flags&ts.TypeFlags.Void);
      }
    }
    ts.forEachChild(node,visit);
  }
  if(source)visit(source);
  return synchronous;
}
for(const file of files) {
  test(`${file} passes the engine's scene authoring checks`,()=>{
    let output;
    try{output=execFileSync(process.execPath,[path.join(engine,'bin/cli.js'),'lint',path.join(directory,file),'--json'],{cwd:root,encoding:'utf8'});}
    catch(error){if(!error.stdout)throw error;output=error.stdout;}
    const result=JSON.parse(output);
    assert.ok(Array.isArray(result.diagnostics), 'Engine lint must return diagnostics');
    const diagnostics=result.diagnostics.filter(diagnostic=>!synchronousCall(file,diagnostic));
    assert.deepEqual(diagnostics,[],JSON.stringify(diagnostics));
  });
}
