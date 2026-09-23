# Portfolio Lorena Sánchez — Documento maestro

> Documento de traspaso con TODAS las decisiones y textos acordados.
> Guárdalo junto a la carpeta del proyecto al cambiar de ordenador.
> Última actualización: agosto 2026.

---

## 0. Punto de partida

- El portfolio se construye **adaptando la web de "Peloteo"** (proyecto académico en grupo, ficticio).
- Stack: **HTML + CSS + JavaScript**, con **GSAP, jQuery y Bootstrap** ya cargados.
- Los trabajos de Peloteo eran ficticios → **eliminados** del portfolio.
- Todo el contenido real está en `~/Documents/Trabajos Uni_Lore/` y copiado en `media/proyectos/`.

---

## 1. Quién soy (para textos y contexto)

- **Lorena Sánchez Morgado**, diseñadora gráfica y multimedia, Madrid. Graduada por UDIT (2022–2026).
- Bachillerato de Artes Plásticas, Imagen y Diseño (IES Antonio Machado, Alcalá de Henares).
- Prácticas en **El Corte Inglés**, dpto. de Marca Propia (2024–2025).
- Trabajo desde el **concepto**: cada proyecto parte de una idea que lo sostiene, no de una estética.
- Me muevo entre lo **digital y lo tradicional** (ilustración, pintura, código).

---

## 2. Sistema visual (tokens)

| Token | Valor | Uso |
|---|---|---|
| `--tinta` | `#4D124C` (plum) | textos, rótulos, líneas |
| `--papel` | `#FFFBF5` (crema) | fondo |
| `--tinta-suave` | `rgba(77,18,76,.55)` | metadatos, años, secundario |
| `--linea` | `rgba(77,18,76,.14)` | filetes y bordes |

- **Dos tintas puras.** El color lo ponen las imágenes de los proyectos.
- **Aire generoso**: `--gutter: clamp(1.5rem, 5vw, 4.5rem)` a los lados; mucho espacio arriba/abajo.
- **Tipografía**: Roc Grotesk (la que ya está en el proyecto).
- **Cursor**: punto sólido pequeño (~11px) color tinta, sin `mix-blend-mode`; oculto en táctil.
- **Nav**: un color fijo por página. NO cambia de color al scrollear (se quitó el `mix-blend-mode: difference` de Peloteo).

### Reglas de redacción para la web
- **Nunca usar el signo ":"** en los textos de la web.
- Sobre mí y textos: tono **humano**, no listar "a lo que me dedico".
- Los guiones largos "—" sí valen.

---

## 3. Estructura y navegación

- Nav: **ARCHIVO** · **PROYECTOS** · **SOBRE MÍ** · **LORENA SÁNCHEZ** (a Sobre mí).
- Páginas (cuatro, no hay más):
  - `index.html` → **Archivo** (landing, lienzo de trabajos arrastrable).
  - `project.html` → **Proyectos** (grid + filtros).
  - `proyecto.html` → **Ficha** de proyecto (lista lateral + contenido, por `?p=` y `?cat=`).
  - `sobremi.html` → **Sobre mí** (bio, formación, contacto).
- Se eliminó la página **Work** de Peloteo (el stack 3D en perspectiva daba problemas).

---

## 4. Página Proyectos (`project.html`)

- Titular grande: **"Del concepto al arte final."**
- Descripción corta debajo.
- Filtros (chips): **SELECCIONADOS (6) · MARCA · CAMPAÑA · ILUSTRACIÓN**.
- **Grid** de tarjetas: solo imágenes; el **nombre aparece al hover** (overlay oscuro estilo grid del Archivo).
- Idea futura para "vida": una **tira de Seleccionados que se mueve sola** y se para al pasar el ratón (arriba), con el grid quieto debajo. (De momento el grid es fijo.)

### Los 3 apartados (definitivos)
Pocos y de una palabra (para que quepan en pantalla pequeña):

| Apartado | Qué agrupa |
|---|---|
| **MARCA** | identidad, packaging, producto y app |
| **CAMPAÑA** | dirección de arte y publicidad |
| **ILUSTRACIÓN** | ilustración, cartel, editorial y arte |

- Cada proyecto tiene **un apartado principal**; las demás disciplinas se cuentan dentro de su ficha.
- Los **premios NO son un apartado**: van como **badge** sobre el proyecto ("Ganador", "Finalista", "Seleccionado") + en (LOGROS) de Sobre mí.

