import { useEffect, useState } from 'react';
import { connectionStorageKey, defaultInternetEndpoint, initialSyncConnection, notebookEndpoint } from '../sync-connection.mjs';
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
   <button className="theme-choice" aria-pressed={!notebook} onClick={()=>{if(notebook||!connection.internet.trim()){onSwitch();setConnection(c=>({...c,mode:'internet',internet:c.internet.trim()||import.meta.env.VITE_SYNC_URL||defaultInternetEndpoint}));}}}>Internet</button>
   <button className="theme-choice" aria-pressed={notebook} onClick={()=>{if(!notebook){onSwitch();setConnection(c=>({...c,mode:'notebook'}));}}}>Notebook</button>
  </div></fieldset>
  {notebook&&!connection.notebook&&<p role="status">Falta vincular esta tablet con la notebook. Pedile al director que la configure una vez.</p>}
  <button type="button" aria-expanded={configure} onClick={()=>setConfigure(v=>!v)}>{configure?'Cerrar configuración':'Configurar conexión'}</button>
  {configure&&<div className="connection-config">
   {notebook?<label className="field">Dirección de la notebook<input value={connection.notebook} onChange={e=>{onSwitch();setConnection(c=>({...c,notebook:e.target.value}));}} placeholder="https://192.168.1.10:4174" autoCapitalize="none" autoCorrect="off" spellCheck={false}/></label>:<label className="field">Servidor de sincronización<input value={connection.internet} onChange={e=>{onSwitch();setConnection(c=>({...c,internet:e.target.value}));}} placeholder="wss://tu-servidor/sync" autoCapitalize="none" autoCorrect="off" spellCheck={false}/></label>}
  </div>}
  {error&&<p role="status">{error}</p>}{storageError&&<p role="status">Este navegador no permite recordar la conexión. Mantené abierta la aplicación.</p>}
 </>;
}
