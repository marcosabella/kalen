import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/chords/search?**',r=>r.fulfill({json:{results:[]}}));await page.route('https://lrclib.net/api/search?**',r=>r.fulfill({json:[]}));
 await page.goto(process.env.TEST_URL||'http://localhost:4173');await page.getByRole('button',{name:'Nueva canción',exact:false}).click();
 await page.getByLabel('Título',{exact:true}).fill('Formato en letras');const lyrics=page.getByLabel('Letra',{exact:true});await lyrics.fill('[C]Hola mundo\n\nOtra estrofa');
 assert.equal(await page.getByText('Editar texto y códigos de acordes',{exact:true}).count(),0);assert.equal(await lyrics.evaluate(el=>el.tagName),'TEXTAREA');
 const select=async(start,end)=>lyrics.evaluate((el,{start,end})=>{el.focus();el.setSelectionRange(start,end);el.dispatchEvent(new KeyboardEvent('keyup',{key:'Shift',bubbles:true}));},{start,end});
 await select(3,7);await page.getByRole('button',{name:'Negrita',exact:true}).click();await page.getByRole('button',{name:'Cursiva',exact:true}).click();await page.getByRole('button',{name:'Subrayado',exact:true}).click();
 await page.getByLabel('Color del texto',{exact:true}).fill('#ff0000');
 const styled=page.locator('.chord-preview span').filter({hasText:/^Hola$/}).last();await styled.waitFor();
 assert.deepEqual(await styled.evaluate(el=>({bold:getComputedStyle(el).fontWeight,italic:getComputedStyle(el).fontStyle,underline:getComputedStyle(el).textDecorationLine,color:getComputedStyle(el).color})),{bold:'700',italic:'italic',underline:'underline',color:'rgb(255, 0, 0)'});
 await page.getByRole('button',{name:'+ Semitono',exact:true}).click();assert.ok((await lyrics.inputValue()).startsWith('[C#]Hola'));
 // Style on a later stanza checks offsets through blank lines.
 await select(16,20);await lyrics.press('Control+b');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/screenshots/rich-lyrics-editor.png',fullPage:true});
 await page.getByRole('button',{name:'Guardar canción',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Biblioteca',exact:false}).click();await page.getByRole('button',{name:'Formato en letras Sin artista',exact:true}).click();
 const saved=page.locator('.lyrics-inner span').filter({hasText:/^Hola$/}).last();assert.equal(await saved.evaluate(el=>getComputedStyle(el).fontWeight),'700');assert.equal(await saved.evaluate(el=>getComputedStyle(el).color),'rgb(255, 0, 0)');
 assert.equal(await page.locator('[data-stanza="1"] span').filter({hasText:/^Otra$/}).last().evaluate(el=>getComputedStyle(el).fontWeight),'700');
 assert.deepEqual(errors,[]);console.log('OK: texto y códigos siempre visibles; negrita, cursiva, subrayado, color, atajos, transposición, vista previa, recarga, escenario y tamaños 320–1440.');
}finally{await browser.close();}
