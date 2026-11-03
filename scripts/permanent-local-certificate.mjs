import { createPrivateKey, generateKeyPairSync, randomBytes, X509Certificate } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import path from 'node:path';
import forge from 'node-forge';

// RFC 5280, 4.1.2.5: no well-defined expiration date.
export const permanentExpiry='9999-12-31T23:59:59Z';

function keys() {
 return generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
}
function certificate(publicKey,expiry=permanentExpiry) {
 const cert=forge.pki.createCertificate();
 cert.publicKey=forge.pki.publicKeyFromPem(publicKey);
 // Positive, nonzero, unpredictable serial, within X.509's 20-octet limit.
 cert.serialNumber='01'+randomBytes(19).toString('hex');
 cert.validity.notBefore=new Date(Date.now()-5*60000);
 cert.validity.notAfter=new Date(expiry);
 return cert;
}

export async function preparePermanentCertificate(folder,names) {
 const caFolder=path.join(folder,'ca');
 await mkdir(caFolder,{recursive:true});
 let caPem,caKey;
 try {
  caPem=await readFile(path.join(caFolder,'rootCA.pem'),'utf8');
 } catch(error) {
  if(error.code!=='ENOENT')throw error;
 }
 if(caPem) {
  // Never replace an existing trusted authority silently.
  if(new X509Certificate(caPem).validTo!=='Dec 31 23:59:59 9999 GMT')throw Error('Esta carpeta contiene un certificado anterior. Descomprimi el paquete permanente en una carpeta NUEVA.');
  caKey=await readFile(path.join(caFolder,'rootCA-key.pem'),'utf8');
 } else {
  // An interrupted/partial setup must not overwrite an existing private key.
  try {await readFile(path.join(caFolder,'rootCA-key.pem'));throw Error('Hay una clave previa sin certificado. Usa una carpeta nueva del paquete.');}catch(error){if(error.code!=='ENOENT')throw error;}
  const pair=keys();caKey=pair.privateKey;
  const ca=certificate(pair.publicKey);
  const subject=[{name:'commonName',value:'Kalen - Confianza local de esta notebook'},{name:'organizationName',value:'Kalen local'}];
  ca.setSubject(subject);ca.setIssuer(subject);
  ca.setExtensions([{name:'basicConstraints',critical:true,cA:true,pathLenConstraint:0},{name:'keyUsage',critical:true,keyCertSign:true,cRLSign:true},{name:'subjectKeyIdentifier'}]);
  ca.sign(forge.pki.privateKeyFromPem(caKey),forge.md.sha256.create());
  caPem=forge.pki.certificateToPem(ca);
  await writeFile(path.join(caFolder,'rootCA-key.pem'),caKey,{flag:'wx',mode:0o600});
  await writeFile(path.join(caFolder,'rootCA.pem'),caPem,{flag:'wx'});
 }
 const authority=new X509Certificate(caPem);
 if(!authority.checkPrivateKey(createPrivateKey(caKey)))throw Error('La clave no corresponde al certificado de confianza.');
 let regenerate=true;
 try {
  const cert=new X509Certificate(await readFile(path.join(folder,'server.pem')));
  const key=createPrivateKey(await readFile(path.join(folder,'server-key.pem')));
  regenerate=Date.parse(cert.validTo)<Date.now()+30*86400000||Date.parse(cert.validTo)-Date.parse(cert.validFrom)>825*86400000||!cert.verify(authority.publicKey)||!cert.checkPrivateKey(key)||names.some(name=>isIP(name)?!cert.checkIP(name):!cert.checkHost(name));
 } catch {}
 if(regenerate) {
  // Apple limits even privately issued TLS leaf certificates to 825 days.
  // Renew this one automatically; tablets keep trusting the unchanged CA.
  const expiry=new Date();expiry.setUTCMonth(expiry.getUTCMonth()+27);
  const pair=keys();const cert=certificate(pair.publicKey,expiry);
  const ca=forge.pki.certificateFromPem(caPem);
  cert.setSubject([{name:'commonName',value:'Kalen - Servidor local'}]);cert.setIssuer(ca.subject.attributes);
  cert.setExtensions([{name:'basicConstraints',critical:true,cA:false},{name:'keyUsage',critical:true,digitalSignature:true,keyEncipherment:true},{name:'extKeyUsage',serverAuth:true},{name:'subjectAltName',altNames:names.map(name=>isIP(name)?{type:7,ip:name}:{type:2,value:name})},{name:'subjectKeyIdentifier'}]);
  cert.sign(forge.pki.privateKeyFromPem(caKey),forge.md.sha256.create());
  await writeFile(path.join(folder,'server-key.pem'),pair.privateKey,{mode:0o600});
  await writeFile(path.join(folder,'server.pem'),forge.pki.certificateToPem(cert));
 }
}
