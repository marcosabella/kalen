import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import https from 'node:https';
import { X509Certificate, createHash } from 'node:crypto';
import WebSocket from 'ws';
import { chromium } from 'playwright';
const host = process.argv[2] || '127.0.0.1';
const origin = 'https://' + host + ':4174';
const ca = await readFile('.local-https/Kalen-CA.crt');
function get(url) { return new Promise((resolve, reject) => { const req = https.get(url, { ca, timeout: 10000 }, res => { const authorized=res.socket.authorized; let body=''; res.on('data', data => body+=data); res.on('end', () => resolve({ status:res.statusCode, body, headers:res.headers, authorized })); }); req.on('error', reject); req.on('timeout', () => req.destroy(Error('Timeout'))); }); }
const health = await get(origin + '/healthz');
assert.equal(health.status, 200); assert(health.authorized); assert.deepEqual(JSON.parse(health.body), {ok:true});
const manifest = await get(origin + '/manifest.webmanifest'); assert.equal(manifest.status,200); assert(JSON.parse(manifest.body).icons.length >= 2);
assert.equal((await get(origin + '/sw.js')).status, 200);
assert.equal((await get(origin + '/server-key.pem')).status, 404);
assert.equal((await get(origin + '/ca/rootCA-key.pem')).status, 404);
const download = await fetch('http://' + host + ':4180/certificado.crt'); assert.equal(await download.text(), ca.toString());
function message(ws, predicate) { return new Promise((resolve,reject) => { const timeout=setTimeout(()=>{ws.off('message',listener);reject(Error('WebSocket timeout'));},10000); const listener=bytes=>{const m=JSON.parse(bytes);if(predicate(m)){clearTimeout(timeout);ws.off('message',listener);resolve(m);}};ws.on('message',listener);ws.once('error',reject); }); }
const sockets=[];
try {
  const url='wss://' + host + ':4174/sync?room=https-test-'+Date.now();
  const leader=new WebSocket(url,{ca,origin}); sockets.push(leader); assert.equal((await message(leader,m=>m.type==='status')).role,'leader');
  const follower=new WebSocket(url,{ca,origin}); sockets.push(follower); assert.equal((await message(follower,m=>m.type==='status')).role,'follower');
  const cue={song:{id:'https-test',title:'Prueba HTTPS',artist:'Kalen',lyrics:'Uno\n\nDos'},stanza:1,fraction:0.5};
  const received=message(follower,m=>m.type==='cue'); leader.send(JSON.stringify({type:'cue',cue}));assert.deepEqual((await received).cue,cue);
} finally { for(const ws of sockets) ws.terminate(); }
const cert = new X509Certificate(await readFile('.local-https/server.pem'));
const spki = createHash('sha256').update(cert.publicKey.export({type:'spki',format:'der'})).digest('base64');
const browser = await chromium.launch({headless:true,args:['--ignore-certificate-errors-spki-list='+spki]});
try {
  const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(origin, {waitUntil:'networkidle'});
  await page.evaluate(() => navigator.serviceWorker.ready);
  assert(await page.evaluate(() => window.isSecureContext));
  const session=await context.newCDPSession(page);
  const installation=await session.send('Page.getInstallabilityErrors');
  console.log('Criterios de instalacion:', JSON.stringify(installation));
  assert.deepEqual(installation.installabilityErrors, []);
  await page.screenshot({path:'.local-https/prueba-android.png',fullPage:true});
} finally { await browser.close(); }
console.log('OK: HTTPS con certificado validado para la IP, CA publica descargable, claves privadas inaccesibles, PWA instalable en Chromium, WSS Director/Seguidor.');

