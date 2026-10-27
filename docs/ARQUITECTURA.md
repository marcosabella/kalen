# Arquitectura inicial y decisiones de interfaz

Diseño aprobado por el usuario el 13/10/2026. La carpeta inicial estaba vacía.

## Distribución responsive

| Ancho CSS | Comportamiento |
| --- | --- |
| <600 px | Una columna, navegación superior, repertorio superpuesto |
| 600–899 px | Lectura amplia, controles en una fila si hay espacio |
| 900–1199 px | Navegación lateral en gestión; repertorio opcional al lado de la letra |
| ≥1200 px | Distribución de escritorio, ancho de lectura limitado |

La regla landscape + altura ≤500 px reduce cabecera y controles secundarios y conserva anterior/siguiente de 64 px. CSS usa min-height:0 y min-width:0 en contenedores flex para permitir desplazamiento vertical sin desbordamiento. La letra usa pre-wrap y overflow-wrap:anywhere. Las ventanas de configuración son dialog nativos, con foco contenido y Escape; todas las pantallas tienen estado vacío y etiquetas accesibles.

## Componentes y módulos

- App.tsx: navegación, biblioteca, repertorio, escenario y paneles de preferencias/sincronización. Coordinación de estados locales y compartidos.
- components/LyricsReader.tsx: estrofas, ajuste de líneas, ancla local de lectura y recuperación después de cambio de fuente/orientación. Usa posición relativa dentro de estrofa, no coordenadas compartidas en píxeles.
- components/Modal.tsx: dialog accesible y cierre explícito.
- components/Glyph.tsx: iconos SVG locales, sin red ni fuentes externas.
- hooks.ts: useVisualPreferences, useWakeLock, useAutoScroll y useSync.
- data.ts: acceso IndexedDB, biblioteca y última canción recibida guardadas por separado.
- domain.mjs: validación de importación, preferencias y mensajes de sincronización, compartida con servidor y pruebas.
- server.mjs: HTTP estático y grupos WebSocket con límites de carga/mensajes y verificación de origen.
- scripts/build-pwa.mjs: manifiesto, iconos PNG, precache por hash de contenido y service worker.

## Separación de estados

Estado musical compartido: canción (id, título, artista, letra) y número de estrofa. El servidor construye una carga permitida explícita y solo el director puede publicar.

Estado visual local: fuente (18–64 px), interlineado (1.2–2.2), velocidad (5–90 px/s), contraste, Wake Lock y elección de seguir. Ocultar controles y pausar reproducción son estados transitorios. No se comparten ni se sobrescriben desde WebSocket.

Valor inicial de fuente: 26 px en anchos <600, 32 px en tablets y 28 px desde 1200 px. Luego manda la preferencia guardada, incluso al rotar.

El arranque de lectura automática siempre es explícito. Cambiar canción o interactuar con la letra pausa el desplazamiento. Un seguidor conectado utiliza el ancla del director; al desconectarse puede volver a navegar y desplazar localmente. No hay cambio automático de canción al final de la letra.

## PWA y actualizaciones

El precache contiene HTML, JS, CSS, manifiesto e iconos locales. La instalación se completa solo si todos se almacenan. Guardar para offline espera una transacción IndexedDB y consulta al service worker para verificar el precache. Solicita persistencia al navegador cuando existe la API, sin asumir que será concedida.

El service worker sirve el shell desde caché. No intercepta llamadas a otros orígenes. Una actualización queda esperando hasta que el usuario la aplica desde ajustes fuera del escenario; no fuerza una recarga durante el show. Primera instalación puede reclamar clientes. Las cachés de versiones anteriores se limpian al activar una nueva.

Wake Lock se solicita únicamente en escenario cuando el usuario lo activa; se libera al salir. Se detecta soporte, rechazo y liberación. Se intenta recuperar al regresar al primer plano. No se garantiza un bloqueo que el sistema operativo decida liberar.

## Accesibilidad y escenario

Controles ≥48 × 48 CSS px, navegación principal ≥64 px de alto, separación de 8 px. Fondo oscuro, texto blanco y acento verde claro; foco cyan visible. Contraste objetivo ≥7:1 para letra principal. Tema oscuro alternativo configurable. Zoom permitido, sin user-scalable=no. Compatibilidad con prefers-reduced-motion; desplazamiento automático optativo.

safe-area-inset en cabecera, pie, lector y botón de recuperar controles; height:100dvh con fallback 100vh. Teclado: flechas izquierda/derecha para canción, Espacio para automático, H para mostrar/ocultar y Escape para recuperar controles/cerrar panel.

## Alcance

Esta base administra una biblioteca y el repertorio actual por dispositivo. Sin cuentas, catálogo remoto ni múltiples shows nombrados. No está publicada. Las comprobaciones de navegador no sustituyen la evaluación física desde un atril ni validan por sí mismas WCAG completa.

## Navegación por pantallas y letras automáticas

La pantalla inicial es exclusivamente un tablero. Repertorio y Biblioteca abren vistas independientes; Nueva canción, Sincronizar, Ajustes y Offline usan components/Screen.tsx, con botón de regreso. El lector se conserva montado y oculto al abrir ajustes desde escenario para mantener su ancla y pausar el desplazamiento automático. Dialog se reserva para opciones de canción y confirmación de borrado.

components/SongEditor.tsx coordina búsqueda demorada, cancelación y revisión. lyrics.mjs normaliza resultados LRCLIB, elige solo coincidencias exactas inequívocas, convierte LRC a texto cuando hace falta, descarta instrumentales y respuestas inválidas y limita resultados. La caché de consultas es temporal en memoria; las letras elegidas se guardan como parte de la canción en IndexedDB. Borrar canciones actualiza biblioteca y repertorio en una misma transacción.

## Temas y marca

La preferencia local `theme` selecciona los modos claro/oscuro, sus variables CSS, el esquema de color del navegador y el logo transparente. Preferencias previas sin `theme` adoptan oscuro. La sincronización no transmite este valor. Ambos PNG están incluidos en el caché PWA.
