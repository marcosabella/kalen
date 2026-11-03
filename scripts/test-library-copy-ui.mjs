import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const library={songs:[{id:'copy-test',title:'Copia con estilos',artist:'Prueba',lyrics:'[C]Hola\n\nOtra estrofa',lyricFormats:[{start:3,end:7,bold:true,italic:true,underline:true,color:'#ff0000'},{start:9,end:13,color:'#00ff00'}]}],order:['copy-test']};
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const contexts=[];
try {
 const errors=[];
 const newPage=async()=>{const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});contexts.push(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.TEST_URL||'http://localhost:4173');return page;};
 const settings=page=>page.getByRole('button',{name:'Preferencias visuales',exact:true}).click();
 const upload=async(page,data)=>{await page.locator('input[type=file]').setInputFiles({name:'repertorio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.getByRole('status').filter({hasText:'Repertorio importado'}).waitFor();};
 const exportCopy=async(page)=>{const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar copia',exact:true}).click();return JSON.parse(await readFile(await (await download).path(),'utf8'));};
 const inspect=async(page,formatted)=>{
  await page.getByRole('button',{name:'Volver al inicio',exact:true}).click();await page.getByRole('button',{name:/Entrar al escenario/}).click();
  const hola=page.locator('.lyrics-inner span').filter({hasText:/^Hola$/}).last();await hola.waitFor();
  const style=await hola.evaluate(el=>({bold:el.style.fontWeight,italic:el.style.fontStyle,underline:el.style.textDecoration,color:el.style.color}));
  assert.deepEqual(style,formatted?{bold:'700',italic:'italic',underline:'underline',color:'rgb(255, 0, 0)'}:{bold:'',italic:'',underline:'',color:''});
  const otra=page.locator('[data-stanza="1"] span').filter({hasText:/^Otra$/}).last();assert.equal(await otra.evaluate(el=>el.style.color),formatted?'rgb(0, 255, 0)':'');
  await page.getByRole('button',{name:'Salir del modo escenario',exact:true}).click();
 };
 const source=await newPage();await settings(source);await upload(source,library);const copy=await exportCopy(source);assert.deepEqual(copy,library);
 const target=await newPage();
 // A stale synchronized song must not mask the imported song, even after reload.
 await target.evaluate(async song=>{await new Promise((resolve,reject)=>{const request=indexedDB.open('repertorio-local',1);request.onsuccess=()=>{const db=request.result;const t=db.transaction('library','readwrite');t.objectStore('library').put({...song,lyricFormats:undefined},'received');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};request.onerror=()=>reject(request.error);});},library.songs[0]);
 await target.reload();await settings(target);await upload(target,copy);await inspect(target,true);await target.reload();await settings(target);await inspect(target,true);
 await settings(target);await target.getByLabel('Importar con formato de texto').uncheck();await upload(target,copy);await inspect(target,false);await target.reload();await settings(target);await inspect(target,false);
 await source.getByLabel('Exportar con formato de texto').uncheck();const plain=await exportCopy(source);assert.equal('lyricFormats' in plain.songs[0],false);
 await settings(target);assert.deepEqual((await exportCopy(target)).songs[0],plain.songs[0]);await upload(target,plain);await inspect(target,false);
 for(const width of [320,390,768,1440]){await source.setViewportSize({width,height:844});assert.ok(await source.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 assert.deepEqual(errors,[]);
 console.log('OK: copia entre dispositivos con/sin estilos; colores, negrita, cursiva, subrayado, estrofas, recarga, canción sincronizada anterior y pantallas 320–1440.');
} finally {await Promise.all(contexts.map(context=>context.close()));await browser.close();}
