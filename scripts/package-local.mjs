import { cp, mkdir, readdir, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('Generar con Node.js de Windows x64.');
const permanent = process.argv.includes('--permanent');
const secure = permanent || process.argv.includes('--https');
const output = path.join(root, 'releases', permanent ? 'Kalen-Servidor-Local-HTTPS-Permanente-Windows' : secure ? 'Kalen-Servidor-Local-HTTPS-Windows' : 'Kalen-Servidor-Local-Windows');
try { await access(output); if (!process.argv.includes('--resume')) throw Error('La carpeta del paquete ya existe. Movela antes de generar otro paquete.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });
if(secure) {
  try {await access(path.join(output,'.local-https/ca/rootCA-key.pem'));throw Error('Este paquete ya se inició y contiene claves privadas. Generá el paquete en una carpeta nueva.');}
  catch(error) {if(error.code!=='ENOENT')throw error;}
}
function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, { stdio: 'inherit', windowsHide: true, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('Fallo el comando: ' + executable + ' ' + args.join(' '));
}
// Isolated LAN build: production .env files and dist remain untouched.
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'lan', '--outDir', path.join(output, 'dist')], { env: { ...process.env, VITE_SYNC_URL: '' } });
run(process.execPath, [path.join(root, 'scripts/build-pwa.mjs')], { cwd: output });
for (const file of ['server.mjs', 'chords-server.mjs', secure ? 'INICIAR-KALEN-HTTPS.cmd' : 'INICIAR-KALEN.cmd']) await cp(file, path.join(output, file));
await mkdir(path.join(output, 'src'), { recursive: true });
for (const file of await readdir('src')) {
  if (file.endsWith('.mjs')) await cp(path.join('src', file), path.join(output, 'src', file));
}
await mkdir(path.join(output, 'scripts'), { recursive: true });
for (const file of secure ? ['start-local-https.mjs','prepare-local-certificate.mjs'] : ['start-local.mjs']) await cp(path.join('scripts',file),path.join(output,'scripts',file));
if(permanent) {
  await cp('scripts/permanent-local-certificate.mjs',path.join(output,'scripts/permanent-local-certificate.mjs'));
  await mkdir(path.join(output,'.local-https'),{recursive:true});
  await writeFile(path.join(output,'.local-https/permanent.json'),JSON.stringify({validUntil:'9999-12-31T23:59:59Z'}));
  await cp('node_modules/node-forge',path.join(output,'node_modules/node-forge'),{recursive:true});
}
if (secure && !permanent) {
  // Only the certificate tool is portable. Each notebook creates its own CA and keys.
  await mkdir(path.join(output,'.local-https/tools'),{recursive:true});
  await cp('.local-https/tools/mkcert.exe',path.join(output,'.local-https/tools/mkcert.exe'));
  const license = await fetch('https://raw.githubusercontent.com/FiloSottile/mkcert/v1.4.4/LICENSE', {signal:AbortSignal.timeout(30000)});
  if(!license.ok)throw Error('No se pudo obtener la licencia de mkcert.');
  await writeFile(path.join(output,'.local-https/tools/LICENCIA-MKCERT.txt'),await license.text());
}
await cp('node_modules/ws', path.join(output, 'node_modules/ws'), { recursive: true });
await mkdir(path.join(output, 'runtime'), { recursive: true });
await cp(process.execPath, path.join(output, 'runtime/node.exe'));
const licenseResponse = await fetch('https://raw.githubusercontent.com/nodejs/node/v' + process.versions.node + '/LICENSE', { signal: AbortSignal.timeout(30000) });
if (!licenseResponse.ok) throw Error('No se pudo obtener la licencia de Node.js.');
await writeFile(path.join(output, 'runtime/LICENCIAS-NODE.txt'), await licenseResponse.text());
await writeFile(path.join(output, 'package.json'), JSON.stringify({ name: 'kalen-servidor-local', version: '0.1.0', private: true, type: 'module' }, null, 2));
await cp(permanent ? 'docs/GUIA-SERVIDOR-LOCAL-PERMANENTE.txt' : secure ? 'docs/GUIA-SERVIDOR-LOCAL-HTTPS.txt' : 'docs/GUIA-SERVIDOR-LOCAL.txt', path.join(output, 'LEEME.txt'));
if(permanent)await cp('docs/GUIA-SERVIDOR-LOCAL-HTTPS.txt',path.join(output,'GUIA-CONEXION.txt'));
const zip = output + '.zip';
run('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', 'Compress-Archive -LiteralPath $env:KALEN_PACKAGE_DIR -DestinationPath $env:KALEN_PACKAGE_ZIP -CompressionLevel Optimal -Force'], { env: { ...process.env, KALEN_PACKAGE_DIR: output, KALEN_PACKAGE_ZIP: zip } });
console.log('\nPaquete listo: ' + zip);
