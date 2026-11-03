import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { once } from 'node:events';
import { X509Certificate } from 'node:crypto';
import forge from 'node-forge';
import { preparePermanentCertificate } from '../scripts/permanent-local-certificate.mjs';

test('confianza hasta 9999, TLS compatible y renovación sin reinstalar confianza', {timeout:60000},async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'kalen-cert-test-'));
 const names=['localhost','127.0.0.1','::1'];
 await preparePermanentCertificate(folder,names);
 const caFile=path.join(folder,'ca/rootCA.pem');
 const caPem=await readFile(caFile,'utf8');const ca=new X509Certificate(caPem);
 const serverFile=path.join(folder,'server.pem');
 const original=await readFile(serverFile,'utf8');const leaf=new X509Certificate(original);
 assert.equal(ca.validTo,'Dec 31 23:59:59 9999 GMT');assert.equal(ca.ca,true);assert.equal(leaf.ca,false);assert.ok(leaf.verify(ca.publicKey));
 assert.ok(Date.parse(leaf.validTo)-Date.parse(leaf.validFrom)<=825*86400000);
 for(const name of names)assert.ok(name==='localhost'?leaf.checkHost(name):leaf.checkIP(name));
 const server=https.createServer({cert:original,key:await readFile(path.join(folder,'server-key.pem'))},(req,res)=>res.end('OK'));
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try {
  const result=await new Promise((resolve,reject)=>{const request=https.get('https://127.0.0.1:'+server.address().port,{ca:caPem,agent:false},res=>{const authorized=res.socket.authorized;res.resume();res.on('end',()=>resolve({authorized,status:res.statusCode}));});request.on('error',reject);});
  assert.deepEqual(result,{authorized:true,status:200});
 } finally {await new Promise(resolve=>server.close(resolve));}
 await preparePermanentCertificate(folder,names);assert.equal(await readFile(serverFile,'utf8'),original);assert.equal(await readFile(caFile,'utf8'),caPem);
 await preparePermanentCertificate(folder,[...names,'127.0.0.2']);assert.equal(await readFile(caFile,'utf8'),caPem);assert.ok(new X509Certificate(await readFile(serverFile)).checkIP('127.0.0.2'));
 // A near-expiry leaf is renewed automatically with the SAME trusted authority.
 const expiring=forge.pki.certificateFromPem(await readFile(serverFile,'utf8'));expiring.validity.notAfter=new Date(Date.now()+86400000);expiring.sign(forge.pki.privateKeyFromPem(await readFile(path.join(folder,'ca/rootCA-key.pem'),'utf8')),forge.md.sha256.create());await writeFile(serverFile,forge.pki.certificateToPem(expiring));
 await preparePermanentCertificate(folder,names);assert.ok(Date.parse(new X509Certificate(await readFile(serverFile)).validTo)>Date.now()+700*86400000);assert.equal(await readFile(caFile,'utf8'),caPem);
 // Existing older trusted authorities must never be replaced silently.
 const old=forge.pki.certificateFromPem(caPem);old.validity.notAfter=new Date('2036-01-01T00:00:00Z');old.sign(forge.pki.privateKeyFromPem(await readFile(path.join(folder,'ca/rootCA-key.pem'),'utf8')),forge.md.sha256.create());const oldPem=forge.pki.certificateToPem(old);await writeFile(caFile,oldPem);
 await assert.rejects(preparePermanentCertificate(folder,names),/carpeta NUEVA/);assert.equal(await readFile(caFile,'utf8'),oldPem);
});
