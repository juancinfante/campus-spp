# Aula — LMS simple (Fase 2: proyecto + autenticación)

## Poner en marcha

1. `npm install`
2. Copiá `.env.local.example` a `.env.local` y completá con los datos de tu
   proyecto de Supabase (Project Settings → API Keys).
3. Si todavía no corriste el esquema de la Fase 1, pegalo en el SQL Editor
   de Supabase antes de probar el registro (el trigger `handle_new_user`
   depende de la tabla `profiles`).
4. `npm run dev` y abrí http://localhost:3000

## Qué incluye esta fase

- Cliente de Supabase para Server Components, Client Components y
  Middleware (`src/lib/supabase/*`), usando `@supabase/ssr`.
- Middleware que refresca la sesión y protege rutas: sin sesión te manda
  a `/login`; con sesión, `/login` y `/register` te mandan a `/`.
- `/register`: alta con selector de rol (Estudiante / Profesor). El rol
  viaja en `user_metadata` y el trigger de la Fase 1 crea el `profile`
  automáticamente.
- `/login`: inicio de sesión con email y contraseña.
- `/auth/callback`: intercambia el código de confirmación de email por
  una sesión (necesario si tenés "Confirm email" activado en Supabase).
- `/`: placeholder que confirma que la sesión y el rol funcionan, con
  botón de cerrar sesión. Home / Cursos / Notas reales llegan en la
  Fase 3.

## Fase 3 — Home, Cursos y Notas

- Reorganicé las páginas protegidas dentro de un route group `(app)`
  con un layout compartido (`AppShell`): header con Home / Cursos /
  Notas, nombre y rol del usuario, botón de salir.
- **Home**: dashboard distinto por rol — el profesor ve sus cursos con
  cantidad de inscriptos; el estudiante ve los cursos en los que está
  inscripto.
- **Cursos** (`/cursos`): catálogo. `/cursos/[slug]`: detalle con
  clases, recursos descargables (URLs firmadas de Supabase Storage) y
  exámenes — todo oculto hasta que el estudiante se inscribe (RLS de
  la Fase 1) o si sos el profesor dueño.
- **Examen** (`/cursos/[slug]/examenes/[quizId]`): formulario multiple
  choice que entrega vía `submit_quiz_attempt()` (la función RPC de la
  Fase 1) — el cliente nunca ve cuál opción es la correcta.
- **Notas** (`/notas`): el estudiante ve sus exámenes rendidos y sus
  apuntes personales (puede agregar); el profesor elige un curso y ve,
  por alumno inscripto, el puntaje de cada examen que rindió. No hay
  carga manual de notas — el puntaje sale siempre del examen corregido
  por `submit_quiz_attempt()`.
- Corré `schema.sql` de nuevo (agregué el bucket de Storage y sus
  policies al final — es idempotente, no rompe nada si ya lo habías
  corrido antes) y después `seed.sql` para tener un curso de prueba
  con el que navegar todo esto sin esperar al panel del profesor.

## Fase 4 — Panel del profesor

No hizo falta tocar el esquema: la RLS de la Fase 1 ya dejaba todo
listo para que el profesor escriba en sus propios cursos.

- **Crear curso** (`/cursos/nuevo`) y **editar/publicar/borrar**
  (`/cursos/[slug]/editar`) — el slug se genera solo desde el título,
  con reintento si ya existe.
- Desde el propio detalle del curso (`/cursos/[slug]`), si sos el
  dueño, cada clase se muestra como un formulario editable con botón
  de eliminar, con un mini formulario de subida de archivos debajo
  (sube a Storage y crea la fila en `lesson_resources` en la misma
  acción). Al final hay un formulario para agregar una clase nueva.
- Los exámenes se editan igual (título, descripción, % para aprobar,
  intentos máximos, fecha límite) desde esa misma página.
- **Preguntas del examen** (`/cursos/[slug]/examenes/[quizId]/editar`):
  usa `get_quiz_with_answers()` (la función RPC de la Fase 1) para
  poder ver cuál opción está marcada como correcta — es la única forma
  de leerlo, porque esa columna sigue bloqueada para SELECT directo.
  Se pueden agregar preguntas (2 a 6 opciones, marcando la correcta) y
  eliminarlas; no hay edición en línea de una pregunta ya cargada
  todavía — para corregir un typo, se elimina y se vuelve a cargar.
- Los borrados con impacto (curso, clase, examen) piden confirmación
  con un `window.confirm()` antes de disparar la acción.

## Última iteración — Calificaciones, Clase única y Documentos

**"Notas" pasó a llamarse "Calificaciones" y se rediseñó para el
profesor:**
- `/calificaciones`: una card por examen (de todas tus clases), con
  cantidad de intentos y fecha de vencimiento.
