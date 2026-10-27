import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const port = 4173;
const probe = net.createServer();
probe.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'El puerto 4173 esta ocupado. Cerra otra ventana de Kalen e intenta nuevamente.' : 'No se pudo abrir el servidor: ' + error.message);
  process.exitCode = 1;
});
probe.listen(port, '0.0.0.0', () => probe.close(async () => {
  process.env.PORT = String(port);
  try {
    await import('../server.mjs');
    console.log('\nKALEN - SERVIDOR LOCAL\n');
    console.log('En esta PC: http://localhost:' + port);
    console.log('\nEn celulares y tablets conectados al mismo router:');
    for (const [name, entries] of Object.entries(networkInterfaces())) {
      for (const address of entries || []) {
        if (address.family === 'IPv4' && !address.internal) console.log('  http://' + address.address + ':' + port + ' (' + name + ')');
      }
    }
    console.log('\nCrea un grupo y uni los otros dispositivos con el mismo codigo.');
    console.log('Si Windows pregunta, permite Node.js en redes privadas.');
    console.log('Deja esta ventana abierta y evita que la PC se suspenda.');
    console.log('Para detener el servidor: Ctrl+C.\n');
    if (process.platform === 'win32' && process.env.KALEN_NO_BROWSER !== '1') {
      const browser = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', 'http://localhost:' + port], { stdio: 'ignore', windowsHide: true });
      browser.on('error', () => {});
      browser.unref();
    }
  } catch (error) {
    console.error('No se pudo iniciar Kalen:', error.message);
    process.exitCode = 1;
  }
}));
