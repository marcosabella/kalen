import { parseChordSearch, parseChordPage } from './src/chords.mjs';
const cache=new Map();let active=0;
async function readPage(url){const response=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'error',headers:{'User-Agent':'RepertorioEnVivo/0.1 (song lookup)'}});if(!response.ok)throw Error('Fuente de acordes no disponible');const text=await response.text();if(text.length>2000000)throw Error('Respuesta demasiado grande');return text;}
export async function handleChordRequest(req,res){
 const url=new URL(req.url,'http://localhost');if(url.pathname!=='/api/chords/search')return false;
 const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(req.method!=='GET'){send(405,{error:'Método no permitido'});return true;}
 const title=(url.searchParams.get('title')||'').trim(),artist=(url.searchParams.get('artist')||'').trim();
 if(title.length<3||title.length>200||artist.length>200){send(400,{error:'Título o artista inválido'});return true;}
 const key=title.toLocaleLowerCase()+'|'+artist.toLocaleLowerCase(),cached=cache.get(key);if(cached&&Date.now()-cached.time<300000){send(200,cached.data);return true;}
 if(active>=4){send(429,{error:'Búsqueda ocupada. Intentá nuevamente.'});return true;}active++;
 try{
  const search=new URL('https://acordes.lacuerda.net/busca.php');search.searchParams.set('exp',title);search.searchParams.set('canc','1');
  const matches=parseChordSearch(await readPage(search),title,artist);
  const loaded=await Promise.allSettled(matches.map(async match=>{const lyrics=parseChordPage(await readPage(match.sourceUrl));return lyrics?{...match,lyrics}:null;}));
  const results=loaded.flatMap(r=>r.status==='fulfilled'&&r.value?[r.value]:[]);
  if(matches.length&&!results.length&&loaded.some(r=>r.status==='rejected'))throw Error('Fuente de acordes no disponible');
  const data={results};cache.set(key,{time:Date.now(),data});if(cache.size>100)cache.delete(cache.keys().next().value);send(200,data);
 }catch(error){console.warn("Chord lookup:",error.message,error.cause?.code||error.cause?.message||'');send(502,{error:'No se pudo consultar la fuente de acordes.'});}finally{active--;}
 return true;
}
