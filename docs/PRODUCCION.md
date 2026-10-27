# Producción: Kalen Folklore

Destino de la aplicación: https://kalenfolklore.netlify.app

La web se publica en Netlify. El servidor de sincronización se publica por separado: Netlify no ejecuta server.mjs como un proceso persistente. No configurar una redirección /sync hacia Render.

## 1. Publicar el servidor WebSocket

Subir este proyecto a un repositorio y crear un Blueprint en Render desde render.yaml. También se puede crear un Web Service manual con estas opciones:

- Runtime: Node 22.16.0.
- Build: npm ci --omit=dev
- Start: npm start
- Health check: /healthz
- ALLOWED_ORIGINS: https://kalenfolklore.netlify.app
- Una sola instancia: los grupos se guardan en memoria.

Render asigna el dominio real; el nombre del servicio no garantiza una URL específica. Comprobar https://<dominio-real>/healthz: debe responder {"ok":true}. La dirección de sincronización será wss://<dominio-real>/sync.

El Blueprint usa el plan gratuito. Puede suspender el servidor por inactividad y demorar la primera conexión. Para un show, elegir un plan sin suspensión. Reiniciar o desplegar el servidor pierde los grupos; volver a crear/unirse. La lectura offline se conserva en cada dispositivo.

## 2. Preparar Netlify

El sitio correcto es kalenfolklore.netlify.app. El repositorio ya incluye netlify.toml, la función de búsqueda de acordes y las redirecciones.

Si Netlify compila desde Git, configurar VITE_SYNC_URL en las variables de entorno del sitio con la dirección real wss://<dominio-real>/sync. Luego desplegar: comando npm run build, carpeta dist, funciones netlify/functions.

Si vas a compilar en esta PC:

~~~powershell
npm run configure:sync -- wss://<dominio-real>/sync
npm run build
~~~

El primer comando guarda .env.production.local (no se sube al repositorio). dist contiene la web compilada. Para conservar la búsqueda de acordes mediante la función, desplegar el proyecto con Netlify CLI o desde Git; arrastrar solamente dist no publica la función del servidor. Ejemplo desde la carpeta del proyecto, con Netlify CLI instalado y sesión iniciada:

~~~powershell
netlify deploy --build --prod --site 3ee36e33-04bf-4ba8-bcc0-267c168c63c2
~~~

No usar scripts/deploy-netlify.mjs para publicar producción: es un script previo de borrador que requiere un ZIP de función ya construido.

## 3. Verificación final

Abrir https://kalenfolklore.netlify.app en dos navegadores/dispositivos. En Sincronizar debe aparecer la dirección wss configurada. Crear grupo en uno y Unirme con el mismo código en el otro. Verificar Director/Seguidor, cambio de canción, estrofa y desplazamiento. Desconectar/reunirse y comprobar recepción del estado actual. Si hay una versión PWA previa, aceptar la actualización de la aplicación.

El servidor permite explícitamente el origen de producción y conserva el funcionamiento local por el mismo host. Otros dominios se rechazan. Para otro dominio autorizado, agregar su origen HTTPS exacto a ALLOWED_ORIGINS, separado por comas; no usar comodines.

## Estado de esta preparación

Código y configuración preparados. Para activar la sincronización pública todavía hace falta crear el servicio, obtener su dirección real, configurar VITE_SYNC_URL y publicar. Sin esa dirección, la web no supone que Netlify tiene un WebSocket en /sync: muestra el campo vacío y explica que falta configurarlo al conectar.
