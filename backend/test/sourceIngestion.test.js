import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkText } from '../src/services/chunking.service.js';

test('chunkText returns no chunks for empty input', () => { assert.deepEqual(chunkText('  '), []); });
test('chunkText creates bounded overlapping chunks', () => {
 const input=('official scholarship eligibility deadline income document rules. ').repeat(100);
 const chunks=chunkText(input,300,50);
 assert.ok(chunks.length>1);
 assert.ok(chunks.every(c=>c.text.length<=300));
 assert.ok(chunks[0].text.length>0 && chunks.at(-1).text.length>0);
 assert.ok(chunks.some((c,i)=>i>0 && chunks[i-1].end>c.start));
});
test('chunkText rejects invalid overlap', () => { assert.throws(()=>chunkText('abc',100,100)); });
