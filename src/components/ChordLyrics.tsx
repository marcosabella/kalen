import { Fragment } from 'react';
import { isChord } from '../tonality.mjs';
import type { LyricFormat } from '../data';
import FormattedText from './FormattedText';
export default function ChordLyrics({lyrics,formats,offset=0}:{lyrics:string;formats?:LyricFormat[];offset?:number}){
 let position=offset;
 return <>{lyrics.split('\n').map((line,i)=>{const lineStart=position;position+=line.length+1;let wordPosition=lineStart;return <span className="chord-line" key={i}>{line?line.split(/(\s+)/).map((word,j)=>{
 const start=wordPosition;wordPosition+=word.length;
 if(/^\s+$/.test(word))return <Fragment key={j}>{word}</Fragment>;
 const parts=word.split(/(\[[^\]]+\])/);let partPosition=start;return <span className="lyric-word" key={j}>{parts.map((part,k)=>{
  const at=partPosition;partPosition+=part.length;
  if(/^\[[^\]]+\]$/.test(part)&&isChord(part.slice(1,-1)))return <span className="chord-unit" key={k}><span className="chord-name"><FormattedText text={part.slice(1,-1)} formats={formats} offset={at+1}/></span><span><FormattedText text={parts[k+1]||'\u00a0'} formats={formats} offset={at+part.length}/></span></span>;
  if(k>0&&/^\[[^\]]+\]$/.test(parts[k-1])&&isChord(parts[k-1].slice(1,-1)))return null;
  return <FormattedText key={k} text={part} formats={formats} offset={at}/>;
 })}</span>;
 }):'\u00a0'}</span>;})}</>;
}
