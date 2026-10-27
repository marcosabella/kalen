import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir, networkInterfaces } from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';
const folder = path.resolve(process.argv[2] || 'releases/Kalen-Servidor-Local-Windows');
await access(path.join(folder, 'node_modules/ws/package.json'));
await access(path.join(folder, 'runtime/LICENCIAS-NODE.txt'));
const launcher = spawn(path.join(folder, 'runtime/node.exe'), [path.join(folder, 'scripts/start-local.mjs')], {
  cwd: tmpdir(), windowsHide: true,
  env: { ...process.env, KALEN_NO_BROWSER: '1', PATH: path.join(folder, 'runtime') }
});
let logs = '';
launcher.stdout.on('data', data => logs += data);
launcher.stderr.on('data', data => logs += data);
const sockets = [];
function message(ws, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.off('message', listener); reject(Error('WebSocket timeout')); }, 10000);
    const listener = bytes => { const value = JSON.parse(bytes); if (predicate(value)) { clearTimeout(timer); ws.off('message', listener); resolve(value); } };
    ws.on('message', listener);
    ws.once('error', reject);
  });
}
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (launcher.exitCode !== null) throw Error('El iniciador fallo: ' + logs);
    try {
      const health = await fetch('http://127.0.0.1:4173/healthz');
      if (health.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, 'El servidor no inicio: ' + logs);
  const addresses = Object.values(networkInterfaces()).flat().filter(a => a?.family === 'IPv4' && !a.internal);
  const host = addresses[0]?.address || '127.0.0.1';
  const origin = 'http://' + host + ':4173';
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  const html = await page.text();
  const script = html.match(/src="([^"]+\.js)"/)[1];
  const js = await (await fetch(origin + script)).text();
  assert(!js.includes('kalen-1a98.onrender.com'), 'El paquete todavia usa Render');
  const room = 'portable-' + Date.now();
  const url = 'ws://' + host + ':4173/sync?room=' + room;
  const leader = new WebSocket(url, { origin }); sockets.push(leader);
  assert.equal((await message(leader, m => m.type === 'status')).role, 'leader');
  const follower = new WebSocket(url, { origin }); sockets.push(follower);
  const status = await message(follower, m => m.type === 'status');
  assert.equal(status.role, 'follower'); assert.equal(status.peers, 2);
  const cue = { song: { id: 'prueba-local', title: 'Prueba local', artist: 'Kalen', lyrics: 'Estrofa uno\n\nEstrofa dos' }, stanza: 1, fraction: 0.4 };
  const received = message(follower, m => m.type === 'cue');
  leader.send(JSON.stringify({ type: 'cue', cue }));
  assert.deepEqual((await received).cue, cue);
  const late = new WebSocket(url, { origin }); sockets.push(late);
  assert.deepEqual((await message(late, m => m.type === 'cue')).cue, cue);
  assert(logs.includes('KALEN - SERVIDOR LOCAL'));
  console.log('OK: runtime portable, inicio desde otra carpeta, HTTP por IP local, build sin Render, Director/Seguidor, cancion, estrofa y desplazamiento, seguidor tardio.');
} finally {
  for (const socket of sockets) socket.terminate();
  launcher.kill();
  if (launcher.exitCode === null) await once(launcher, 'exit');
}
