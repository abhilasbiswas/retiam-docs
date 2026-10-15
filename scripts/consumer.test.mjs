import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.resolve('retiam'))),'..');
const blocks=relative=>JSON.parse(fs.readFileSync(path.join(site,'content',relative),'utf8'))
  .sections.flatMap(section=>section.blocks).filter(block=>block.type==='code');

test('the documented npm and React hosts type-check through the package exports',()=>{
  assert.ok(fs.existsSync(path.join(root,'dist/src/index.d.ts')),'Install the documented Retiam package before checking its declarations.');
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'retiam-docs-consumer-'));
  try {
    const write=(name,value)=>{
      const file=path.join(directory,name);
      fs.mkdirSync(path.dirname(file),{recursive:true});
      fs.writeFileSync(file,value);
    };
    const link=(name,target)=>{
      const file=path.join(directory,'node_modules',name);
      fs.mkdirSync(path.dirname(file),{recursive:true});
      fs.symlinkSync(target,file,process.platform==='win32'?'junction':'dir');
    };
    link('retiam',root);
    for(const name of ['react','react-dom','@types/react','@types/react-dom','@types/node','vite']) {
      link(name,path.join(site,'node_modules',name));
    }
    link('@webgpu/types',path.join(site,'node_modules/@webgpu/types'));
    const installation=blocks('guides/start-here/installation.json');
    const integration=blocks('guides/core-authoring/application-integration.json');
    const select=(all,predicate)=>{
      const matches=all.filter(predicate);
      assert.equal(matches.length,1,'The host example must have exactly one canonical source block.');
      return matches[0].code;
    };
    write('scenes/MyScene.ts',select(installation,b=>b.code.includes('export default class MyScene')));
    write('src/main.ts',select(installation,b=>b.code.includes('async function bootstrap')));
    write('vite.config.ts',select(installation,b=>b.code.includes('optimizeDeps:')));
    write('src/MeterScene.ts',select(integration,b=>b.code.includes('export default class MeterScene')));
    write('src/RetiamPreview.tsx',select(integration,b=>b.code.includes('export function RetiamPreview')));
    write('src/App.tsx',select(integration,b=>b.language==='tsx'&&b.code.includes('createRoot(')));
    write('src/embed.ts',fs.readFileSync(path.join(site,'content/playgrounds/embed-element.ts'),'utf8'));
    write('vite.embed.config.ts',fs.readFileSync(path.join(site,'content/playgrounds/embed-vite.config.ts'),'utf8'));
    write('package.json',JSON.stringify({name:'retiam-docs-consumer-check',private:true,type:'module'}));
    write('tsconfig.json',JSON.stringify({compilerOptions:{
      target:'ES2022',module:'ESNext',moduleResolution:'Bundler',lib:['ES2022','DOM'],
      types:['@webgpu/types'],jsx:'react-jsx',strict:true,skipLibCheck:true,noEmit:true,
    },include:['src','scenes','vite.config.ts','vite.embed.config.ts']}));
    execFileSync(process.execPath,[path.join(site,'node_modules/typescript/bin/tsc'),'-p',directory],{encoding:'utf8',stdio:'pipe'});
  } finally { fs.rmSync(directory,{recursive:true,force:true}); }
});
