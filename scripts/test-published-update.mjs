import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { chromium } from 'playwright';

const base='https://kalenfolklore.netlify.app';
const folder=path.resolve('test-results/published-update-profile');
await mkdir('test-results',{recursive:true});
const context=await chromium.launchPersistentContext(folder,{headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',viewport:{width:390,height:844}});
const song={id:'update-preservation-test',title:'Prueba de actualización',artist:'Kalen',lyrics:'Una canción guardada antes de actualizar',lyricFormats:[{start:0,end:3,bold:true,color:'#ff0000'}]};
try {
 const page=context.pages()[0]||await context.newPage();page.setDefaultTimeout(30000);
 await page.route('**/api/chords/search?**',route=>route.fulfill({json:{results:[]}}));
 await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 if(process.argv.includes('--prepare')) {
  await page.evaluate(async song=>{await new Promise((resolve,reject)=>{const request=indexedDB.open('repertorio-local',1);request.onsuccess=()=>{const db=request.result;const tx=db.transaction('library','readwrite');tx.objectStore('library').put({songs:[song],order:[song.id]},'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);});localStorage.setItem('stage-visual-v1',JSON.stringify({fontSize:38,lineHeight:1.8,speed:12,theme:'light',highContrast:false}));},song);
  await page.reload();await page.getByRole('button',{name:'Preferencias visuales',exact:true}).click();
  const sw=await (await context.request.get(base+'/sw.js')).text();
  await writeFile('test-results/published-update-before.json',JSON.stringify({workerHash:createHash('sha256').update(sw).digest('hex')},null,2));
  console.log('Preparada versión anterior de producción en perfil aislado, con canción y preferencias guardadas.');
 } else {
  await page.getByRole('button',{name:'Preferencias visuales',exact:true}).click();
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update();});
  const update=page.getByRole('button',{name:'Aplicar actualización disponible',exact:true});await update.waitFor();
  await page.screenshot({path:'test-results/published-update-button.png',fullPage:true});
  await update.click();await page.waitForEvent('load');
  await page.getByRole('button',{name:'Sincronizar',exact:false}).first().click();
  await page.getByRole('button',{name:'Internet',exact:true}).waitFor();await page.getByRole('button',{name:'Notebook',exact:true}).waitFor();assert.equal(await page.getByLabel('Recibir formato de las canciones').isChecked(),true);
  await page.getByRole('button',{name:'Configurar conexión',exact:true}).click();assert.match(await page.getByLabel('Servidor de sincronización').inputValue(),/^wss:\/\//);
  const saved=await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('repertorio-local',1);request.onsuccess=()=>{const db=request.result;const tx=db.transaction('library');const read=tx.objectStore('library').get('current');read.onsuccess=()=>resolve(read.result);read.onerror=()=>reject(read.error);tx.oncomplete=()=>db.close();};}));assert.deepEqual(saved.songs,[song]);
  const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('stage-visual-v1')));assert.equal(prefs.fontSize,38);assert.equal(prefs.theme,'light');
  const sw=await (await context.request.get(base+'/sw.js')).text();const previous=JSON.parse(await readFile('test-results/published-update-before.json','utf8'));assert.notEqual(createHash('sha256').update(sw).digest('hex'),previous.workerHash);
  console.log('OK: producción mostró Aplicar actualización disponible; actualizó sin reinstalar, conservó canción con formato, fuente y tema; Internet/Notebook y formato sincronizado disponibles.');
 }
} finally {await context.close();}
