import http from 'node:http';
import { spawn } from 'node:child_process';
import { prepareLocalCertificate } from './prepare-local-certificate.mjs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const httpsPort=Number(process.env.KALEN_HTTPS_PORT)||4174;
const setupPort=Number(process.env.KALEN_SETUP_PORT)||4180;
const {folder,certificate,fingerprint,addresses,expires,trustExpires,permanent} = await prepareLocalCertificate(root);
process.env.DIST_DIR = process.env.KALEN_LOCAL_DIST || resolve(folder, 'dist');
process.env.TLS_CERT_FILE = resolve(folder, 'server.pem');
process.env.TLS_KEY_FILE = resolve(folder, 'server-key.pem');
process.env.PORT = String(httpsPort);
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
  const notebookHost = host === 'localhost' ? addresses[0] || host : host;
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conectar Kalen con la notebook</title><style>body{font:18px/1.6 system-ui;max-width:720px;margin:32px auto;padding:0 20px;background:#101314;color:#f4f6f4}a{color:#a9f3ba}li{margin:18px 0}code{overflow-wrap:anywhere}small{display:block;overflow-wrap:anywhere}section{border-top:1px solid #526056;margin-top:28px;padding-top:20px}</style>
  <h1>La misma app, también sin Internet</h1><p>Esta preparación se hace una sola vez en cada tablet, incluida la del cantante. Los músicos siguen usando Kalen, la aplicación que ya instalaron desde Netlify.</p>
  <p>${permanent?'El certificado de confianza que instalás vale hasta el 31/12/9999, sin vencimiento práctico. El certificado interno del servidor se renueva automáticamente, conservando esa confianza.':'Este certificado no es solo para hoy. Su vencimiento se muestra en la ventana del servidor.'} Si preparaste un certificado anterior, esta nueva carpeta genera otro: instalá el nuevo en cada tablet una sola vez.</p>
  <p>Notebook y tablets deben estar conectadas al mismo Wi-Fi o router. El router puede funcionar sin Internet.</p>
  <h2>1. Preparar la confianza en la notebook</h2><p><a href="/certificado.crt">Descargar certificado Kalen-CA.crt</a></p>
  <details open><summary>Android</summary><p>En Ajustes, buscá <b>Instalar certificado</b>. Elegí <b>Certificado de CA</b> y seleccioná Kalen-CA.crt. Puede pedir el PIN y una confirmación. Cerrá y volvé a abrir Chrome y Kalen.</p><p><a href="https://support.google.com/pixelphone/answer/2844832?hl=es">Ayuda de Android</a></p></details>
  <details><summary>iPad</summary><p>Abrí esta página en Safari, descargá el certificado e instalá el perfil desde Ajustes → General → VPN y gestión de dispositivos. Después, en General → Información → Ajustes de confianza de los certificados, activá la confianza para este certificado.</p><p><a href="https://support.apple.com/es-es/102390">Ayuda de Apple</a></p></details>
  <details><summary>Notebook Windows (si también dirige desde la app de Netlify)</summary><p>Abrí el certificado descargado → Instalar certificado → Usuario actual → Colocar todos los certificados en el siguiente almacén → Entidades de certificación raíz de confianza. Revisá y confirmá la instalación. Reiniciá el navegador y Kalen.</p></details>
  <p>Este certificado permite confiar en la notebook para HTTPS. Instalalo solo si reconocés esta notebook y la huella coincide con la ventana del servidor. No compartas la carpeta de claves.</p>
  <section><h2>2. Comprobar la conexión segura</h2><p><a href="https://${notebookHost}:${httpsPort}/healthz">Comprobar conexión con la notebook</a>. Debe abrir sin advertencias de certificado y mostrar <code>{"ok":true}</code>. Si el navegador pide permiso para acceder a la red local, permitilo.</p></section>
  <section><h2>3. Dirección para sincronizar en la tablet o celular</h2><p>Copiá esta dirección completa en la app Kalen:</p><p><code>wss://${notebookHost}:${httpsPort}/sync</code></p><p>Va en el campo <b>Servidor de sincronización</b> o, si aparece el selector Notebook, en <b>Notebook → Configurar conexión → Dirección de la notebook</b>. Funciona en ambos campos. Copiala sin espacios ni punto al final.</p><ol><li>Abrí la misma aplicación Kalen instalada desde Netlify y entrá a <b>Sincronizar</b>.</li><li>Si aparece Internet / Notebook, elegí <b>Notebook</b> y abrí <b>Configurar conexión</b>.</li><li>Pegá la dirección <b>wss://…/sync</b> indicada arriba en el campo de conexión. Cerrá la configuración.</li><li>El cantante toca <b>Crear grupo</b> primero desde su tablet. Los demás ingresan ese código y tocan <b>Unirme</b>. La notebook puede quedar solo como servidor.</li></ol><p><b>Para el navegador</b> se usan los enlaces http:// de preparación y https:// de comprobación. <b>Para sincronizar dentro de Kalen</b>, copiá wss://…/sync.</p><p>La conexión queda guardada en la app actualizada. Si cambia la IP de la notebook, el director debe actualizarla. Reservar la misma IP en el router evita ese cambio.</p></section>
  <small>Huella SHA-256: <code>${fingerprint}</code></small>`;
  res.end(req.method === 'HEAD' ? undefined : html);
});
bootstrap.on('error', error => { console.error('No se pudo abrir la pagina de instalacion:', error.message); process.exit(1); });
bootstrap.listen(setupPort, '0.0.0.0', () => {
  console.log('\nKALEN LOCAL CON HTTPS');
  for (const address of addresses) {
    console.log('\n1. EN EL NAVEGADOR de la tablet/celular: instalar certificado (una vez)');
    console.log('   http://' + address + ':' + setupPort + '/');
    console.log('2. DENTRO DE LA APP KALEN: direccion para sincronizar');
    console.log('   wss://' + address + ':' + httpsPort + '/sync');
    console.log('   Pegar en "Servidor de sincronizacion" o en');
    console.log('   "Notebook > Configurar conexion > Direccion de la notebook".');
    console.log('   Copiar completa: con wss:// y /sync, SIN punto al final.');
    console.log('   Para comprobar HTTPS en el navegador: https://' + address + ':' + httpsPort + '/healthz');
  }
  console.log('Huella SHA-256 del certificado: ' + fingerprint);
  console.log('Vencimiento del servidor: ' + expires);
  console.log('Vencimiento de la confianza de las tablets: ' + trustExpires);
  if(permanent)console.log('Confianza hasta el 31/12/9999. El certificado del servidor se renueva solo al iniciar; las tablets conservan su confianza.');
  console.log('La notebook puede ser solo servidor. El cantante crea el grupo desde su tablet.');
  console.log('Los musicos siguen usando su app de Netlify: Sincronizar > Notebook.');
  console.log('Mantene esta PC encendida. Ctrl+C para detener.');
  if(process.platform==='win32'&&process.env.KALEN_NO_BROWSER!=='1') {
    const browser=spawn('rundll32.exe',['url.dll,FileProtocolHandler','http://localhost:'+setupPort+'/'],{stdio:'ignore',windowsHide:true});
    browser.on('error',()=>{});browser.unref();
  }
});
