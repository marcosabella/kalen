import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { X509Certificate } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export function localAddresses() {
 return [...new Set(Object.values(networkInterfaces()).flat().filter(a=>a?.family==='IPv4'&&!a.internal&&!a.address.startsWith('169.254.')).map(a=>a.address))];
}

export async function prepareLocalCertificate(root) {
 const folder=path.join(root,'.local-https');
 const caFolder=path.join(folder,'ca');
 const addresses=localAddresses();
 const names=['localhost','127.0.0.1','::1',...addresses];
 await mkdir(caFolder,{recursive:true});
 let permanent=false;
 try {await access(path.join(folder,'permanent.json'));permanent=true;}catch(error){if(error.code!=='ENOENT')throw error;}
 if(permanent) {
  const {preparePermanentCertificate}=await import('./permanent-local-certificate.mjs');
  await preparePermanentCertificate(folder,names);
 }
 let renew=true;
 try {
  const cert=new X509Certificate(await readFile(path.join(folder,'server.pem')));
  renew=Date.parse(cert.validTo)<Date.now()+30*86400000||!cert.checkHost('localhost')||names.slice(1).some(ip=>!cert.checkIP(ip));
  await access(path.join(folder,'server-key.pem'));
  await access(path.join(caFolder,'rootCA-key.pem'));
 } catch {renew=true;}
 if(renew) {
  if(process.platform!=='win32'||process.arch!=='x64')throw Error('Este iniciador requiere Windows de 64 bits.');
  const tool=path.join(folder,'tools','mkcert.exe');
  await access(tool);
  console.log('Preparando HTTPS para las direcciones de esta notebook...');
  const result=spawnSync(tool,['-cert-file',path.join(folder,'server.pem'),'-key-file',path.join(folder,'server-key.pem'),...names],{
   env:{...process.env,CAROOT:caFolder},stdio:'inherit',windowsHide:true
  });
  if(result.error)throw result.error;
  if(result.status!==0)throw Error('No se pudo preparar el certificado local.');
 }
 const ca=await readFile(path.join(caFolder,'rootCA.pem'));
 const fingerprint=new X509Certificate(ca).fingerprint256;
 const serverCertificate=new X509Certificate(await readFile(path.join(folder,'server.pem')));
 const expires=serverCertificate.validTo;
 const trustExpires=new X509Certificate(ca).validTo;
 await writeFile(path.join(folder,'Kalen-CA.crt'),ca);
 await writeFile(path.join(folder,'info.json'),JSON.stringify({names,fingerprint,expires,trustExpires,permanent},null,2));
 return {folder,addresses,certificate:ca,fingerprint,expires,trustExpires,permanent};
}
