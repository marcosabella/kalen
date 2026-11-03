import { validateSyncEndpoint } from './sync-config.mjs';

export const connectionStorageKey='kalen-sync-connection-v1';
export const defaultInternetEndpoint='wss://kalen-1a98.onrender.com/sync';

export function notebookEndpoint(address) {
 const text=address.trim();
 if(!text)return '';
 const url=new URL(/^[a-z]+:\/\//i.test(text)?text:'https://'+text);
 if(!['https:','wss:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!['','/','/sync'].includes(url.pathname))throw Error('Usá la dirección HTTPS que muestra la notebook.');
 url.protocol='wss:';
 if(!url.port)url.port='4174';
 url.pathname='/sync';
 return validateSyncEndpoint(url.href).href;
}

/**
 * @param {URL | Location} page
 * @param {string} configured
 * @param {unknown} saved
 * @returns {{mode:'internet'|'notebook',internet:string,notebook:string}}
 */
export function initialSyncConnection(page,configured='',saved=null) {
 const remote=page.hostname.endsWith('.netlify.app');
 const initial={mode:remote?'internet':'notebook',internet:configured.trim()||defaultInternetEndpoint,notebook:remote?'':page.origin};
 if(saved&&typeof saved==='object') {
  if('mode' in saved&&['internet','notebook'].includes(String(saved.mode)))initial.mode=String(saved.mode);
  if('internet' in saved&&typeof saved.internet==='string') {try{initial.internet=validateSyncEndpoint(saved.internet,page.protocol).href;}catch{}}
  if('notebook' in saved&&typeof saved.notebook==='string') {try{notebookEndpoint(saved.notebook);initial.notebook=saved.notebook;}catch{}}
 }
 return /** @type {{mode:'internet'|'notebook',internet:string,notebook:string}} */ (initial);
}
