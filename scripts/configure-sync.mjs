import { writeFile } from 'node:fs/promises';
import { validateSyncEndpoint } from '../src/sync-config.mjs';
const url = validateSyncEndpoint(process.argv[2] || '', 'https:');
if (url.pathname !== '/sync' || url.search) throw Error('Usá la dirección wss:// del servidor terminada en /sync, sin parámetros.');
await writeFile('.env.production.local', 'VITE_SYNC_URL=' + url.href + '\n');
console.log('Servidor configurado: ' + url.href + '. Ejecutá npm run build para preparar dist.');
