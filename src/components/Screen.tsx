import { useEffect } from 'react';
import Glyph from './Glyph';
export default function Screen({title,children,onBack,backLabel='Volver al inicio'}:{title:string;children:React.ReactNode;onBack:()=>void;backLabel?:string}){
 useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))onBack();};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[onBack]);
 return <main className="screen-page"><header className="screen-header"><button className="screen-back" onClick={onBack}><Glyph name="back"/><span>{backLabel}</span></button><h1>{title}</h1></header><div className="screen-content">{children}</div></main>;
}
