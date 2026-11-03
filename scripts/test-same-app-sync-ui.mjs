import assert from 'node:assert/strict';
import { access, cp, mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { X509Certificate, createHash } from 'node:crypto';
import { chromium } from 'playwright';

const source=path.resolve(process.argv[2]||'releases/Kalen-Servidor-Local-HTTPS-Windows');
const httpsPort=process.env.TEST_HTTPS_PORT||'4174';const setupPort=process.env.TEST_SETUP_PORT||'4180';
const localOrigin='https://127.0.0.1:'+httpsPort;const setupOrigin='http://127.0.0.1:'+setupPort;
const localEnv={KALEN_LOCAL_DIST:'',KALEN_HTTPS_PORT:httpsPort,KALEN_SETUP_PORT:setupPort};
await mkdir('test-results',{recursive:true});
const folder=await mkdtemp(path.resolve('test-results/https-notebook-'));
await cp(source,folder,{recursive:true});
await assert.rejects(access(path.join(source,'.local-https/ca/rootCA-key.pem')));
const runtime=path.join(folder,'runtime/node.exe');
const children=[];let browser;
const launch=(args,env={})=>{const child=spawn(runtime,args,{cwd:tmpdir(),windowsHide:true,env:{...process.env,KALEN_NO_BROWSER:'1',PATH:path.join(folder,'runtime'),...env}});children.push(child);let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);return {child,logs:()=>logs};};
const waitFor=async(probe,logs)=>{for(let i=0;i<100;i++){try{if(await probe())return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('No respondió el servidor: '+logs());};
try {
 localEnv.KALEN_LOCAL_DIST=path.join(folder,'dist');
 const local=launch([path.join(folder,'scripts/start-local-https.mjs')],localEnv);
 await waitFor(async()=>{const res=await fetch(setupOrigin+'/');return res.ok;},local.logs);
 const ca=await readFile(path.join(folder,'.local-https/Kalen-CA.crt'));
 const cert=new X509Certificate(await readFile(path.join(folder,'.local-https/server.pem')));
 const spki=createHash('sha256').update(cert.publicKey.export({type:'spki',format:'der'})).digest('base64');
 const get=url=>new Promise((resolve,reject)=>{const req=https.get(url,{ca},res=>{const authorized=res.socket.authorized;let body='';res.on('data',b=>body+=b);res.on('end',()=>resolve({status:res.statusCode,authorized,body}));});req.on('error',reject);});
 const health=await get(localOrigin+'/healthz');assert.equal(health.status,200);assert.equal(health.authorized,true);
 for(const name of ['/server-key.pem','/.local-https/ca/rootCA-key.pem','/ca/rootCA-key.pem'])assert.equal((await get(localOrigin+name)).status,404);
 const help=await (await fetch(setupOrigin+'/')).text();assert.ok(help.includes('ya instalaron desde Netlify'));assert.equal(await (await fetch(setupOrigin+'/certificado.crt')).text(),ca.toString());
 assert.ok(help.includes('wss://127.0.0.1:'+httpsPort+'/sync'));assert.ok(help.includes('Servidor de sincronización'));assert.ok(help.includes('sin espacios ni punto al final'));
 // A second TLS server stands in for the Internet service. Both accept the real Netlify origin.
 const online=launch([path.join(folder,'server.mjs')],{PORT:'4195',DIST_DIR:path.resolve('dist'),TLS_CERT_FILE:path.join(folder,'.local-https/server.pem'),TLS_KEY_FILE:path.join(folder,'.local-https/server-key.pem')});
 await waitFor(async()=> (await get('https://127.0.0.1:4195/healthz')).status===200,online.logs);
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--ignore-certificate-errors-spki-list='+spki]});
 const origin='https://kalenfolklore.netlify.app';const errors=[];
 const newDevice=async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.grantPermissions(['local-network-access'],{origin});
  // Serve this working copy under the SAME origin as the installed app, without publishing.
  await context.route(origin+'/**',async route=>{let name=new URL(route.request().url()).pathname;if(name==='/')name='/index.html';const file=path.resolve('dist','.'+name);if(!file.startsWith(path.resolve('dist')+path.sep))return route.abort();try{const body=await readFile(file);const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};await route.fulfill({body,contentType:types[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'No encontrado'});}});
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('Browser:',m.text());});page.on('websocket',ws=>ws.on('socketerror',error=>console.log('WebSocket:',error)));await page.goto(origin);
  return page;
 };
 const leader=await newDevice(),follower=await newDevice();
 const settings=page=>page.getByRole('button',{name:'Sincronizar',exact:false}).first().click();
 const configure=async(page,mode,address)=>{
  await settings(page);await page.getByRole('button',{name:mode,exact:true}).click();await page.getByRole('button',{name:'Configurar conexión',exact:true}).click();await page.getByLabel(mode==='Notebook'?'Dirección de la notebook':'Servidor de sincronización',{exact:true}).fill(address);await page.getByRole('button',{name:'Cerrar configuración',exact:true}).click();
 };
 await leader.getByRole('button',{name:/Nueva canción/}).click();await leader.getByLabel('Título',{exact:true}).fill('La misma app');await leader.getByLabel('Letra',{exact:true}).fill('Hola músicos\n\nSegunda estrofa');await leader.getByRole('button',{name:'Guardar canción',exact:true}).click();await leader.getByRole('button',{name:'Volver al inicio',exact:true}).click();
 const connect=async()=>{await leader.getByLabel('Código del grupo').fill('MISMA-APP');await leader.getByRole('button',{name:'Crear grupo',exact:true}).click();try{await leader.waitForFunction(()=>document.querySelector('.sync-status')?.textContent.includes('Director'));}catch(error){console.log('Estado director:',await leader.locator('.sync-status').textContent());throw error;}await follower.getByLabel('Código del grupo').fill('MISMA-APP');await follower.getByRole('button',{name:'Unirme',exact:true}).click();await follower.waitForFunction(()=>document.querySelector('.sync-status')?.textContent.includes('Seguidor'));};
 await configure(leader,'Notebook',localOrigin);await configure(follower,'Notebook','wss://127.0.0.1:'+httpsPort+'/sync');await connect();
 for(const page of [leader,follower]){await page.getByRole('button',{name:'Volver al inicio',exact:true}).click();await page.getByRole('button',{name:/Entrar al escenario/}).click();await page.getByRole('heading',{name:'La misma app',exact:true}).waitFor();await page.getByRole('button',{name:'Salir del modo escenario',exact:true}).click();}
 await follower.reload();await settings(follower);assert.equal(await follower.getByRole('button',{name:'Notebook',exact:true}).getAttribute('aria-pressed'),'true');await follower.getByRole('button',{name:'Configurar conexión',exact:true}).click();assert.equal(await follower.getByLabel('Dirección de la notebook').inputValue(),'wss://127.0.0.1:'+httpsPort+'/sync');await follower.getByRole('button',{name:'Volver al inicio',exact:true}).click();
 for(const page of [leader,follower])await configure(page,'Internet','wss://127.0.0.1:4195/sync');await connect();
 // Switch back without typing a server again, keeping the same app and song library.
 for(const page of [leader,follower]){await page.getByRole('button',{name:'Notebook',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Crear grupo',exact:true}).isEnabled(),true);}
 await connect();await leader.reload();await settings(leader);await leader.getByRole('button',{name:'Internet',exact:true}).click();await leader.getByRole('button',{name:'Configurar conexión',exact:true}).click();assert.equal(await leader.getByLabel('Servidor de sincronización').inputValue(),'wss://127.0.0.1:4195/sync');
 for(const width of [320,390,768,1440]){await leader.setViewportSize({width,height:900});assert.ok(await leader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await leader.screenshot({path:'test-results/same-app-sync.png',fullPage:true});
 assert.deepEqual(errors,[]);
 // Relaunching the portable server must keep the trusted CA.
 const stopped=once(local.child,'exit');local.child.kill();await stopped;
 const restarted=launch([path.join(folder,'scripts/start-local-https.mjs')],localEnv);await waitFor(async()=>(await get(localOrigin+'/healthz')).status===200,restarted.logs);assert.equal(await readFile(path.join(folder,'.local-https/Kalen-CA.crt'),'utf8'),ca.toString());
 console.log('OK: paquete portable sin claves preinstaladas, certificado propio persistente, HTTPS validado, claves inaccesibles, Netlify a WSS local real, modos Notebook/Internet, Director/Seguidor, recarga, biblioteca conservada y pantallas 320–1440.');
} finally {
 await browser?.close();
 for(const child of children)if(child.exitCode===null&&child.signalCode===null){const stopped=once(child,'exit');child.kill();await stopped;}
}
