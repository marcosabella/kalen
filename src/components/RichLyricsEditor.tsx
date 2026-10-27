import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { LyricFormat } from '../data';
import { formatAt, formatSelection } from '../lyric-format.mjs';

export type LyricEditorHandle={selectionStart:number;selectionEnd:number;focus:()=>void;setSelectionRange:(start:number,end:number)=>void};
type Props={lyrics:string;formats?:LyricFormat[];onChange:(text:string)=>void;onFormat:(formats:LyricFormat[])=>void};
const RichLyricsEditor=forwardRef<LyricEditorHandle,Props>(function RichLyricsEditor({lyrics,formats=[],onChange,onFormat},ref){
 const textarea=useRef<HTMLTextAreaElement>(null);
 const [selected,setSelected]=useState({start:0,end:0});
 const range=useRef({start:0,end:0}),restore=useRef(false);
 function select(start:number,end:number){range.current={start,end};setSelected({start,end});textarea.current?.setSelectionRange(start,end);}
 function remember(){const el=textarea.current;if(el){range.current={start:el.selectionStart,end:el.selectionEnd};setSelected({...range.current});}}
 useImperativeHandle(ref,()=>({get selectionStart(){return textarea.current?.selectionStart??range.current.start;},get selectionEnd(){return textarea.current?.selectionEnd??range.current.end;},focus(){textarea.current?.focus();},setSelectionRange:select}));
 useLayoutEffect(()=>{if(restore.current){restore.current=false;textarea.current?.focus();select(range.current.start,range.current.end);}},[formats]);
 function apply(patch:Partial<LyricFormat>){const {start,end}=range.current;if(start===end)return;restore.current=true;onFormat(formatSelection(formats,start,end,patch));textarea.current?.focus();}
 const active=formatAt(formats,selected.start),hasSelection=selected.end>selected.start;
 function toggle(key:'bold'|'italic'|'underline'){const {start,end}=range.current;const covered=formats.filter(r=>r.end>start&&r.start<end);let at=start;const all=covered.every(r=>{const continuous=r.start<=at&&r[key];at=Math.max(at,r.end);return continuous;})&&at>=end;apply({[key]:!all});}
 return <section className="rich-lyrics" aria-label="Editor de letras"><div className="format-toolbar" role="toolbar" aria-label="Formato de la letra">
  <button type="button" aria-label="Negrita" aria-pressed={!!active.bold&&hasSelection} disabled={!hasSelection} onMouseDown={e=>e.preventDefault()} onClick={()=>toggle('bold')}><b>N</b></button>
  <button type="button" aria-label="Cursiva" aria-pressed={!!active.italic&&hasSelection} disabled={!hasSelection} onMouseDown={e=>e.preventDefault()} onClick={()=>toggle('italic')}><i>C</i></button>
  <button type="button" aria-label="Subrayado" aria-pressed={!!active.underline&&hasSelection} disabled={!hasSelection} onMouseDown={e=>e.preventDefault()} onClick={()=>toggle('underline')}><u>S</u></button>
  <label className="format-color">Color<input type="color" aria-label="Color del texto" value={active.color||'#e9b949'} disabled={!hasSelection} onChange={e=>apply({color:e.target.value})}/></label>
  <button type="button" disabled={!hasSelection} onMouseDown={e=>e.preventDefault()} onClick={()=>apply({bold:false,italic:false,underline:false,color:undefined})}>Quitar formato</button>
 </div><p className="hint" id="format-help">Seleccioná palabras para cambiar su formato y verlo en la vista previa. Atajos: Ctrl/Cmd+B, I y U.</p>
 <label className="field" htmlFor="song-lyrics">Letra
 <textarea ref={textarea} id="song-lyrics" aria-label="Letra" aria-describedby="format-help" rows={10} maxLength={100000} value={lyrics} onSelect={remember} onPointerUp={remember} onKeyUp={remember} onBlur={remember} onChange={e=>{range.current={start:e.target.selectionStart,end:e.target.selectionEnd};onChange(e.target.value);}} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&["b","i","u"].includes(e.key.toLowerCase())){e.preventDefault();remember();toggle(({b:"bold",i:"italic",u:"underline"} as const)[e.key.toLowerCase() as "b"|"i"|"u"]);}}}/></label>
 </section>;
});
export default RichLyricsEditor;
