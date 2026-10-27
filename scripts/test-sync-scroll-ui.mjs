import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const base=process.env.TEST_URL||'http://localhost:4173';
try {
 const leaderContext=await browser.newContext({viewport:{width:390,height:844}});
 const followerContext=await browser.newContext({viewport:{width:820,height:1180}});
 const leader=await leaderContext.newPage();const follower=await followerContext.newPage();
 const errors=[];for(const page of [leader,follower]){page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto(base);}
 const lyrics=Array.from({length:100},(_,i)=>'Linea '+i+' para seguir la lectura').join('\n');
 const songs=['Fuera del show','Primera del show','Segunda del show'].map((title,i)=>({id:'test-sync-'+i,title,artist:'Prueba',lyrics}));
 await leader.evaluate(async library=>{await new Promise((resolve,reject)=>{const r=indexedDB.open('repertorio-local',1);r.onsuccess=()=>{const db=r.result;const t=db.transaction('library','readwrite');t.objectStore('library').put(library,'current');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};});},{songs,order:[songs[1].id,songs[2].id]});
 await leader.reload();
 await leader.locator('.board-tile').filter({hasText:'Sincronizar'}).click();
 const code='test-'+Date.now();await leader.getByLabel(/digo del grupo/).fill(code);await leader.getByRole('button',{name:'Crear grupo',exact:true}).click();await leader.waitForFunction(()=>document.querySelector('.sync-status')?.textContent.includes('Director'));
 await follower.locator('.board-tile').filter({hasText:'Sincronizar'}).click();await follower.getByLabel(/digo del grupo/).fill(code);await follower.getByRole('button',{name:'Unirme',exact:true}).click();await follower.waitForFunction(()=>document.querySelector('.sync-status')?.textContent.includes('Seguidor'));
 for(const page of [leader,follower])await page.getByRole('button',{name:'Volver al inicio',exact:true}).click();
 // Opening a library song outside the show must still allow advancing into the show.
 await leader.getByRole('button',{name:'Biblioteca',exact:false}).first().click();await leader.getByRole('button',{name:'Fuera del show Prueba',exact:true}).click();
 assert.equal(await leader.getByRole('button',{name:'Siguiente',exact:true}).isEnabled(),true);
 await leader.getByRole('button',{name:'Siguiente',exact:true}).click();await leader.getByRole('heading',{name:'Primera del show',exact:true}).waitFor();
 await follower.getByRole('button',{name:/Entrar al escenario/}).click();await follower.getByRole('heading',{name:'Primera del show',exact:true}).waitFor();
 await leader.getByRole('button',{name:'Ajustes de lectura',exact:true}).click();await leader.getByLabel('Velocidad de lectura',{exact:true}).fill('90');await leader.getByRole('button',{name:'Volver al escenario',exact:true}).click();
 await leader.getByRole('button',{name:/Iniciar desplazamiento/}).click();
 await follower.waitForFunction(()=>document.querySelector('.lyrics-reader').scrollTop>45);
 // Both remain within the same long stanza: following must work between stanza changes.
 assert.equal(await leader.locator('[data-stanza]').count(),1);
 const before=await follower.locator('.lyrics-reader').evaluate(el=>el.scrollTop);
 await follower.waitForFunction(previous=>document.querySelector('.lyrics-reader').scrollTop>previous+30,before);
 await leader.getByRole('button',{name:/Pausar desplazamiento/}).click();
 await follower.waitForTimeout(400);const paused=await follower.locator('.lyrics-reader').evaluate(el=>el.scrollTop);await follower.waitForTimeout(350);assert.equal(await follower.locator('.lyrics-reader').evaluate(el=>el.scrollTop),paused);
 await leader.getByRole('button',{name:'Siguiente',exact:true}).click();await follower.getByRole('heading',{name:'Segunda del show',exact:true}).waitFor();
 await leader.getByRole('button',{name:'Anterior',exact:true}).click();await follower.getByRole('heading',{name:'Primera del show',exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('OK: director navigation outside show, continuous follower scroll within stanza, pause, next and previous with empty follower library.');
}finally{await browser.close();}
