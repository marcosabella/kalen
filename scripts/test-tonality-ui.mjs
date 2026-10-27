import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/chords/search?**',route=>route.fulfill({json:{results:[]}}));
 await page.route('https://lrclib.net/api/search?**',route=>route.fulfill({json:[]}));
 await page.goto(process.env.TEST_URL||'http://localhost:4173');
 await page.getByRole('button',{name:'Nueva canción',exact:false}).click();
 await page.getByLabel('Título',{exact:true}).fill('Acordes en letra');
 await page.locator('.manual-chords summary').click();
 const lyrics=page.getByLabel('Letra',{exact:true});await lyrics.fill('Vuelve a cantar\n\n[Intro]\nSin acordes aquí');
 await lyrics.evaluate(el=>{el.focus();el.setSelectionRange(0,6);el.dispatchEvent(new Event('select',{bubbles:true}));});
 await page.getByLabel('Nota del acorde',{exact:true}).selectOption('A');
 await page.getByLabel('Tipo de acorde',{exact:true}).selectOption('m');
 await page.getByRole('button',{name:'Insertar acorde [Am]',exact:true}).click();
 assert.equal(await lyrics.inputValue(),'[Am]Vuelve a cantar\n\n[Intro]\nSin acordes aquí');
 await lyrics.evaluate(el=>{el.focus();const n=el.value.indexOf('cantar');el.setSelectionRange(n,n);el.dispatchEvent(new Event('select',{bubbles:true}));});
 await page.getByLabel('Nota del acorde',{exact:true}).selectOption('C');
 await page.getByLabel('Tipo de acorde',{exact:true}).selectOption('');
 await page.getByLabel('Bajo del acorde',{exact:true}).selectOption('G');
 await page.getByRole('button',{name:'Insertar acorde [C/G]',exact:true}).click();
 assert.equal(await lyrics.inputValue(),'[Am]Vuelve a [C/G]cantar\n\n[Intro]\nSin acordes aquí');
 await page.getByRole('button',{name:'+ Semitono',exact:true}).click();
 assert.equal(await lyrics.inputValue(),'[A#m]Vuelve a [C#/G#]cantar\n\n[Intro]\nSin acordes aquí');
 await page.getByRole('button',{name:'− Semitono',exact:true}).click();
 assert.equal(await lyrics.inputValue(),'[Am]Vuelve a [C/G]cantar\n\n[Intro]\nSin acordes aquí');
 assert.equal(await page.locator('.chord-preview .chord-name').allTextContents().then(v=>v.join('|')),'Am|C/G');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/screenshots/chord-editor.png',fullPage:true});
 await page.getByRole('button',{name:'Guardar canción',exact:true}).click();await page.reload();
 await page.getByRole('button',{name:'Biblioteca',exact:false}).click();await page.getByRole('button',{name:'Acordes en letra Sin artista',exact:true}).click();
 assert.deepEqual(await page.locator('.lyrics-inner .chord-name').allTextContents(),['Am','C/G']);
 assert.equal(await page.locator('.lyrics-inner .chord-unit').first().innerText(),'Am\nVuelve');
 await page.getByText('[Intro]',{exact:true}).waitFor();
 await page.screenshot({path:'docs/screenshots/chords-stage.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('OK: inserción en selección sin perder letra, bajos, transposición sin tonalidad, vista previa, recarga, escenario y tamaños 320–1440.');
}finally{await browser.close();}
