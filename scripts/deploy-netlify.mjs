import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';import {createHash} from 'node:crypto';
const siteId='3ee36e33-04bf-4ba8-bcc0-267c168c63c2';
const config=JSON.parse(await readFile(path.join(process.env.APPDATA,'netlify','Config','config.json'),'utf8'));
const token=config.users[config.userId]?.auth?.token;if(!token)throw Error('Falta una sesión de Netlify.');
async function api(route,options={}){const response=await fetch('https://api.netlify.com/api/v1'+route,{...options,headers:{Authorization:'Bearer '+token,...options.headers},signal:AbortSignal.timeout(45000)});const text=await response.text();if(!response.ok)throw Error('Netlify '+response.status+': '+text.slice(0,350));return text?JSON.parse(text):{};}
const site=await api('/sites/'+siteId);if(site.name!=='kalenfolklore')throw Error('El sitio de destino no coincide.');
const files={},byHash=new Map();
async function walk(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const local=path.join(dir,entry.name),remote=prefix+'/'+entry.name;if(entry.isDirectory())await walk(local,remote);else {const bytes=await readFile(local),hash=createHash('sha1').update(bytes).digest('hex');files[remote]=hash;byHash.set(hash,{remote,bytes});}}}
await walk('dist');const fn=await readFile('.netlify/functions-build/chords.zip');const sha=createHash('sha256').update(fn).digest('hex');
const deploy=await api('/sites/'+siteId+'/deploys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:true,files,functions:{chords:sha},title:'Letras con acordes automáticos y limpieza de transcripciones'})});
await mkdir('.netlify',{recursive:true});await writeFile('.netlify/state.json',JSON.stringify({siteId},null,2));await writeFile('.netlify/last-deploy.json',JSON.stringify({id:deploy.id,siteId,url:deploy.deploy_ssl_url||deploy.deploy_url},null,2));
console.log(JSON.stringify({deployId:deploy.id,state:deploy.state,files:deploy.required?.length,functions:deploy.required_functions?.length,url:deploy.deploy_ssl_url||deploy.deploy_url}));
const uploads=(deploy.required||[]).map(hash=>async()=>{const file=byHash.get(hash);if(!file)throw Error('Falta archivo '+hash);await api('/deploys/'+deploy.id+'/files'+file.remote.split('/').map(encodeURIComponent).join('/'),{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:file.bytes});});
for(let i=0;i<uploads.length;i+=4)await Promise.all(uploads.slice(i,i+4).map(f=>f()));
if(deploy.required_functions?.includes(sha))await api('/deploys/'+deploy.id+'/functions/chords?runtime=js',{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:fn});
const status=await api('/deploys/'+deploy.id);console.log(JSON.stringify({deployId:status.id,state:status.state,url:status.deploy_ssl_url||status.deploy_url,error:status.error_message}));
