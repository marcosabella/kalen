import { Fragment } from 'react';
import { isChord } from '../tonality.mjs';
export default function ChordLyrics({lyrics}:{lyrics:string}){
 return <>{lyrics.split('\n').map((line,i)=><span className="chord-line" key={i}>{line?line.split(/(\s+)/).map((word,j)=>{
 if(/^\s+$/.test(word))return <Fragment key={j}>{word}</Fragment>;
 const parts=word.split(/(\[[^\]]+\])/);return <span className="lyric-word" key={j}>{parts.map((part,k)=>{
  if(/^\[[^\]]+\]$/.test(part)&&isChord(part.slice(1,-1)))return <span className="chord-unit" key={k}><span className="chord-name">{part.slice(1,-1)}</span><span>{parts[k+1]||'\u00a0'}</span></span>;
  if(k>0&&/^\[[^\]]+\]$/.test(parts[k-1])&&isChord(parts[k-1].slice(1,-1)))return null;
  return <Fragment key={k}>{part}</Fragment>;
 })}</span>;
 }):'\u00a0'}</span>)}</>;
}
