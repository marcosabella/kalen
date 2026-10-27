import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const base=process.env.TEST_URL||JSON.parse(await readFile('.netlify/last-deploy.json','utf8')).url;
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(25000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const r=await page.goto(base);assert.equal(r.status(),200);
 await page.getByRole('button',{name:'Nueva canción',exact:false}).click();await page.getByLabel('Título',{exact:true}).fill('De musica ligera');await page.getByLabel('Artista',{exact:true}).fill('Soda Stereo');
 await page.waitForFunction(()=>/\[[A-G][^\]]*\]/.test(document.querySelector('textarea')?.value||''));
 assert.ok((await page.locator('.chord-preview .chord-name').count())>10);assert.ok((await page.locator('.lyrics-source').getAttribute('href')).includes('lacuerda.net/soda_stereo/de_musica_ligera'));
 await page.getByRole('button',{name:'+ Semitono',exact:true}).click();await page.getByRole('button',{name:'Guardar canción',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Biblioteca',exact:false}).click();await page.locator('.song-title').first().click();assert.ok((await page.locator('.lyrics-inner .chord-name').count())>10);
 const pwa=await page.evaluate(async()=>{const reg=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('PWA timeout')),12000))]);const keys=await caches.keys();return {active:!!reg.active,caches:keys.filter(k=>k.startsWith('repertorio-shell-')).length};});assert.ok(pwa.active&&pwa.caches);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({base,search:'LaCuerda: letras y acordes reales',saved:true,transposition:true,pwa,errors}));
}finally{await browser.close();}
