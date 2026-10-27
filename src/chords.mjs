import { isChord } from './tonality.mjs';
import { normalizeName } from './lyrics.mjs';
export function decodeText(html){return html.replace(/<[^>]*>/g,'').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(all,key)=>{
 if(key[0]==='#'){const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):all;}
 return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',aacute:'á',eacute:'é',iacute:'í',oacute:'ó',uacute:'ú',ntilde:'ñ',uuml:'ü'})[key]??all;
});}
export function parseChordSearch(html,title,artist=''){
 const array=name=>{const raw=html.match(new RegExp('var\\s+'+name+'\\s*=\\s*\\[([^\\]]*)\\]'))?.[1]||'';return [...raw.matchAll(/'([a-z0-9_-]+)'/g)].map(m=>m[1]);};
 const artists=array('hds'),files=array('fns');const found=[];
 const open=html.match(/function lOpen[^\n]+/)?.[0]||'';
 const index=(name,n,length)=>new RegExp(name+'\\[NMAX\\s*-\\s*n\\]').test(open)?length-1-n:n;
 for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const artistName=decodeText(row[1].match(/<a\b[^>]*href=["']\/[a-z0-9_-]+\/["'][^>]*>([\s\S]*?)<\/a>/i)?.[1]||'').trim();
  for(const item of row[1].matchAll(/<li\b[^>]*\bid=['"]r(\d+)['"][^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/gi)){
   const n=Number(item[1]),a=index('hds',n,artists.length),f=index('fns',n,files.length),songTitle=decodeText(item[2]).trim();if(!artists[a]||!files[f]||!songTitle||!artistName)continue;
   if(artist.trim()&&!normalizeName(artistName).includes(normalizeName(artist)))continue;
   found.push({id:'lacuerda:'+artists[a]+'/'+files[f],title:songTitle,artist:artistName,album:'',sourceUrl:'https://acordes.lacuerda.net/'+artists[a]+'/'+files[f]+'.shtml'});
  }
 }
 return found.sort((a,b)=>Number(normalizeName(b.title)===normalizeName(title))-Number(normalizeName(a.title)===normalizeName(title))).slice(0,4);
}
export function parseChordPage(html){
 const pre=html.match(/<div\b[^>]*\bid\s*=\s*['"]?t_body['"]?[^>]*>\s*<pre\b[^>]*>([\s\S]*?)<\/pre>/i)?.[1];if(!pre)return null;
 const text=decodeText(pre.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi,(all,body)=>{const name=decodeText(body).trim();return isChord(name)?'['+name+']':body;}).replace(/<br\s*\/?>/gi,'\n')).replace(/\r/g,'').trim();
 if(!text||text.length>100000||!hasChords(text))return null;
 const lines=cleanTranscription(text).split('\n'),out=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i];const markers=[...line.matchAll(/\[([^\]]+)\]/g)].filter(m=>isChord(m[1]));
  // Align a line of chords with the following lyric, using the original text columns.
  const onlyChords=markers.length&&line.replace(/\[([^\]]+)\]/g,(m,c)=>isChord(c)?'':m).trim()==='';
  const next=lines[i+1];
  if(onlyChords&&next?.trim()&&!hasChords(next)&&!/^\s*(?:intro|coro|estribillo|verso|solo|puente)\b/i.test(next)){
   let offset=0;const positions=markers.map(m=>{const pos=m.index-offset;offset+=2;return {pos,chord:m[1]};});
   let merged=next;for(const {pos,chord} of positions.reverse()){const at=Math.min(pos,merged.length);merged=merged.slice(0,at)+'['+chord+']'+merged.slice(at);}out.push(merged);i++;
  }else out.push(line);
 }
 return out.join('\n');
}
export function hasChords(text){return /\[([^\]\n]+)\]/g.test(text)&&[...text.matchAll(/\[([^\]\n]+)\]/g)].some(m=>isChord(m[1]));}
export function withoutChords(text){return cleanTranscription(text).split('\n').map(line=>line.replace(/\[([^\]\n]+)\]/g,(all,c)=>isChord(c)?'':all).replace(/[ \t]+$/,'')).join('\n').replace(/\n{3,}/g,'\n\n').trim();}
/** Remove contributor appendices, keeping the musical transcription. */
export function cleanTranscription(text){
 const lines=text.replace(/\r/g,'').split('\n');const out=[];let inDiagrams=false;
 const isShape=line=>/^\s*(?:\[[A-G][^\]]*\]|[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*(?:\/[A-G](?:#|b)?)?)\s*(?:=|:|\s{2,})\s*(?:[xX0-9-]+[ \t]*){6}\s*$/.test(line);
 const appendix=line=>/^\s*[*=~_\-\s]*(?:acordes|posiciones(?: de acordes)?|digitaci[oó]n|diagrama(?:s)?(?: de acordes)?)[*=~_\-\s:]*$/i.test(line);
 const section=line=>/^\s*(?:intro(?:ducci[oó]n)?|coro|estribillo|verso|estrofa|puente|final|solo)\s*[:\d]*\s*$/i.test(line);
 const comment=line=>/^\s*(?:no (?:la )?transcrib[ií] yo|(?:bueno?|buen[ií]simo|gran|excelente) tema\b|(?:esta|esa) (?:es|fue) mi (?:primera )?(?:transcripci[oó]n|colaboraci[oó]n)|(?:cualquier )?(?:duda|consulta|correcci[oó]n|comentario|sugerencia)s?\s*(?:a|al|:)|(?:transcrito|transcripto|transcripci[oó]n|enviado|colaboraci[oó]n)\s*(?:por|de|:))/i.test(line);
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(appendix(line)&&lines.slice(i+1,i+10).some(isShape)){inDiagrams=true;continue;}
  if(isShape(line)){inDiagrams=true;continue;}
  if(inDiagrams){if(section(line)||hasChords(line)){inDiagrams=false;}else continue;}
  if(comment(line)&&out.some(l=>l.trim()))break;
  out.push(line);
 }
 return out.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
