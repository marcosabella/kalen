import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { chromium } from 'playwright';

const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const server=spawn(process.execPath,['server.mjs'],{windowsHide:true,env:{...process.env,PORT:String(port),TLS_CERT_FILE:'',TLS_KEY_FILE:''},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',data=>logs+=data);server.stderr.on('data',data=>logs+=data);
let browser;
try {
 const base='http://localhost:'+port;
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/healthz')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert.ok(ready,logs);
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const errors=[];const devices=[];
 for(let i=0;i<3;i++){const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto(base);devices.push({context,page});}
 const [director,plain,styled]=devices.map(d=>d.page);
 const songs=[{id:'format-sync-1',title:'Primera canción',artist:'Kalen',lyrics:'[C]Hola mundo\n\nOtra estrofa',lyricFormats:[{start:3,end:7,bold:true,italic:true,underline:true,color:'#ff0000'},{start:15,end:19,color:'#00ff00'}]},{id:'format-sync-2',title:'Segunda canción',artist:'Kalen',lyrics:'[G]Hola mundo\n\nOtra estrofa',lyricFormats:[{start:3,end:7,bold:true,italic:true,underline:true,color:'#ff0000'},{start:15,end:19,color:'#00ff00'}]}];
 await director.getByRole('button',{name:'Preferencias visuales',exact:true}).click();await director.locator('input[type=file]').setInputFiles({name:'repertorio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({songs,order:songs.map(s=>s.id)}))});await director.getByRole('status').filter({hasText:'Repertorio importado'}).waitFor();await director.getByRole('button',{name:'Cerrar aviso',exact:true}).click();await director.getByRole('button',{name:'Volver al inicio',exact:true}).click();
 for(const page of [director,plain,styled]){await page.getByRole('button',{name:'Sincronizar',exact:false}).first().click();await page.getByLabel('Código del grupo').fill('FORMATO');}
 await plain.getByLabel('Recibir formato de las canciones').uncheck();await director.getByRole('button',{name:'Crear grupo',exact:true}).click();await director.waitForFunction(()=>document.querySelector('.sync-status')?.textContent.includes('Director'));
 for(const page of [plain,styled]){await page.getByRole('button',{name:'Unirme',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.sync-status')?.textContent.includes('Seguidor'));}
 for(const page of [director,plain,styled]){await page.getByRole('button',{name:'Volver al inicio',exact:true}).click();await page.getByRole('button',{name:/Entrar al escenario/}).click();}
 const inspect=async(page,enabled)=>{
  const hola=page.locator('.lyrics-inner span').filter({hasText:/^Hola$/}).last();await hola.waitFor();assert.deepEqual(await hola.evaluate(el=>({weight:el.style.fontWeight,italic:el.style.fontStyle,decoration:el.style.textDecoration,color:el.style.color})),enabled?{weight:'700',italic:'italic',decoration:'underline',color:'rgb(255, 0, 0)'}:{weight:'',italic:'',decoration:'',color:''});
  const otra=page.locator('[data-stanza="1"] span').filter({hasText:/^Otra$/}).last();assert.equal(await otra.evaluate(el=>el.style.color),enabled?'rgb(0, 255, 0)':'');
 };
 await inspect(director,true);await inspect(plain,false);await inspect(styled,true);
 const toggle=async(enabled)=>{await plain.getByRole('button',{name:'Ajustes de lectura',exact:true}).click();await plain.getByRole('button',{name:'Sincronizar',exact:true}).click();await plain.getByLabel('Recibir formato de las canciones').setChecked(enabled);assert.ok((await plain.locator('.sync-status').textContent()).includes('Seguidor'));await plain.getByRole('button',{name:'Volver al escenario',exact:true}).click();};
 await toggle(true);await inspect(plain,true);await toggle(false);await inspect(plain,false);await inspect(styled,true);
 await director.getByRole('button',{name:'Siguiente',exact:true}).click();for(const page of [plain,styled])await page.getByRole('heading',{name:'Segunda canción',exact:true}).waitFor();await inspect(plain,false);await inspect(styled,true);
 // Display choice must not discard received formats, allowing restoration offline.
 assert.equal(await plain.evaluate(()=>JSON.parse(localStorage.getItem('stage-visual-v1')).syncFormatting),false);
 const cached=await plain.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('repertorio-local',1);request.onsuccess=()=>{const db=request.result;const tx=db.transaction('library');const read=tx.objectStore('library').get('received');read.onsuccess=()=>resolve(read.result);tx.oncomplete=()=>db.close();read.onerror=()=>reject(read.error);};}));assert.deepEqual(cached.lyricFormats,songs[1].lyricFormats);
 await plain.evaluate(()=>navigator.serviceWorker.ready);await plain.waitForFunction(()=>!!navigator.serviceWorker.controller);await devices[1].context.setOffline(true);await plain.reload();await plain.getByRole('button',{name:/Entrar al escenario/}).click();await inspect(plain,false);
 await plain.getByRole('button',{name:'Ajustes de lectura',exact:true}).click();await plain.getByRole('button',{name:'Sincronizar',exact:true}).click();assert.equal(await plain.getByLabel('Recibir formato de las canciones').isChecked(),false);await plain.getByLabel('Recibir formato de las canciones').check();await plain.getByRole('button',{name:'Volver al escenario',exact:true}).click();await inspect(plain,true);
 assert.deepEqual(errors,[]);console.log('OK: director conserva estilos; seguidores independientes con/sin color, negrita, cursiva y subrayado; cambio inmediato sin desconectar; canciones nuevas, persistencia y recuperación del formato sin Internet.');
} finally {
 await browser?.close();if(server.exitCode===null&&server.signalCode===null){const stopped=once(server,'exit');server.kill();await stopped;}
}
