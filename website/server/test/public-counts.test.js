import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { bankSize, loadBank } from '../src/subjects/maths/bank/index.js';
import { higherBankSize, loadHigherBank } from '../src/subjects/maths/bank/higher.js';

function countAt(html, id) {
  const match = html.match(new RegExp(`id="${id}"[^>]*>([^<]+)`));
  assert.ok(match, `missing ${id} count`);
  return Number(match[1].replaceAll(',', '').match(/^\d+/)?.[0]);
}

test('public Maths question counts match the generated banks', async () => {
  await loadBank();
  await loadHigherBank();
  const foundation = bankSize();
  const higher = higherBankSize();
  const home = await readFile(new URL('../../selector/index.html', import.meta.url), 'utf8');
  const directory = await readFile(new URL('../../selector/subjects.html', import.meta.url), 'utf8');
  const directoryScript = await readFile(new URL('../../selector/subjects.js', import.meta.url), 'utf8');
  const readme = await readFile(new URL('../../README.md', import.meta.url), 'utf8');
  const product = await readFile(new URL('../../../PRODUCT.md', import.meta.url), 'utf8');

  assert.equal(countAt(home, 'maths-bank'), foundation);
  assert.equal(countAt(home, 'higher-bank'), higher);
  assert.equal(countAt(directory, 'dir-maths-q'), foundation);
  assert.equal(countAt(directory, 'dir-maths-higher-q'), higher);
  const combinedFloor = countAt(directory, 'spec-bank');
  assert.ok(combinedFloor <= foundation + higher && foundation + higher < combinedFloor + 100);
  assert.match(directoryScript, new RegExp(`let bank = '${combinedFloor.toLocaleString()}\\+'`));
  assert.ok(readme.includes(`${foundation.toLocaleString()} generated questions`));
  assert.ok(product.includes(`${foundation.toLocaleString()} generated questions`));
});
