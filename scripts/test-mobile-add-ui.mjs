import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=process.env.TEST_URL||'http://localhost:4173';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const results=[];
try {
 for(const scenario of [{name:'HTTP móvil sin randomUUID',url:'http://repertorio.test:4173',viewport:{width:390,height:844},proxy:true},{name:'localhost móvil',url:base,viewport:{width:360,height:800}}]) {
  const context=await browser.newContext({viewport:scenario.viewport,isMobile:true,hasTouch:true});
  if(scenario.proxy)await context.route('http://repertorio.test:4173/**',async route=>{
   const url=new URL(route.request().url());
   const response=await route.fetch({url:base+url.pathname+url.search});
   await route.fulfill({response});
  });
  await context.route('https://lrclib.net/api/search?**',route=>route.fulfill({json:[]}));
  const page=await context.newPage();page.setDefaultTimeout(7000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(scenario.url);
  const capabilities=await page.evaluate(()=>({secure:isSecureContext,randomUUID:typeof crypto.randomUUID}));
  if(scenario.proxy){assert.equal(capabilities.secure,false);assert.equal(capabilities.randomUUID,'undefined');}
  await page.getByRole('button',{name:/Nueva canción/}).tap();
  await page.getByRole('heading',{name:'Nueva canción',exact:true}).waitFor();
  await page.getByLabel('Título',{exact:true}).fill('Prueba desde celular');
  await page.getByLabel('Letra',{exact:true}).fill('Letra de prueba táctil');
  await page.getByRole('button',{name:'Guardar canción',exact:true}).tap();
  await page.getByRole('button',{name:'Opciones de Prueba desde celular',exact:true}).waitFor();
  await page.getByRole('button',{name:'Nueva canción',exact:true}).tap();
  await page.getByRole('heading',{name:'Nueva canción',exact:true}).waitFor();
  await page.getByLabel('Título',{exact:true}).fill('Segunda prueba desde celular');
  await page.getByLabel('Letra',{exact:true}).fill('Segunda letra de prueba');
  await page.getByRole('button',{name:'Guardar canción',exact:true}).tap();
  await page.getByRole('button',{name:'Opciones de Segunda prueba desde celular',exact:true}).waitFor();
  await page.reload();
  await page.getByRole('button',{name:/Biblioteca/}).tap();
  assert.equal(await page.getByRole('button',{name:'Opciones de Prueba desde celular',exact:true}).count(),1);
  assert.equal(await page.getByRole('button',{name:'Opciones de Segunda prueba desde celular',exact:true}).count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  results.push({scenario:scenario.name,capabilities,homeAdd:true,libraryAdd:true,persistentSongs:2,errors});
  await context.close();
 }
 await writeFile('docs/mobile-add-ui-results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
