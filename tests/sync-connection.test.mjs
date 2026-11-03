import test from 'node:test';
import assert from 'node:assert/strict';
import { initialSyncConnection, notebookEndpoint } from '../src/sync-connection.mjs';

test('la misma app separa Internet y Notebook y recuerda ambos al reiniciar',()=>{
 const page=new URL('https://kalenfolklore.netlify.app');
 const online='wss://kalen.example/sync';
 assert.deepEqual(initialSyncConnection(page,online),{mode:'internet',internet:online,notebook:''});
 const saved={mode:'notebook',internet:online,notebook:'https://192.168.1.10:4174'};
 assert.deepEqual(initialSyncConnection(page,online,JSON.parse(JSON.stringify(saved))),saved);
 assert.equal(notebookEndpoint(saved.notebook),'wss://192.168.1.10:4174/sync');
 assert.equal(initialSyncConnection(page,online,{...saved,mode:'internet'}).internet,online);
});
test('acepta la direccion mostrada por la notebook o solo su IP',()=>{
 for(const address of ['192.168.1.10','192.168.1.10:4174','https://192.168.1.10:4174/','wss://192.168.1.10:4174/sync'])assert.equal(notebookEndpoint(address),'wss://192.168.1.10:4174/sync');
 assert.equal(notebookEndpoint(''),'');
 for(const address of ['http://192.168.1.10:4173','https://user:pass@192.168.1.10','https://192.168.1.10/#x','https://192.168.1.10/?room=demo','https://192.168.1.10/ruta'])assert.throws(()=>notebookEndpoint(address));
});
test('configuracion dañada no bloquea el inicio ni cambia al servidor inseguro',()=>{
 const page=new URL('https://kalenfolklore.netlify.app');
 const initial=initialSyncConnection(page,'wss://kalen.example/sync');
 for(const value of [null,0,'texto',[],{mode:'desconocido',internet:'ws://example/sync',notebook:'javascript:alert(1)'}])assert.deepEqual(initialSyncConnection(page,initial.internet,value),initial);
 assert.equal(initialSyncConnection(new URL('https://192.168.1.10:4174')).mode,'notebook');
});
