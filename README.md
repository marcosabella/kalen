# Repertorio · En vivo

Gestor React orientado a actuaciones en vivo, con diseño Mobile First aprobado. Incluye biblioteca editable, orden del show, lector de letras, sincronización por canción/estrofa y PWA offline.

## Ejecutar

Requiere Node.js 20.19+ o 22.12+.

```powershell
npm ci
npm run build
npm start
```

Abrir http://localhost:4173. Para desarrollo: `npm run dev` (la PWA se habilita en producción). Las dependencias ya están disponibles en este workspace; durante la implementación se reutilizaron paquetes locales porque el registro npm no fue accesible. Hay un package-lock para instalaciones posteriores.

## Antes del show

1. Crear o editar canciones. Separar estrofas con líneas vacías. Escribir acordes junto a su palabra, por ejemplo [Am]Vuelve a cantar; no usar columnas de espacios para alinearlos.
2. Ordenar canciones en Repertorio con Subir/Bajar. La biblioteca permite volver a agregar canciones quitadas del show.
3. Guardar para offline y comprobar la apertura en modo avión.
4. Configurar fuente, interlineado, velocidad y pantalla encendida en cada dispositivo.
5. Entrar al escenario. Ocultar controles para maximizar la lectura. Tocar o desplazar la letra pausa el automático; Auto lo reanuda.

## Tablets y teléfonos

Para instalar y usar Wake Lock en dispositivos remotos, servir por **HTTPS**. HTTP en localhost sirve para validación local, pero una dirección IP de la red local por HTTP no ofrece todas las APIs PWA. El servidor Node incluido sirve los archivos y la sincronización; un proxy HTTPS debe reenviar también WebSocket en /sync. Usar el mismo origen en navegador y servidor.

No se fuerza la orientación. La interfaz contempla safe-area-inset y altura dinámica del viewport. La preferencia es individual por origen/perfil de navegador; la PWA y el navegador pueden tener almacenes separados según la plataforma. Borrar datos del sitio también borra letras y ajustes: Exportar copia ofrece respaldo JSON.

## Sincronización

Abrir Sincronizar y Crear grupo en el dispositivo director. Compartir su código; los demás ingresan el mismo servidor y código y eligen Unirme. El primer dispositivo del grupo dirige. Se comparte la canción completa y la estrofa actual; nunca se envían preferencias visuales. Desactivar Seguir al director permite lectura y navegación independientes.

La canción recibida se guarda separadamente para recuperar su lectura sin red. Las preferencias se guardan en localStorage y la biblioteca/canción recibida en IndexedDB. El servidor conserva el grupo en memoria; no es un backend de cuentas ni almacenamiento permanente. Al perder conexión se mantiene la lectura local; Unirme permite reconectar. Si sale el director, los seguidores quedan esperando: no toman automáticamente el control.

El código es la clave de acceso al grupo. Se puede elegir uno de al menos 4 caracteres antes de tocar Crear grupo; si el campo está vacío, la aplicación genera uno de 6 caracteres. No hay historial de grupos ni usuarios. Para un despliegue público se debe definir además la política de autenticación y operación.

## Pruebas

```powershell
npm test
npm run build
npm start
# En otra terminal:
$env:BROWSER_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
npm run test:ui
```

TEST_URL permite probar otra dirección. BROWSER_PATH permite usar Chrome/Edge instalado. Las pruebas generan capturas en docs/screenshots y resultados en docs/ui-results.json. La matriz y las comprobaciones físicas pendientes están en docs/VALIDACION.md.

## Tablero y pantallas

Inicio muestra solo el tablero de botones cuadrados. Cada acción abre una pantalla independiente, con Volver al inicio. Biblioteca contiene todas las canciones; el botón ••• permite editar o borrar definitivamente. Quitar del show conserva la canción en la biblioteca. Borrar pide confirmación y elimina también su referencia en el repertorio.

## Búsqueda automática de letras

El editor muestra siempre el texto y los códigos de acordes. Seleccioná palabras y usá la barra para aplicar negrita, cursiva, subrayado o color; Quitar formato limpia la selección. También acepta Ctrl/Cmd+B, I y U. El resultado aparece en la vista previa y en el escenario. El formato se guarda con la canción, se incluye en las copias JSON y se comparte por sincronización. Las canciones anteriores siguen funcionando sin cambios.

En Nueva canción, escribir un título de al menos tres caracteres inicia la búsqueda tras 900 ms sin cambios. Artista es opcional. Una coincidencia exacta y única carga la letra; varias versiones requieren elegir. Buscar ahora permite reintentar o buscar desde una canción existente. Una letra ya escrita nunca se reemplaza sin confirmación, y una respuesta tardía no pisa una edición manual. Las letras guardadas permanecen disponibles offline; la búsqueda necesita Internet.

Proveedor: [LRCLIB](https://lrclib.net/docs), consultado directamente desde navegador. Se identifica el cliente, se espacian solicitudes y se respeta Retry-After. No necesita configuración de claves. La conexión real al proveedor no pudo comprobarse desde el entorno de desarrollo; los flujos se validaron con respuestas controladas.

Pruebas adicionales: npm run test:lyrics-ui y npm run test:navigation-ui.

## Apariencia por dispositivo

Ajustes → Modo de visualización permite elegir Claro u Oscuro. La selección se guarda en este dispositivo y no cambia al sincronizar el show. Cada modo usa su logo Kalen en PNG transparente, sin fondo en el contenedor. Los originales de public se conservan.

## Publicar Kalen Folklore

Ver [guía de producción](docs/PRODUCCION.md) para kalenfolklore.netlify.app y el servidor WebSocket. Incluye render.yaml y configuración VITE_SYNC_URL.