---

## 5. Ficha de proyecto (`proyecto.html`)

- **Columna izquierda fija (sticky) = navegador**: lista de los proyectos del apartado del que vienes, con el actual en **negrita**. La cabecera de la lista muestra el apartado `(MARCA)`, `(CAMPAÑA)`… y si entras desde Seleccionados o enlace directo cae a `(SELECCIONADOS)`. Nunca vacía.
- **Columna derecha = contenido**: intro + texto + imágenes con ritmo (1 grande, pares).
- **Dos formatos de ficha**:
  - **Caso de estudio** (destacados): reto, concepto, proceso.
  - **Galería** (el resto): 2–4 líneas de contexto + varias imágenes + zoom.
- **Animación de entrada (una sola vez)**: textos e imágenes entran de transparente + subiendo ~24px, escalonados; con `IntersectionObserver` que deja de observar tras aparecer (no se repite). Respeta `prefers-reduced-motion`.

---

## 6. Sobre mí (`index.html`)

- **Columna izquierda FIJA**: nombre "Lorena Sánchez" + subtítulo + 1–2 fotos.
- **Columna derecha que scrollea**: intro + bloques etiquetados entre paréntesis.
- Flecha "↓" que se desvanece al empezar a bajar.
- El enlace **"Escríbeme"** de la intro baja (ancla `#contacto`) a la sección de contacto.

### Subtítulo (tagline)
`DISEÑADORA, ILUSTRADORA, ARTISTA`
*(la palabra corta al final para que quepa; "ARTISTA" o "CREATIVA" valen)*

### Intro de Sobre mí (texto final)
> Soy Lorena Sánchez, de Madrid. Desde pequeña no he parado de dibujar, pintar e inventar cosas — el arte siempre ha sido mi manera de expresarme y de mirar el mundo. Me considero una persona muy creativa e inquieta, y si algo me define es que me encanta jugar mezclando lo digital y lo tradicional, saltando de la pantalla al papel sin miedo a probar. ¿Te apetece que hablemos? **Escríbeme**.

### Bloques de Sobre mí (contenido)
- **(EDUCACIÓN)** UDIT, Madrid — Diseño, Multimedia y Gráfico / 2022–26 · IES Antonio Machado — Bachillerato Artes Plásticas / 2020–22 · B2 First Cambridge / 2024.
- **(PRÁCTICAS)** El Corte Inglés, Madrid — 6 meses en Marca Propia / 2024–25.
- **(LOGROS)** Puerta de Alcalá — Finalista concurso Ayto. de Madrid / 2025. (Añadir: Ganadora Hotel Thompson 2023; Seleccionada Roski 2024.)
- **(CONTACTO)** ⚠️ CONFIRMAR email y RRSS (ver §11).

---

## 7. Taxonomía de proyectos: destacados y apartados

### Destacados (⭐ = caso de estudio con lista lateral)
1. ⭐ **Compás** (MARCA) — el proyecto estrella (TFG).
2. ⭐ **Hotel Thompson** (MARCA) — badge *Ganador*.
3. **Kit Mapilo** (MARCA) — independiente de Compás; NO mencionar que es versión anterior.
4. ⭐ **Los Únicos de Rodilla** (CAMPAÑA) — *en duda por Lorena, recomendado mantener*.
5. ⭐ **Four Seasons × Veuve Clicquot** (CAMPAÑA).
6. **Puerta de Alcalá** (ILUSTRACIÓN) — badge *Finalista*.
- Candidata: **Cata la lata** (subir el trabajo → posible destacado).

### Fuera del portfolio (confirmado)
- ~~Infinito (vinos)~~, ~~Mapilo como "versión de Compás"~~, ~~KFC~~, ~~Standup / The Very Loreal~~, ~~todo 3D~~, ~~vídeos~~, ~~Peloteo~~ (ficticio).

