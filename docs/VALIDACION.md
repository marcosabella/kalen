# Plan y evidencia de validación

## Automatización

- npm test: límites de fuente, preferencias distintas en dos dispositivos, importaciones inválidas/duplicadas, mensajes de sincronización inválidos y estrofas.
- npm run build: TypeScript estricto, compilación React y precache PWA.
- npm run test:ui: navegador Chromium/Edge; seis viewports, biblioteca y escenario, ausencia de desbordamiento horizontal, controles ≥48 px, ocultar/recuperar, navegación, fuente 64 px y persistencia.
- Pruebas de letras extensas sin espacios, creación y recuperación después de recargar, desplazamiento automático y pausa manual.
- Descarga offline, recarga sin red y navegación entre canciones.
- Dos contextos independientes conectados al servidor: canción y estrofa compartidas, fuente/tema/velocidad locales y última canción recibida después de recargar offline.

| Vista | CSS px |
| --- | --- |
| Celular vertical | 390 × 844 |
| Celular horizontal | 844 × 390 |
| Tablet vertical | 768 × 1024 |
| Tablet horizontal | 1024 × 768 |
| Escritorio | 1440 × 900 |
| Celular pequeño | 320 × 568 |

## Validación física pendiente

| Plataforma | Comprobaciones |
| --- | --- |
| Android + Chrome | Instalar PWA, bloqueo/desbloqueo, Wake Lock, ahorro de batería, barras del sistema |
| iPhone + Safari | Agregar a inicio, safe areas/notch, barras dinámicas, cambio de orientación, almacenamiento offline |
| iPad + Safari | Atril horizontal/vertical, pantalla dividida, legibilidad a distancia |
| Tablet Android | Fuente y controles desde atril, lectura automática durante 45 minutos |
| Escritorio | Zoom 200 %, teclado, foco, NVDA/VoiceOver según plataforma |

Pruebas manuales adicionales: navegador sin Wake Lock, solicitud rechazada, documento oculto y posterior recuperación, almacenamiento lleno/denegado, datos borrados, cambio de versión con show abierto, red intermitente y reconexión, director desconectado, teclado virtual al editar, títulos/letras extremadamente largos, lector de pantalla, contraste con medidor y observación con iluminación de escenario.

Aceptación: las letras no exigen desplazamiento horizontal; no hay texto o controles tapados por áreas seguras; fuente y ancla de lectura se conservan al rotar; los ajustes locales no cambian por sincronización; el show descargado abre sin red; actualizar no interrumpe una actuación. No declarar validación iOS/Android física ni cumplimiento WCAG completo sin estas comprobaciones.

Las pruebas UI también verifican recuperación del ancla al cambiar orientación/fuente y rechazo de Wake Lock con una API simulada. Las APIs reales en hardware móvil siguen pendientes.

## Nuevos flujos de tablero, biblioteca y letras

Se añaden tests/lyrics.test.mjs, scripts/test-lyrics-ui.mjs y scripts/test-navigation-ui.mjs. Se verifica tablero cuadrado en seis medidas, ausencia del tablero en las pantallas hijas, retorno a Inicio, edición, cancelación de borrado, borrado persistente de biblioteca y repertorio, autocompletado, varias versiones, protección de texto existente, respuesta tardía y alternativa sin conexión. Evidencia: lyrics-ui-results.json y navigation-ui-results.json. El proveedor se simula en estas pruebas; la consulta real desde este entorno falló por conectividad y queda pendiente comprobar su disponibilidad desde la red del usuario.

## Temas y logos transparentes

Compilación y 13 pruebas unitarias correctas. En Edge a 390 × 844 se verificó cambio claro/oscuro, logo correspondiente, fondo transparente del contenedor, ausencia de las leyendas del pie y persistencia tras recargar. Ambos logos cargan sin conexión con el service worker activo; sin errores de ejecución. PNG con alfa transparente en sus esquinas. Capturas: screenshots/kalen-dark-home.png y screenshots/kalen-light-home.png. Evidencia: theme-ui-results.json.

## Alta táctil por HTTP

Se reprodujo el fallo al tocar Nueva canción en un origen HTTP no seguro: `crypto.randomUUID is not a function`, sin apertura del editor. Se incorpora generación UUID v4 con `crypto.getRandomValues` cuando falta la API nativa, también para grupos. Referencia: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues. Inicio y Biblioteca comparten la apertura y limpian el aviso previo para que no tape Guardar.

Compilación correcta y 15 pruebas unitarias aprobadas. `npm run test:mobile-add-ui` verifica toques a 390 × 844 por HTTP no seguro y a 360 × 800 por localhost: alta desde ambos accesos, dos canciones distintas persistentes tras recarga, sin errores de ejecución ni desbordamiento horizontal. Evidencia: mobile-add-ui-results.json. Se usa Chromium con emulación táctil; no sustituye comprobación física en el celular del usuario.
