# Configurar Render y continuar la publicación de Kalen Folklore

Guardado el 25/10/2026.

## Punto donde quedamos

El proyecto todavía no está subido a un repositorio. No se creó ni verificó un servicio en Render en esta tarea. La sincronización pública todavía no está activa.

La aplicación está preparada para https://kalenfolklore.netlify.app. Incluye el servidor WebSocket en server.mjs, configuración render.yaml y el comando npm run configure:sync. La compilación y 26 pruebas pasaron durante la preparación; también se comprobó sincronización local entre dos navegadores.

Subir solamente el build actual a Netlify no activa la sincronización. Hace falta publicar el servidor, obtener su dirección real y configurar la aplicación antes de volver a compilar.

## Pasos pendientes

1. Subir el proyecto a un repositorio de GitHub. Incluir server.mjs, chords-server.mjs, src, package.json, package-lock.json, render.yaml y los demás archivos del proyecto. Excluir node_modules, dist, .netlify y archivos .env (ya contemplados en .gitignore).
2. Entrar a https://dashboard.render.com/ y crear una cuenta.
3. Elegir New > Web Service, conectar GitHub y seleccionar el repositorio.
4. Configurar el servicio con los valores siguientes.

| Campo | Valor |
|---|---|
| Name | kalenfolklore-sync |
| Language / Runtime | Node |
| Branch | La rama donde se subió el proyecto |
| Root Directory | Vacío si el proyecto está en la raíz del repositorio |
| Build Command | npm ci --omit=dev |
| Start Command | npm start |
| Instance Type | Free para empezar |
| Health Check Path | /healthz |

Variables de entorno:

| Variable | Valor |
|---|---|
| NODE_VERSION | 22.16.0 |
| NODE_ENV | production |
| ALLOWED_ORIGINS | https://kalenfolklore.netlify.app |

5. Pulsar Deploy Web Service y esperar al estado Live.
6. Copiar la dirección HTTPS real asignada por Render. No suponer que coincide con el nombre del servicio.
7. Abrir https://DOMINIO-REAL/healthz. Debe responder {"ok":true}.
8. Retomar el trabajo con Codex y pasarle la dirección real para configurar el servidor en la aplicación y preparar el build final.

## Conectar la aplicación después

La dirección WebSocket se forma con el dominio real: wss://DOMINIO-REAL/sync.

Para compilar en esta PC, desde la carpeta del proyecto:

```powershell
npm run configure:sync -- wss://DOMINIO-REAL/sync
npm run build
```

El primer comando genera .env.production.local. Si Netlify compila desde Git, definir VITE_SYNC_URL con esa misma dirección en las variables del sitio y volver a desplegar.

Publicar también la función de Netlify que busca acordes. Arrastrar solo dist no publica esa función; usar despliegue desde Git o Netlify CLI, según docs/PRODUCCION.md.

## Comprobar antes del uso

Abrir https://kalenfolklore.netlify.app en dos dispositivos con Internet. Crear grupo en uno, unirse con el mismo código en el otro y comprobar Director/Seguidor, canción, estrofa y desplazamiento. Comprobar desconexión y volver a unirse.

El servicio gratuito de Render puede suspenderse por inactividad y demorar al despertar. Para un show, evaluar un servicio sin suspensión. Los grupos se guardan en memoria: un reinicio del servidor pierde el grupo.

## Alternativa local

Sin Render ni Internet, una PC conectada al mismo router puede ejecutar npm start después de npm run build. Todos los dispositivos abren http://IP-DE-LA-PC:4173. La PC debe permanecer encendida. Con la aplicación actual, solamente tablets y un router no ejecutan el servidor de sincronización.

## Referencias

- Guía del proyecto: docs/PRODUCCION.md
- Configuración preparada: render.yaml
- Render Web Services: https://render.com/docs/web-services
- WebSocket en Render: https://render.com/docs/websocket
- Plan gratuito: https://render.com/docs/free

## Mensaje para retomar

"Continuemos con docs/CONTINUAR-RENDER.md. Ya subí el repositorio y quiero terminar de configurar Render y Netlify para sincronizar los dispositivos automáticamente."