### Resto de proyectos (Archivo / grid completo, pendientes de montar)
- **Dicho y Echo** (revista del refranero) — ILUSTRACIÓN/editorial. *(A Lorena le gusta mucho.)*
- **Twin Peaks** (revista, EN EQUIPO — añadir "mi rol") — ILUSTRACIÓN.
- **Los Americanos** (exposición de museo, Robert Frank / MOP) — ILUSTRACIÓN/editorial. *(Proyecto potente.)*
- **Yorokobu** — por identificar (solo Dossier.pdf).
- **Pichi** (packaging de cerveza) — MARCA/packaging.
- **Chupa Chups** (ilustración/3D render) — ILUSTRACIÓN.
- **Gaia** (cartel, seleccionado a concurso) — ILUSTRACIÓN.
- **Cuadros / bodegones** (óleos, arte) — ILUSTRACIÓN (etiqueta Arte).
- **SANWI** (app) — MARCA.
- **Cata la lata** — pendiente de subir.

---

## 8. Textos ya redactados de los proyectos

### Compás (destacado, MARCA, 2026)
- **Intro**: Marca, app y kit físico para que cuidarse deje de sentirse como una obligación.
- **El reto**: El bienestar digital se ha convertido en una cuenta de resultados. Pasos, calorías, rachas, porcentajes. Para mucha gente eso no motiva, intimida. El encargo era diseñar una propuesta de bienestar que no midiera a las personas.
- **La investigación**: Pregunté a 74 personas cómo se cuidan. Un 26% reconoce que la barrera no es la edad ni la falta de tiempo, sino el miedo a hacerlo mal. Cuidarse no debería empezar cuando algo ya falla, y esa barrera es emocional, no física.
- **El concepto**: El progreso no se mide, se ve. En lugar de puntuar al usuario, la interfaz se llena de color a medida que aparecen los pequeños gestos del día. La referencia fue *The Obliteration Room* de Yayoi Kusama, donde una sala blanca se transforma por acumulación de puntos.
- **La solución**: Un sistema completo de marca. Identidad construida sobre el punto de color, una app de hábitos breves con progreso visual y sin cifras, un kit físico de juegos para hacer una pausa lejos de la pantalla y una campaña que invita a participar. *Encuentra tu color. Pon tu pegatina.*
- **Rol**: Proyecto individual. Investigación, naming, identidad, UX/UI, packaging y campaña.
- **Herramientas**: Figma · Illustrator · Photoshop. **Contexto**: TFG, UDIT.

### Hotel Thompson (destacado, MARCA, 2023, badge Ganador)
- **Intro**: Propuesta ganadora del concurso de diseño de camiseta para el Thompson Hotel Madrid.
- **Cuerpo**: Camiseta ganadora con los iconos de Madrid en composición circular, como si la ciudad fuera un pequeño planeta visto desde dentro, rematada con *De Madrid al cielo*. Amenity único: una lata de barquillos inspirada en *Más chulo que un ocho*.
- **Rol**: individual — concepto, ilustración, producto y packaging. **Herramientas**: Illustrator · Photoshop.

### Kit Mapilo (MARCA, 2025)
- **Intro**: Un kit de juegos de mesa pensado para hacer una pausa y cuidar la mente lejos de la pantalla.
- **Cuerpo**: Reúne varios juegos sencillos en un sistema de packaging coherente para desconectar sin pantallas.
- **Rol**: individual — concepto, diseño de juegos y packaging.

### Los Únicos de Rodilla (destacado, CAMPAÑA, 2025)
- **Intro**: Una campaña que celebra a quienes no tienen miedo de ser diferentes.
- **Cuerpo**: Rejuvenecer Rodilla y reforzar su propósito social. Insight: lo que nos hace diferentes es lo que nos conecta. Concepto: *Trae algo único. Llévate algo único.* Las tiendas se llenan de objetos fuera de lugar; cada cliente que lleva uno recibe su sándwich y una foto para el Muro de los Únicos.
- **Rol**: individual — concepto, dirección de arte, gráfica y punto de venta.

### Four Seasons × Veuve Clicquot (destacado, CAMPAÑA, 2024)
- **Intro**: Campaña ilustrada de cobranding entre Four Seasons y Veuve Clicquot.
- **Cuerpo**: Une los hoteles Four Seasons con el champagne Veuve Clicquot; cada ilustración capta la esencia del lujo en tres destinos (Riviera Francesa, Nueva York, Marrakech), con lenguaje común y paleta propia por lugar.
- **Rol**: individual — concepto, ilustración y aplicaciones.

