import { cp, mkdir, readdir, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('Generar con Node.js de Windows x64.');
const output = path.join(root, 'releases', 'Kalen-Servidor-Local-Windows');
try { await access(output); if (!process.argv.includes('--resume')) throw Error('La carpeta del paquete ya existe. Movela antes de generar otro paquete.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });
function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, { stdio: 'inherit', windowsHide: true, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('Fallo el comando: ' + executable + ' ' + args.join(' '));
}
// Isolated LAN build: production .env files and dist remain untouched.
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'lan', '--outDir', path.join(output, 'dist')], { env: { ...process.env, VITE_SYNC_URL: '' } });
run(process.execPath, [path.join(root, 'scripts/build-pwa.mjs')], { cwd: output });
for (const file of ['server.mjs', 'chords-server.mjs', 'INICIAR-KALEN.cmd']) await cp(file, path.join(output, file));
await mkdir(path.join(output, 'src'), { recursive: true });
for (const file of await readdir('src')) {
  if (file.endsWith('.mjs')) await cp(path.join('src', file), path.join(output, 'src', file));
}
await mkdir(path.join(output, 'scripts'), { recursive: true });
await cp('scripts/start-local.mjs', path.join(output, 'scripts/start-local.mjs'));
await cp('node_modules/ws', path.join(output, 'node_modules/ws'), { recursive: true });
await mkdir(path.join(output, 'runtime'), { recursive: true });
await cp(process.execPath, path.join(output, 'runtime/node.exe'));
const licenseResponse = await fetch('https://raw.githubusercontent.com/nodejs/node/v' + process.versions.node + '/LICENSE', { signal: AbortSignal.timeout(30000) });
if (!licenseResponse.ok) throw Error('No se pudo obtener la licencia de Node.js.');
await writeFile(path.join(output, 'runtime/LICENCIAS-NODE.txt'), await licenseResponse.text());
await writeFile(path.join(output, 'package.json'), JSON.stringify({ name: 'kalen-servidor-local', version: '0.1.0', private: true, type: 'module' }, null, 2));
await cp('docs/GUIA-SERVIDOR-LOCAL.txt', path.join(output, 'LEEME.txt'));
const zip = output + '.zip';
run('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', 'Compress-Archive -LiteralPath $env:KALEN_PACKAGE_DIR -DestinationPath $env:KALEN_PACKAGE_ZIP -CompressionLevel Optimal'], { env: { ...process.env, KALEN_PACKAGE_DIR: output, KALEN_PACKAGE_ZIP: zip } });
console.log('\nPaquete listo: ' + zip);
