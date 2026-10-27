import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { WebSocket } from 'ws';
import { defaultSyncEndpoint, validateSyncEndpoint } from '../src/sync-config.mjs';

test('producción requiere un servidor externo seguro; uso local conserva /sync', () => {
  const page = new URL('https://kalenfolklore.netlify.app');
  assert.equal(defaultSyncEndpoint(page), '');
  assert.equal(defaultSyncEndpoint(page, 'wss://ejemplo.onrender.com/sync'), 'wss://ejemplo.onrender.com/sync');
  assert.equal(defaultSyncEndpoint(new URL('http://192.168.1.10:4173')), 'ws://192.168.1.10:4173/sync');
  for (const value of ['', 'https://example.com/sync', 'ws://example.com/sync', 'wss://user:pass@example.com/sync']) {
    assert.throws(() => validateSyncEndpoint(value, 'https:'));
  }
});

function message(ws, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(Error('No llegó el mensaje esperado')); }, 5000);
    const receive = data => { const value = JSON.parse(data.toString()); if (predicate(value)) { cleanup(); resolve(value); } };
    function cleanup() { clearTimeout(timer); ws.off('message', receive); }
    ws.on('message', receive);
  });
}

test('WebSocket acepta Kalen, rechaza otro origen y sincroniza dos dispositivos', {timeout:20000}, async t => {
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const server = spawn(process.execPath, ['server.mjs'], {env:{...process.env,PORT:String(port),ALLOWED_ORIGINS:'https://kalenfolklore.netlify.app'},stdio:['ignore','pipe','pipe']});
  t.after(async () => { const stopped=once(server,'exit'); server.kill(); await stopped; });
  await once(server.stdout, 'data');
  assert.deepEqual(await (await fetch('http://127.0.0.1:'+port+'/healthz')).json(), {ok:true});
  const endpoint = 'ws://127.0.0.1:'+port+'/sync?room=TEST-KALEN';
  const leader = new WebSocket(endpoint, {origin:'https://kalenfolklore.netlify.app'});
  t.after(() => leader.terminate());
  const leadStatus = message(leader, m => m.type==='status');
  assert.equal((await leadStatus).role, 'leader');
  const follower = new WebSocket(endpoint, {origin:'https://kalenfolklore.netlify.app'});
  t.after(() => follower.terminate());
  const followerStatus = await message(follower, m => m.type==='status');
  assert.equal(followerStatus.role, 'follower'); assert.equal(followerStatus.peers, 2);
  const cue = {song:{id:'test',title:'Prueba',artist:'Kalen',lyrics:'Primera estrofa\n\nSegunda estrofa',lyricFormats:[{start:0,end:7,bold:true,color:'#ff0000'}]},stanza:1,fraction:0.5};
  const received = message(follower, m => m.type==='cue');
  leader.send(JSON.stringify({type:'cue',cue}));
  assert.deepEqual((await received).cue, cue);
  const rejoined = new WebSocket(endpoint, {origin:'https://kalenfolklore.netlify.app'});
  t.after(() => rejoined.terminate());
  assert.deepEqual((await message(rejoined, m => m.type==='cue')).cue, cue);
  const rejected = new WebSocket(endpoint, {origin:'https://otro-sitio.example'});
  const rejection = once(rejected, 'unexpected-response'); rejected.on('error',()=>{});
  const [,response] = await rejection; assert.equal(response.statusCode,403); response.resume(); rejected.terminate();
  const local = new WebSocket(endpoint, {origin:'http://127.0.0.1:'+port});
  t.after(() => local.terminate());
  assert.equal((await message(local,m=>m.type==='status')).role, 'follower');
});
