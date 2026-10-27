import ChordLyrics from './ChordLyrics';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Song } from '../data';
import { stanzaList } from '../domain.mjs';
import { useAutoScroll } from '../hooks';
export default function LyricsReader({song,fontSize,lineHeight,running,speed,pause,remoteStanza,remoteFraction=0,onStanza}:{song:Song;fontSize:number;lineHeight:number;running:boolean;speed:number;pause:()=>void;remoteStanza:number|null;remoteFraction?:number;onStanza:(n:number,fraction:number)=>void}){
 const reader=useRef<HTMLDivElement>(null);const anchor=useRef({index:0,fraction:0});const parts: string[]=stanzaList(song.lyrics);
 const restore=()=>{const el=reader.current;const p=el?.querySelector<HTMLElement>('[data-stanza="'+anchor.current.index+'"]');if(el&&p){const next=p.nextElementSibling as HTMLElement|null;el.scrollTop=p.offsetTop+anchor.current.fraction*Math.max(1,(next?.offsetTop??p.offsetTop+p.offsetHeight)-p.offsetTop);}};
 useLayoutEffect(()=>{anchor.current={index:0,fraction:0};if(reader.current)reader.current.scrollTop=0;},[song.id,song.lyrics]);
 useLayoutEffect(restore,[fontSize,lineHeight]);
 useEffect(()=>{const el=reader.current;if(!el)return;let w=el.clientWidth;let h=el.clientHeight;const resize=new ResizeObserver(()=>{if(w!==el.clientWidth||h!==el.clientHeight){w=el.clientWidth;h=el.clientHeight;restore();}});resize.observe(el);return()=>resize.disconnect();},[]);
 useEffect(()=>{if(remoteStanza===null)return;anchor.current={index:remoteStanza,fraction:remoteFraction};restore();},[remoteStanza,remoteFraction,song.id,song.lyrics,fontSize,lineHeight]);
 useAutoScroll(reader,running,speed,pause);
 return <div ref={reader} className="lyrics-reader" tabIndex={0} role="region" aria-label="Letra de la canción. Desplazar para leer" style={{fontSize:fontSize+'px',lineHeight} as CSSProperties} onPointerDown={pause} onWheel={pause} onKeyDown={e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))pause();}} onScroll={()=>{const el=reader.current;if(!el)return;const all=Array.from(el.querySelectorAll<HTMLElement>('[data-stanza]'));let index=0;for(let i=0;i<all.length;i++){if(all[i].offsetTop<=el.scrollTop+2)index=i;}const p=all[index];if(p){const next=p.nextElementSibling as HTMLElement|null;const fraction=Math.min(1,Math.max(0,(el.scrollTop-p.offsetTop)/Math.max(1,(next?.offsetTop??p.offsetTop+p.offsetHeight)-p.offsetTop)));anchor.current={index,fraction};onStanza(index,fraction);}}}>
 <div className="lyrics-inner">{parts.length?parts.map((part,i)=><p key={i} data-stanza={i} className={part.startsWith('ESTRIBILLO')?'chorus':''}><ChordLyrics lyrics={part}/></p>):<p>Esta canción todavía no tiene letra.</p>}<div className="lyrics-end">Fin de la canción</div></div></div>;
}

