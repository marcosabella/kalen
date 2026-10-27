import test from 'node:test';
import assert from 'node:assert/strict';
import { createId } from '../src/id.mjs';
test('uses native UUID when available',()=>{
 const source={randomUUID(){assert.equal(this,source);return 'native-id';}};
 assert.equal(createId(source),'native-id');
});
test('HTTP fallback produces distinct v4 UUIDs with browser randomness',()=>{
 const source={getRandomValues(bytes){return globalThis.crypto.getRandomValues(bytes);}};
 const ids=Array.from({length:1000},()=>createId(source));
 assert.equal(new Set(ids).size,ids.length);
 for(const id of ids)assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
