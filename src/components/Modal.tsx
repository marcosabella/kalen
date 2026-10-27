import { useEffect, useRef } from 'react';
import Glyph from './Glyph';
export default function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);return <dialog ref={ref} onCancel={onClose} aria-label={title}><div className="modal-head"><h2>{title}</h2><button aria-label="Cerrar" onClick={onClose}><Glyph name="close"/></button></div><div className="modal-content">{children}</div></dialog>;}