- `/calificaciones/[quizId]`: los alumnos que lo rindieron, paginados
  de a 10, con buscador por nombre y apellido (`?q=...&page=...`).
- Botón "Descargar Excel" (`/calificaciones/[quizId]/export`) que arma
  un .xlsx con **todas** las notas de ese examen (no solo la página
  visible), usando `exceljs`.
- El estudiante sigue viendo sus exámenes rendidos ahí mismo, solo
  cambió el nombre de la sección (los apuntes personales se sacaron
  después, ver más abajo).

**Se eliminó el nivel "Curso > Clases" y quedó un solo nivel, "Clase":**
- Lo que antes era "Curso" ahora se llama "Clase" en toda la interfaz
  (nav, botones, mensajes). Por dentro las rutas siguen siendo
  `/cursos/...` y la tabla se sigue llamando `courses` — cambiar eso
  implicaba tocar decenas de archivos sin ningún beneficio real para
  vos, así que lo dejé como está pero invisible.
- Las tablas `lessons` y `lesson_resources` (el viejo sub-nivel) NO se
  borraron de la base, simplemente la app dejó de usarlas. Si tenías
  algo cargado ahí y ya no lo necesitás, decime y las elimino del
  esquema.
- **Documentos y material didáctico**: ahora se sube directo sobre la
  Clase (no por lección), y se pueden seleccionar varios archivos a la
  vez en un solo click. Nueva tabla `course_resources` + policies de
  Storage para el path `{course_id}/archivo` (agregadas al final de
  `schema.sql` — volvé a correrlo).

## Última iteración — Editor de texto enriquecido y sin apuntes

- La descripción de la Clase (al crearla o editarla) ahora es un
  editor de texto enriquecido (TipTap): negrita, cursiva, títulos,
  listas, cita y enlaces. Guarda HTML en la misma columna
  `description` de siempre (no hizo falta tocar el esquema).
- **Sanitización server-side**: aunque el editor solo puede generar
  HTML "seguro" por como está armado, igual sanitizo el HTML en el
  servidor antes de guardarlo (`sanitize-html`, allowlist de tags) —
  un actor malicioso podría mandarle cualquier string al server action
  sin pasar por el editor, así que nunca hay que confiar en el HTML
  que llega del cliente. Se ve en `src/lib/sanitize.ts`.
- En las cards (listado de clases, Home) la descripción se muestra
  como texto plano (le saco las etiquetas) para que no se vea HTML
  crudo en una preview de dos líneas; en el detalle de la clase se
  muestra formateada.
- Saqué "Mis apuntes" de Calificaciones — la tabla `student_notes`
  sigue en la base por si la necesitás después, pero ninguna pantalla
  la usa.

## Última iteración — Landing pública, sin autorregistro, marca institucional

Contexto: el campus es para personal del Servicio Penitenciario
Provincial, así que el alta de usuarios la maneja la institución, no
cada persona por su cuenta.

- **Se sacó el autorregistro.** `/register` no existe más — ni la
  página, ni el server action `signUp`, ni el link desde el login.
  Los usuarios se crean por fuera de la app (dashboard de Supabase o
  un script propio contra la Admin API); el trigger `handle_new_user`
  de la Fase 1 sigue funcionando igual apenas ese usuario se crea en
  `auth.users`, siempre que le pases `full_name` y `role` en el
  `user_metadata`.
- **`/` ahora es una landing pública** (navbar + hero + dos cards:
  "Ingresá al campus" y una que explica que el usuario/contraseña
  llega por email institucional). Si entrás ya logueado, te manda
  directo a `/inicio` sin mostrarte la landing de nuevo.
- El dashboard autenticado que antes vivía en `/` se movió a
  `/inicio` — así `/` queda libre para la landing pública. Actualicé
  el middleware, el nav, y todos los `redirect`/`revalidatePath` que
  apuntaban a `/`.
- **Marca centralizada** en `src/lib/brand.ts` (`BRAND_NAME`,
  `BRAND_FULL`, `BRAND_TAGLINE`) — cambiá el nombre real de la
  institución ahí y se actualiza en toda la app (login, navbar,
  metadata de la pestaña).
- El hero de la landing usa un panel placeholder (ícono + patrón
  geométrico) en vez de una foto real — está comentado en
  `HeroGraphic.tsx` cómo reemplazarlo por una `<Image>` real cuando
  tengas una foto institucional.

## Recomendaciones para seguir sumando (contexto: capacitación de personal, no una escuela)

Dado que esto es capacitación obligatoria de personal más que un aula
tradicional, estas son las que más valor le darían, en orden:

1. **Certificado de finalización** — un PDF automático cuando el
   agente completa la clase (documentos vistos + examen aprobado).
   Para personal de un organismo público esto suele ser necesario
   como constancia, no solo un lindo detalle.