### Puerta de Alcalá (ILUSTRACIÓN, 2025, badge Finalista)
- **Intro**: Una camiseta que reinterpreta la Puerta de Alcalá con notas musicales.
- **Cuerpo**: Para el concurso de la Comunidad de Madrid, las notas musicales surgen de unos auriculares formando la puerta, bajo *Vibra con Madrid*. El cable dibuja la palabra Madrid, uniendo música y arquitectura.
- **Rol**: individual — concepto e ilustración. **Reconocimiento**: Finalista, Comunidad de Madrid, 2025.

---

## 9. Arquitectura técnica (cómo está montado)

- **Contenido dirigido por datos**: el array `PROYECTOS` en `js/script.js` contiene, por proyecto: `id, slug, nombre, anio, disc, cat, img (miniatura), badge, intro, bloques[]`.
- `bloques[]` admite tres tipos: `{t:"texto", html}`, `{t:"full", img}`, `{t:"par", imgs:[a,b]}`.
- `proyecto.html` tiene un `<div class="ficha-body"></div>` que **el JS rellena** según `?p=` y `?cat=`. Funciona también en `file://` (sin servidor).
- La lista lateral y el filtro leen del mismo array. `CAT_NOMBRES` mapea las etiquetas.
- `window.initReveals(scope)` aplica la animación de entrada (una vez) y se llama tras inyectar la ficha.
- **CSS nuevo** al final de `css/style.css`: `.ficha-body`, `.fb-text`, `.fb-full`, `.fb-pair`, `.ficha-lead`, `.ficha-meta`, `.ficha-badge`, `.sm-link`.

### Extraer imágenes de un PDF (cuando un proyecto solo tiene PDF)
Herramientas disponibles (Homebrew): `pdftoppm`, `pdfinfo`.
```bash
# extraer la página N de un PDF como JPG a ~1600px
pdftoppm -jpeg -scale-to 1600 -f N -l N "presentacion.pdf" salida
# genera salida-N.jpg
```

### Imágenes por proyecto — convención de carpetas
```
media/proyectos/<slug>/
   web-portada.jpg   → miniatura del grid
   web-01.jpg ...    → imágenes de la ficha
```
Carpetas limpias ya creadas: `compas/`, `thompson/`, `four-seasons/`, `los-unicos/`, `mapilo/`, `puerta-alcala/`.
(Las carpetas originales con espacios/acentos —"Hotel Thompson", "Los Únicos de Rodilla"…— se dejan como fuente; para la web se copian a slugs limpios ASCII.)

---

## 10. Estado actual

### Hecho
- Peloteo eliminado (fragmentos `projects/project-0X.html` borrados y referencias limpias).
- Sistema data-driven montado y verificado en local.
- **Compás**: ficha completa (6 imágenes extraídas + textos).
- **Thompson, Mapilo, Los Únicos, Four Seasons, Puerta de Alcalá**: texto de ficha + 1 imagen de portada.
- Grid con los 6 destacados + filtros. Ficha con navegador lateral contextual.
- Sobre mí: intro nueva + ancla a contacto.

### Pendiente
- Más **imágenes** para los 5 destacados no-Compás (ahora tienen 1).
- Cambiar la **miniatura de Los Únicos** (ahora es la portada del PDF, con texto).
- Montar el **resto de proyectos** (§7) en grid/archivo.
- Rehacer la página **Archivo**.
- Cursor a 11px plum (si aún está el de Peloteo).

---

## 11. Por confirmar (Lorena)
1. **Contacto**: en `index.html` pone `lorena.sanchez25@gmail.com` + IG `@lore.shz`. En documentos antiguos era `lorena.sanchezmorgado25@gmail.com` + `@loreshz_`. ¿Cuál es el bueno?
2. ¿Se mantiene **Los Únicos** como destacado? (recomendado sí, si no CAMPAÑA se queda con un solo proyecto).
3. Identificar **Yorokobu** y **Pichi** (qué son) y subir **Cata la lata**.
4. Rol real en **Twin Peaks** (proyecto en equipo).

---

## 12. Cómo previsualizar en local
```bash
cd ~/Documents/PORTFOLIO-Lore
python3 -m http.server 8123
# abrir http://localhost:8123
```
(Necesario servidor porque las fichas se construyen con JS; abrir el .html a pelo también funciona, pero el servidor evita restricciones.)
