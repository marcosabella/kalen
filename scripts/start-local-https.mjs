import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const folder = resolve('.local-https');
const certificate = await readFile(resolve(folder, 'Kalen-CA.crt'));
const info = JSON.parse(await readFile(resolve(folder, 'info.json'), 'utf8'));
process.env.DIST_DIR = resolve(folder, 'dist');
process.env.TLS_CERT_FILE = resolve(folder, 'server.pem');
process.env.TLS_KEY_FILE = resolve(folder, 'server-key.pem');
process.env.PORT = '4174';
await import('../server.mjs');
const bootstrap = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  if (req.url === '/certificado.crt') {
    res.writeHead(200, { 'Content-Type': 'application/x-x509-ca-cert', 'Content-Disposition': 'attachment; filename="Kalen-CA.crt"', 'Cache-Control': 'no-store', 'Content-Length': certificate.length });
    return res.end(req.method === 'HEAD' ? undefined : certificate);
  }
  if (req.url !== '/') { res.writeHead(404); return res.end('No encontrado'); }
  let host;
  try { host = new URL('http://' + req.headers.host).hostname; } catch { host = 'localhost'; }
  if (!/^[0-9.]+$/.test(host)) host = 'localhost';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" });
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Instalar Kalen local</title><style>body{font:18px/1.6 system-ui;max-width:680px;margin:32px auto;padding:0 20px;background:#101314;color:#f4f6f4}a{color:#a9f3ba}li{margin:18px 0}code{overflow-wrap:anywhere}small{display:block;overflow-wrap:anywhere}</style><h1>Instalar Kalen en Android</h1><p>Conectá el celular al mismo Wi-Fi que esta PC.</p><ol><li><a href="/certificado.crt">Descargar certificado Kalen-CA.crt</a></li><li>En Ajustes del celular, buscá <b>Instalar certificado</b>. Elegí <b>Certificado de CA</b> y seleccioná el archivo descargado. Puede pedir el PIN del celular y confirmar la instalación. El nombre del menú cambia según el teléfono.</li><li>Cerrá y volvé a abrir Chrome. <a href="https://${host}:4174/">Abrir Kalen por HTTPS</a>. La página debe abrir sin advertencias de certificado.</li><li>En el menú ⋮ de Chrome, elegí <b>Instalar aplicación</b> o <b>Agregar a la pantalla principal → Instalar</b>. También podés usar el botón de instalación de Kalen cuando aparezca.</li></ol><p>La app local sincroniza sin Internet mientras la PC y el router estén encendidos. Todos deben abrir la misma dirección y unirse al mismo grupo.</p><p>El certificado hace que tu celular confíe en esta PC para HTTPS. Instalalo únicamente en tus dispositivos de prueba. Podés quitarlo después desde Credenciales de usuario.</p><small>Huella SHA-256 del certificado: <code>${info.fingerprint}</code></small></html>`;
  res.end(req.method === 'HEAD' ? undefined : html);
});
bootstrap.on('error', error => { console.error('No se pudo abrir la pagina de instalacion:', error.message); process.exit(1); });
bootstrap.listen(4180, '0.0.0.0', () => {
  console.log('\nKALEN LOCAL CON HTTPS');
  for (const entries of Object.values(networkInterfaces())) for (const address of entries || []) {
    if (address.family !== 'IPv4' || address.internal || address.address.startsWith('169.254.')) continue;
    console.log('Instalar certificado: http://' + address.address + ':4180/');
    console.log('App instalable: https://' + address.address + ':4174/');
  }
  console.log('Mantene esta PC encendida. Ctrl+C para detener.');
});