2. **Reporte de cumplimiento para el área de capacitación** — una
   vista para vos (no para cada profesor) con el estado de todo el
   personal: quién completó qué clase y cuándo, para poder rendir
   cuentas de la capacitación sin entrar clase por clase.
3. **Progreso dentro de la clase** — marcar documentos como "vistos",
   con una barra de %. Hoy no hay forma de saber si alguien entró y
   miró el material antes de rendir.
4. **Notificaciones por email** — aviso cuando se asigna una clase
   nueva o un examen está por vencer. Ahora mismo el agente tiene que
   entrar a mirar si hay algo nuevo.
5. **Entregas de trabajos** (no solo examen multiple choice) — el
   agente sube un archivo, alguien lo corrige con nota y comentario.

Un poco más abajo en la lista pero también útiles: fecha de alta
"inactivo" para personal que se da de baja del organismo, y un registro
de auditoría simple (quién entró y cuándo) — algo que en un contexto
institucional como este suele pedirse tarde o temprano.

## Última iteración — Material/Exámenes separados, exámenes cronometrados, color

- **La clase ya no mezcla todo en una sola pantalla.** `/cursos/[slug]`
  ahora es solo el encabezado + dos cards: **Material**
  (`/cursos/[slug]/material`) y **Exámenes**
  (`/cursos/[slug]/examenes`), cada una en su propia página.
- **Exámenes con tiempo límite (opcional).** Al crear o editar un
  examen podés poner minutos; si lo dejás vacío, el examen queda sin
  límite de tiempo, como antes. Cuando tiene límite:
  - Aparece un cronómetro visible arriba del formulario.
  - **Sobrevive a un F5**: el intento se crea en la base apenas el
    alumno abre el examen (`started_at` guardado), así que si recarga
    la página el tiempo restante se recalcula desde ese momento real,
    no se reinicia. Esto lo resuelve la función
    `get_or_start_quiz_attempt()`, nueva en el esquema.
  - Si se acaba el tiempo, el intento queda **'expired'** y se pierde
    — no se guarda ninguna respuesta parcial. `submit_quiz_attempt()`
    revalida el tiempo del lado del servidor igual, así que aunque
    alguien manipule el cronómetro del navegador no puede colar una
    entrega vencida.
- **Justificación opcional por pregunta.** Otro toggle independiente
  al crear/editar el examen: si lo activás, cada pregunta muestra un
  textarea opcional para que el alumno desarrolle su respuesta además
  de elegir la opción. Se guarda en `quiz_answers.justification` y el
  profesor la ve en el nuevo link "Ver respuestas" de cada intento en
  Calificaciones (junto con qué opción eligió y cuál era la correcta).
- **Colores**: el fondo de página se corrió un poco más oscuro
  (`--color-paper`). Dejé toda la paleta documentada arriba de
  `@theme` en `src/app/globals.css` — es el único lugar donde hay que
  tocar hex para cambiar cualquier color de toda la app, con una nota
  de qué controla cada variable.

## Última iteración — Aviso al salir de un examen cronometrado, exámenes como cards

- **Exámenes ahora son cards**, igual que Material — `/cursos/[slug]/examenes`
  ya no tiene formularios de edición metidos en la lista. Al profesor
  cada card lo lleva a `/cursos/[slug]/examenes/[id]/editar`, que ahora
  junta en una sola página nombre, descripción, configuración
  (tiempo, intentos, vencimiento, justificación) **y** las preguntas —
  antes eso estaba repartido entre la lista y una página aparte.
  Crear un examen nuevo también se movió a su propia página
  (`/examenes/nuevo`), y al guardarlo te manda directo a cargar las
  preguntas.
- **Aviso al intentar salir de un examen cronometrado.** Mientras hay
  un examen con tiempo límite en curso:
  - Click en cualquier link (incluido el nav de arriba) o el botón
    atrás del navegador → te pregunta si querés salir. Si confirmás,
    se entrega el examen con lo que ya respondiste (lo que no
    contestaste queda sin opción elegida, no afecta el puntaje de las
    que sí) y recién ahí navega.
  - Cerrar la pestaña o escribir otra URL también te avisa
    (`beforeunload`), pero ahí soy honesto con una limitación real de
    los navegadores: no hay forma de garantizar al 100% que la entrega
    async se complete antes de que la pestaña se cierre de verdad. El
    aviso siempre aparece; la entrega en ese caso puntual es "mejor
    esfuerzo", no garantizada. Salir por link o por atrás sí entrega
    siempre, porque ahí la página sigue viva mientras se manda la
    entrega.
  - Esto es aparte de que se acabe el tiempo solo (que sigue
    perdiéndose el intento sin guardar nada, como pediste antes) — acá
    hablamos de alguien que se quiere ir *antes* de que se acabe el
    tiempo.

