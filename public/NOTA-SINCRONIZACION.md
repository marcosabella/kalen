# Sincronización Kalen Folklore

Dominio de producción: https://kalenfolklore.netlify.app

La aplicación se sirve desde Netlify y usa un servidor WebSocket externo mediante wss://. Los pasos de publicación están en docs/PRODUCCION.md del proyecto. El servidor permite explícitamente el origen de producción.

Para uso local: npm run build y npm start, abrir http://IP-DE-LA-PC:4173 en todos los dispositivos y usar ws://IP-DE-LA-PC:4173/sync. Para Internet: configurar VITE_SYNC_URL con la dirección real del servidor antes de compilar.

Crear grupo en el director; compartir el código y usar Unirme en los seguidores. Una conexión HTTPS requiere wss://. Si se pierde la red, las letras permanecen en el dispositivo. Usar Unirme para reconectar.
