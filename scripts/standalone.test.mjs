import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEngineReference, inspectSources, discoverExamples } from './source-model.mjs';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('versioned API metadata matches the installed release without a source checkout', () => {
  const engine = path.resolve(path.dirname(fileURLToPath(import.meta.resolve('retiam'))), '..');
  const packaged = JSON.parse(fs.readFileSync(path.join(engine, 'package.json'), 'utf8'));
  const reference = readEngineReference();
  assert.equal(reference.version, packaged.version, 'Refresh API metadata when changing the documented Retiam release.');
  assert.ok(engine.startsWith(path.join(site, 'node_modules') + path.sep), 'Use an installed release, not a link to a private checkout.');
  assert.ok(!fs.existsSync(path.join(engine, 'src/index.ts')), 'The installed release must not include engine implementation source.');
  const model = inspectSources();
  assert.ok(Object.keys(model.api).length > 0 && model.hierarchy.nodes.length > 0);
  assert.equal(model.program, undefined, 'Normal reference loading must not create a private-source TypeScript program.');
});

test('all editable examples are owned by the documentation project', () => {
  for (const example of Object.values(discoverExamples())) {
    assert.match(example.source, /^(?:examples\/demos|content\/playgrounds)\//);
    const file = path.resolve(site, example.source);
    assert.ok(file.startsWith(site + path.sep));
    assert.ok(fs.existsSync(file), `${example.id} must not require another checkout.`);
  }
});
