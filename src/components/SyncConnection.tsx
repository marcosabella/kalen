import { useEffect, useState } from 'react';
import { connectionStorageKey, initialSyncConnection, notebookEndpoint } from '../sync-connection.mjs';
import { defaultSyncEndpoint } from '../sync-config.mjs';

export function useSyncConnection() {
 const [connection,setConnection]=useState(()=>{let saved:unknown=null;try{saved=JSON.parse(localStorage.getItem(connectionStorageKey)||'null');}catch{}return initialSyncConnection(location,import.meta.env.VITE_SYNC_URL||'',saved);});
 const [storageError,setStorageError]=useState(false);
 useEffect(()=>{try{localStorage.setItem(connectionStorageKey,JSON.stringify(connection));setStorageError(false);}catch{setStorageError(true);}},[connection]);
 let endpoint='';let error='';
 try {endpoint=connection.mode==='internet'?connection.internet:location.protocol==='http:'&&connection.notebook===location.origin?defaultSyncEndpoint(location):notebookEndpoint(connection.notebook);}catch{error='Revisá la dirección HTTPS que muestra la notebook.';}
 return {connection,setConnection,endpoint,error,storageError};
}

export default function SyncConnection({settings,onSwitch}:{settings:ReturnType<typeof useSyncConnection>;onSwitch:()=>void}) {
 const {connection,setConnection,error,storageError}=settings;
 const [configure,setConfigure]=useState(false);
 const notebook=connection.mode==='notebook';
 return <>
  <fieldset className="theme-setting"><legend>¿Cómo van a tocar?</legend><div className="theme-options">
   <button className="theme-choice" aria-pressed={!notebook} onClick={()=>{if(notebook){onSwitch();setConnection(c=>({...c,mode:'internet'}));}}}>Internet</button>
   <button className="theme-choice" aria-pressed={notebook} onClick={()=>{if(!notebook){onSwitch();setConnection(c=>({...c,mode:'notebook'}));}}}>Notebook</button>
  </div></fieldset>
  <p className="hint">{notebook?'Todos conectados al Wi-Fi de la notebook o del mismo router. Funciona sin Internet.':'Todos usan la conexión a Internet.'} Elijan la misma opción y el mismo código de grupo.</p>
  {notebook&&<p className="hint">Si Kalen pide permiso para acceder a la red local, elegí Permitir para conectar con la notebook.</p>}
  {notebook&&!connection.notebook&&<p role="status">Falta vincular esta tablet con la notebook. Pedile al director que la configure una vez.</p>}
  <button type="button" aria-expanded={configure} onClick={()=>setConfigure(v=>!v)}>{configure?'Cerrar configuración':'Configurar conexión'}</button>
  {configure&&<div className="connection-config">
   {notebook?<><label className="field">Dirección de la notebook<input value={connection.notebook} onChange={e=>{onSwitch();setConnection(c=>({...c,notebook:e.target.value}));}} placeholder="https://192.168.1.10:4174" autoCapitalize="none" autoCorrect="off" spellCheck={false}/></label><p className="hint">El director prepara el certificado una sola vez en esta tablet y copia la dirección que muestra INICIAR-KALEN-HTTPS. La aplicación recuerda la notebook.</p></>:<label className="field">Servidor de sincronización<input value={connection.internet} onChange={e=>{onSwitch();setConnection(c=>({...c,internet:e.target.value}));}} placeholder="wss://tu-servidor/sync" autoCapitalize="none" autoCorrect="off" spellCheck={false}/></label>}
   <p className="hint">{notebook?'Si cambian de router y cambia la dirección de la notebook, el director debe actualizarla.':'La dirección de Internet viene preparada con la aplicación.'}</p>
  </div>}
  {error&&<p role="status">{error}</p>}{storageError&&<p role="status">Este navegador no permite recordar la conexión. Mantené abierta la aplicación.</p>}
 </>;
}
