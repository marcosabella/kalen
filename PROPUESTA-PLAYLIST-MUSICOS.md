# Propuesta: Playlist para músicos

Fecha: 30 de octubre de 2026.

Estado: propuesta guardada. No se ha autorizado implementar la nueva versión ni publicar cambios.

## Objetivo

Crear una versión de la app que pueda utilizar cualquier músico, con cuentas individuales e ingreso con Google, preservando la app actual diseñada para Kalen.

## Organización de los proyectos

Preparar un workspace con dos proyectos independientes:

- **PLAYLIST SHOWS:** proyecto actual de Kalen, conservando su funcionamiento, diseño, datos y configuración.
- **PLAYLIST MUSICOS:** nuevo proyecto basado en una copia de la app actual, con identidad propia y preparado para múltiples usuarios.

La nueva versión debe tener su propio repositorio, base de datos, configuración y sitio. Copiar la carpeta no basta: hay que revisar y separar las conexiones, credenciales, almacenamiento y configuración de publicación para evitar que el nuevo proyecto modifique los datos o el sitio de Kalen.

La ubicación de la nueva carpeta y del archivo de workspace se definirá al retomar el trabajo. Esta propuesta no crea ninguno de ellos.

## Acceso y almacenamiento

Se propone usar Supabase Auth con el botón **Continuar con Google**, y Supabase como base de datos.

Flujo previsto:

1. El músico ingresa con Google.
2. En el primer ingreso elige su nombre artístico o el de su banda.
3. Accede a un espacio propio con canciones, letras y listas de shows.
4. Puede ingresar desde otro dispositivo y recuperar su información.

El login debe acompañarse con permisos en la base de datos: cada usuario solo podrá acceder a la información que le corresponda. Se propone aplicar políticas de seguridad por fila (RLS). También debe aislarse el almacenamiento local por cuenta y evitar que queden visibles datos de otro usuario al cambiar de sesión.

Referencias oficiales:

- Google con Supabase Auth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Permisos en la base de datos: https://supabase.com/docs/guides/database/postgres/row-level-security

## Modelo para solistas y bandas

Organizar los datos por proyecto musical, con una estructura de miembros y permisos preparada para futuras ampliaciones. Una persona podría tener su proyecto solista y participar en una banda.

La primera versión ofrecerá un espacio privado por músico. Las invitaciones a otros integrantes y los permisos compartidos pueden incorporarse en una segunda etapa.

## Primera etapa

- Acceso con Google y cierre de sesión.
- Perfil del músico o banda.
- Reutilización de las funciones actuales que correspondan.
- Canciones, letras y listas privadas guardadas en la nube.
- Inicio vacío para cada nueva cuenta, con ejemplos opcionales y sin copiar automáticamente el repertorio de Kalen.
- Exportación e importación de repertorio.
- Conservación del uso sin conexión, si la app actual lo contempla, revisando la sincronización y el aislamiento entre cuentas.

## Segunda etapa

- Invitaciones a integrantes de bandas.
- Permisos para editar o solamente consultar.
- Listas públicas o compartidas.
- Posibles planes de pago.

## Orden de trabajo al retomar

1. Revisar el código y la configuración actuales para confirmar qué se puede reutilizar. La revisión previa no pudo completarse por un problema del entorno; esta propuesta es de arquitectura y no un diagnóstico definitivo del código.
2. Crear la carpeta independiente y el workspace con ambos proyectos.
3. Separar repositorio, conexiones, credenciales y configuración de publicación.
4. Implementar autenticación, modelo de datos y permisos en la nueva versión.
5. Adaptar las funciones y probar con diferentes cuentas, verificando que los datos estén aislados.
6. Publicar únicamente cuando el usuario lo solicite expresamente.

## Recomendación

Desarrollar PLAYLIST MUSICOS como proyecto independiente, empezando con acceso por Google, repertorio privado y sincronización. Mantener PLAYLIST SHOWS como la versión propia de Kalen.

Guardar esta propuesta no autoriza crear la copia, modificar la app actual ni publicar en Netlify u otro entorno.
