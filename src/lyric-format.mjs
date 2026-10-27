// Formatting is stored separately from the plain lyric: imported text is never HTML.
export function validFormats(formats, length) {
 return formats === undefined || Array.isArray(formats) && formats.length <= 10000 && formats.every((r,i) => r && Number.isInteger(r.start) && Number.isInteger(r.end) && r.start >= 0 && r.end > r.start && r.end <= length && (!i || formats[i-1].end <= r.start) && ['bold','italic','underline'].every(k => r[k] === undefined || typeof r[k] === 'boolean') && (r.color === undefined || /^#[0-9a-f]{6}$/i.test(r.color)));
}
export function formatAt(formats = [], position) { return formats.find(r => r.start <= position && r.end > position) || {}; }
function compact(runs) {
 const result=[];
 for(const r of runs){const style={};for(const k of ['bold','italic','underline','color'])if(r[k])style[k]=r[k];if(!Object.keys(style).length||r.end<=r.start)continue;const last=result.at(-1);if(last&&last.end===r.start&&JSON.stringify(last.style)===JSON.stringify(style))last.end=r.end;else result.push({start:r.start,end:r.end,style});}
 return result.map(({start,end,style})=>({start,end,...style}));
}
export function formatSelection(formats = [], start, end, patch) {
 if(end<=start)return formats;
 const points=[...new Set([start,end,...formats.flatMap(r=>[r.start,r.end])])].sort((a,b)=>a-b);
 return compact(points.slice(0,-1).map((at,i)=>({ ...formatAt(formats,at),start:at,end:points[i+1],...(at>=start&&at<end?patch:{}) })));
}
// Apply a single text edit, preserving styles on untouched characters.
export function remapFormats(formats = [], before, after) {
 if(before===after)return formats;
 let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
 let end=before.length, nextEnd=after.length;while(end>start&&nextEnd>start&&before[end-1]===after[nextEnd-1]){end--;nextEnd--;}
 const delta=nextEnd-end, inserted=nextEnd-start, runs=[];
 for(const r of formats){if(r.start<start)runs.push({...r,end:Math.min(r.end,start)});if(r.end>end)runs.push({...r,start:Math.max(r.start,end)+delta,end:r.end+delta});}
 const inherited=formatAt(formats,start>0?start-1:start);
 if(inserted)runs.push({...inherited,start,end:nextEnd});
 return compact(runs.sort((a,b)=>a.start-b.start));
}
export function replaceSongLyrics(song, lyrics) {return {...song,lyrics,lyricFormats:remapFormats(song.lyricFormats,song.lyrics,lyrics)};}
// Chord changes are independent edits so styles between chords stay anchored.
export function transformSongLyrics(song, transform) {
 let result=song;
 const tokens=[...song.lyrics.matchAll(/\[[^\]\n]+\]/g)];
 for(const token of tokens.reverse()){
  const value=transform(token[0]);if(value!==token[0])result=replaceSongLyrics(result,result.lyrics.slice(0,token.index)+value+result.lyrics.slice(token.index+token[0].length));
 }
 return replaceSongLyrics(result,transform(song.lyrics));
}
export function formatSegments(text, formats = [], offset = 0) {
 const end=offset+text.length, points=[offset,end];
 for(const r of formats)if(r.start<end&&r.end>offset)points.push(Math.max(offset,r.start),Math.min(end,r.end));
 const sorted=[...new Set(points)].sort((a,b)=>a-b);
 return sorted.slice(0,-1).map((start,i)=>({text:text.slice(start-offset,sorted[i+1]-offset),...formatAt(formats,start)}));
}
