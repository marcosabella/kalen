import { searchLyrics } from './lyrics.mjs';
export async function searchSongs(title,artist='',signal){
 let unavailable=false;
 try{
  const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();const timer=setTimeout(abort,18000);
  try{const url=new URL('/api/chords/search',location.origin);url.searchParams.set('title',title);url.searchParams.set('artist',artist);const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data.results))throw Error();if(data.results.length)return {results:data.results,unavailable:false};}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }catch{if(signal?.aborted)throw new DOMException('Cancelado','AbortError');unavailable=true;}
 return {results:await searchLyrics(title,artist,signal),unavailable};
}
