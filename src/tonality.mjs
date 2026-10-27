const sharps=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const flats=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const notes={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
export const tonalities=Object.keys(notes).flatMap(n=>[n,n+'m']);
export function validTonality(value){return typeof value==='string'&&tonalities.includes(value);}
export function tonalityLabel(value){const names={C:'Do',D:'Re',E:'Mi',F:'Fa',G:'Sol',A:'La',B:'Si'};return validTonality(value)?names[value[0]]+value.slice(1).replace(/m$/,' menor')+' ('+value+')':value;}
const chordPattern=/^([A-G](?:#|b)?)(?:(?:maj|min|dim|aug|sus|add|m)?\d{0,2})(?:(?:sus|add)\d{1,2})?(?:[#b]\d{1,2})*(?:\([\d,#b+\-]+\))?[+°ø-]?(?:\/([A-G](?:#|b)?))?$/;
function chord(value,steps,preferFlats){const match=chordPattern.exec(value);if(!match)return value;const scale=preferFlats?flats:sharps;const shift=n=>scale[(notes[n]+steps+12)%12];const root=match[1],bass=match[2];return shift(root)+value.slice(root.length,bass?-(bass.length+1):undefined)+(bass?'/'+shift(bass):'');}
export function transposeLyrics(lyrics,from,to){
 if(!validTonality(from)||!validTonality(to))return lyrics;
 const steps=(notes[to.replace(/m$/,'')]-notes[from.replace(/m$/,'')]+12)%12;
 if(!steps)return lyrics;
 const preferFlats=to.includes('b')||['F','Fm','Cm','Gm','Dm'].includes(to);
 return lyrics.split('\n').map(line=>{
  if(line.includes('['))return line.replace(/\[([^\]\n]+)\]/g,(all,value)=>'['+chord(value,steps,preferFlats)+']');
  const tokens=line.trim().split(/\s+/).filter(Boolean);
  const musical=tokens.filter(t=>!/^[:|]+$/.test(t));
  if(!musical.length||!musical.every(t=>chordPattern.test(t)))return line;
  return line.replace(/\S+/g,t=>chord(t,steps,preferFlats));
 }).join('\n');
}
export function isChord(value){return typeof value==='string'&&chordPattern.test(value);}
export function shiftLyrics(lyrics,semitones){return transposeLyrics(lyrics,'C',sharps[((semitones%12)+12)%12]);}
export function shiftTonality(value,semitones){if(!validTonality(value))return undefined;return sharps[(notes[value.replace(/m$/,'')]+semitones+120)%12]+(value.endsWith('m')?'m':'');}
