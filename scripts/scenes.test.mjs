import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const engine=path.resolve(path.dirname(fileURLToPath(import.meta.resolve('retiam'))),'..');
const directory=path.join(root,'content/playgrounds');
for(const file of fs.readdirSync(directory).filter(file=>/^(compare|project|workshop|tutorial|pg|lab)-.*\.ts$/.test(file))) {
  test(`${file} passes the engine's scene authoring checks`,()=>{
    const result=JSON.parse(execFileSync(process.execPath,[path.join(engine,'bin/cli.js'),'lint',path.join(directory,file),'--json'],{cwd:root,encoding:'utf8'}));
    assert.equal(result.valid,true,JSON.stringify(result.diagnostics));
    assert.equal(result.summary.warnings,0,JSON.stringify(result.diagnostics));
  });
}