## Última iteración — Sidebar, Documentación general y Home tipo foro de noticias

Un poco de estilo Moodle, como pediste: navegación fija a la
izquierda en vez de arriba, y una home con anuncios en vez de solo un
listado de clases.

- **Sidebar** (`src/components/layout/Sidebar.tsx`) con Inicio, Clases,
  Documentación y Calificaciones. En mobile se convierte en un cajón
  que se abre con el botón de arriba (`AppShellChrome.tsx` maneja ese
  estado). Saqué el nav de arriba que había antes.
- **Documentación** (`/documentacion`, nueva): material general para
  todo el personal, sin ligar a ninguna clase — mismo patrón que
  Material dentro de una clase (subir varios archivos, descargar,
  borrar), pero a nivel campus. Tabla nueva `general_documents` +
  bucket de Storage `general-documents`. Cualquier profesor puede
  subir y borrar cualquier documento (es contenido institucional
  compartido, no de un dueño único).
- **Home estilo foro de noticias**: arriba, cards con los anuncios
  publicados (cualquier profesor puede publicar y borrar cualquiera,
  mismo criterio que Documentación); el contenido usa el mismo editor
  de texto enriquecido de las clases. Abajo sigue "Tus clases", como
  antes.

Ninguno de estos cambios rompe lo que ya tenías — son todas tablas y
policies nuevas, agregadas al final de `schema.sql`. Volvé a correrlo
antes de probar.

## Última iteración — Imágenes/video en clases, cards con portada, imagen en vez de patrón, rol admin

- **Imágenes dentro del editor de texto**: sumé `@tiptap/extension-image`
  y un botón nuevo en la barra de herramientas del editor — sirve
  tanto para la descripción de una clase como para las noticias (ver
  más abajo). Subir una imagen desde ahí la sube al bucket público
  `editor-media` y la inserta en el texto.
- **Galería de imágenes/video por clase**: sección nueva en la página
  de cada clase, entre la descripción y las cards de Material/Exámenes
  (que quedaron intactas, como pediste). Se pueden subir varios
  archivos mezclados (imagen o video, se detecta solo) de una vez.
  Tabla nueva `course_media`.
  **Importante sobre privacidad**: a diferencia de Material (privado,
  solo inscriptos, URLs firmadas), la galería y las imágenes del editor
  son **públicas** — mismo nivel que la descripción de la clase, que ya
  se mostraba a cualquiera aunque no estuviera inscripto. Quien tenga
  el link puede verlas, esté logueado o no. Lo hice así a propósito
  para no reinventar el sistema de URLs firmadas para contenido de
  "portada" — pero avisame si en realidad querías que la galería
  también quedara restringida a inscriptos, y lo cambio.
- **Cards de clase con portada** en `/inicio`: reemplacé el texto
  suelto por una card con una banda superior con el ícono de gorrito de
  graduación y el nombre debajo (`inicio/clase-card.tsx`).
- **Imagen en vez del patrón cuadriculado**: tanto el panel de login
  como el de la landing pública ahora muestran una imagen real
  (`public/auth-hero.svg`) en vez del patrón de líneas/rombos de antes.
  Como no tengo forma de generar una foto real, armé un degradé suave
  con los mismos colores de la marca — para poner tu propia foto
  institucional, reemplazá ese archivo por un .jpg/.png con el mismo
  nombre (o cambiá el `src` en `AuthShell.tsx` y
  `components/landing/HeroGraphic.tsx`).
- **Rol admin**: nuevo valor en el enum `user_role`. Las noticias del
  Home ahora son *solo* del admin — un profesor común ya no ve el
  formulario de publicar ni el botón de eliminar. El admin usa el
  mismo editor de texto enriquecido (con imágenes) que las clases.
  Alcance a propósito acotado: el admin por ahora solo tiene permisos
  especiales sobre noticias, no sobre el resto de la plataforma —
  "puede editar/eliminar todo" lo interpreté como "toda noticia", no
  como superusuario de toda la app. Si querés que el admin también
  pueda gestionar Documentación, clases ajenas, etc., decímelo y lo
  sumo.
  **Para crear la cuenta admin**: como ya no hay autorregistro, la
  creás vos mismo (dashboard de Supabase o tu script) igual que
  cualquier otro usuario, pero con `role: "admin"` en el
  `user_metadata` en vez de `"teacher"` o `"student"`.

## Pendiente / cosas a mejorar más adelante

- Edición en línea de preguntas/opciones existentes (hoy es
  eliminar + recrear).
- Reordenar documentos y preguntas (hoy el orden es el de carga).
- El formulario de "Agregar pregunta" no se limpia solo después de
  guardar — hay que borrar los campos a mano antes de cargar la
  siguiente.
#   c a m p u s - s p p  
 #   c a m p u s - s p p  
 