import { validateSyncEndpoint } from './sync-config.mjs';
import { useEffect, useRef, useState } from 'react';
import { defaults, normalizePreferences, validCue } from './domain.mjs';
import type { Song } from './data';
export type Preferences = typeof defaults;
export function useVisualPreferences() {
 const [storageError,setStorageError]=useState(false);
 const [prefs,setPrefs]=useState<Preferences>(()=>{const initial={...defaults,fontSize:window.matchMedia('(min-width: 1200px)').matches?28:window.matchMedia('(min-width: 600px)').matches?32:26};try{return normalizePreferences(JSON.parse(localStorage.getItem('stage-visual-v1')||'{}'),initial);}catch{return initial;}});
 useEffect(()=>{try{localStorage.setItem('stage-visual-v1',JSON.stringify(prefs));setStorageError(false);}catch{setStorageError(true);}},[prefs]);
 useEffect(()=>{document.documentElement.dataset.theme=prefs.theme;document.documentElement.style.colorScheme=prefs.theme;const meta=document.querySelector('meta[name="theme-color"]');meta?.setAttribute('content',prefs.theme==='light'?'#f5f7f5':'#101314');},[prefs.theme]);
 return {prefs,setPrefs,storageError};
}
export function useWakeLock(enabled: boolean) {
 const [status,setStatus]=useState('Desactivada');
 useEffect(()=>{let alive=true;let lock: WakeLockSentinel | undefined;let pending=false;
 async function acquire(){if(!alive||document.visibilityState!=='visible'||pending||lock&&!lock.released)return;if(!('wakeLock' in navigator)){setStatus('No disponible');return;}pending=true;try{const next=await navigator.wakeLock.request('screen');if(!alive){await next.release();return;}lock=next;setStatus('Activa');lock.addEventListener('release',()=>{if(alive)setStatus('Liberada por el sistema');});}catch{if(alive)setStatus('No disponible');}finally{pending=false;}}
 if(enabled){void acquire();document.addEventListener('visibilitychange',acquire);}else setStatus('Desactivada');
 return ()=>{alive=false;document.removeEventListener('visibilitychange',acquire);void lock?.release();};},[enabled]);return status;
}
export function useAutoScroll(ref: React.RefObject<HTMLDivElement | null>,running:boolean,speed:number,onEnd:()=>void){
 const end=useRef(onEnd);end.current=onEnd;
 useEffect(()=>{if(!running)return;let frame=0;let last=0;let position=ref.current?.scrollTop||0;
 const step=(time:number)=>{const el=ref.current;if(!el)return;if(last&&document.visibilityState==='visible'){position+=Math.min(time-last,100)*speed/1000;el.scrollTop=position;if(el.scrollTop>=el.scrollHeight-el.clientHeight-1){end.current();return;}}last=time;frame=requestAnimationFrame(step);};frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame);},[ref,running,speed]);
}
export type Cue = {song:Song;stanza:number;fraction?:number};
export function useSync(onCue:(cue:Cue)=>void){
 const callback=useRef(onCue);callback.current=onCue;const socket=useRef<WebSocket|null>(null);
 const [state,setState]=useState<{status:string;role:'leader'|'follower'|null;room:string;peers:number}>({status:'Desconectado',role:null,room:'',peers:0});
 function disconnect(){socket.current?.close();socket.current=null;setState({status:'Desconectado',role:null,room:'',peers:0});}
 function connect(room:string,endpoint:string){disconnect();try{const url=validateSyncEndpoint(endpoint,location.protocol);url.searchParams.set('room',room);const ws=new WebSocket(url);socket.current=ws;setState({status:'Conectando…',role:null,room,peers:0});ws.onmessage=e=>{if(socket.current!==ws)return;try{const m=JSON.parse(e.data);if(m.type==='status')setState({status:m.leader?'Conectado':'Esperando director',role:m.role,room,peers:m.peers});if(m.type==='cue'&&validCue(m.cue))callback.current(m.cue);}catch{}};ws.onclose=()=>{if(socket.current===ws){socket.current=null;setState(s=>({...s,status:'Sin conexión · lectura local',role:null}));}};ws.onerror=()=>{if(socket.current===ws)setState(s=>({...s,status:'Servidor no disponible',role:null}));};}catch(error){setState({status:error instanceof Error?error.message:'Dirección de servidor inválida',role:null,room:'',peers:0});}}
 function publish(cue:Cue){if(state.role==='leader'&&socket.current?.readyState===WebSocket.OPEN)socket.current.send(JSON.stringify({type:'cue',cue}));}
 useEffect(()=>()=>{socket.current?.close();},[]);return {...state,connect,disconnect,publish};
}
