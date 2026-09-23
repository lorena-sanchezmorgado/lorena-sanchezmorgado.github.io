# Guía rápida — cómo tocar la web sin liarla

Chuleta para seguir tú sola. Está pensada para leerse de arriba abajo la primera
vez y luego consultarse a saltos.

Las explicaciones largas están **dentro del propio código**, con comentarios.
Los dos sitios donde vas a trabajar el 95% del tiempo son:

- **`js/script.js`** — arriba del todo del array `PROYECTOS` hay un manual entero.
- **`project.html`** — solo el título, la descripción y el footer. La rejilla ya no se escribe a mano.

---

## 0. Antes de nada — arrancar la web en local

Doble clic en **`start-servidor.bat`**. Se abre una ventana negra (no la cierres)
y la web en el navegador, en http://localhost:8790/index.html

Cuando cambies algo y no lo veas, recarga forzando con **Ctrl + Shift + R**.

Para parar, cierra la ventana negra.

---

## 1. Las cuatro páginas

| Archivo | Qué es |
|---|---|
| `index.html` | ARCHIVO — la portada, la pared de trabajos que se arrastra |
| `project.html` | PROYECTOS — la rejilla con los filtros |
| `proyecto.html` | La ficha de un proyecto. **Una sola para todos** |
| `sobremi.html` | SOBRE MÍ |

**No se crean archivos nuevos para cada proyecto.** `proyecto.html` se rellena
sola con los datos de `js/script.js`, según el `?p=` del enlace.

---

## 2. Añadir un proyecto — los 3 pasos

### Paso 1. Preparar las fotos

Las fotos que salen de Illustrator o Photoshop pesan entre 2 y 40 MB. Así la web
va lentísima. Hay un script que las reduce y las renombra solas.

Abre la terminal en VS Code (menú Terminal → Nueva terminal) y escribe, **todo
en una línea**:

```
powershell -ExecutionPolicy Bypass -File scripts\optimizar-imagenes.ps1 -Origen "media\proyectos\Nombre De Tu Carpeta" -Destino "media\proyectos\slug-del-proyecto"
```

- `-Origen` — la carpeta donde tienes las fotos buenas.
- `-Destino` — una carpeta nueva con el nombre en minúsculas, sin acentos ni
  espacios (eso es el «slug»). Ejemplo `media\proyectos\gaia`.

Te deja dentro `web-01.jpg`, `web-02.jpg`, `web-03.jpg`... por orden alfabético.

**Si quieres elegir tú el orden**, en vez de `-Origen` usa `-Archivos` con la
lista, y salen en ese orden:

```
powershell -ExecutionPolicy Bypass -File scripts\optimizar-imagenes.ps1 -Destino "media\proyectos\gaia" -Archivos "media\proyectos\Gaia\Cartel Gaia final.png","media\proyectos\Gaia\Gaia mockup final.png"
```

Otras opciones (van al final, separadas por espacio):
`-Ancho 1600` · `-Calidad 82` · `-Empezar 5` (para seguir numerando sin pisar lo
que ya hay).

> Importante — el nombre de la carpeta de destino tiene que estar en
> `.gitignore` como excepción para que git la guarde. Busca la lista
> `!media/proyectos/…/` al final de `.gitignore` y añade la tuya.

### Paso 2. Escribir el proyecto en `js/script.js`

Busca `const PROYECTOS = [`. Justo encima tienes el manual completo. Copia el
bloque de un proyecto entero (desde `{` hasta `},`), pégalo y cambia los datos.

Lo mínimo que hay que cambiar es `id`, `slug`, `nombre`, `anio`, `disc`, `cat`,
`img`, `destacado`, `intro` y los `bloques`.

### Paso 3. Ya está

**No hay que tocar `project.html`.** La rejilla de miniaturas se construye sola
con la lista `PROYECTOS`, en ese mismo orden — si mueves un proyecto arriba o
abajo en la lista, se mueve también en la rejilla. El contador de
*Seleccionados* también se calcula solo.

Las tarjetas **no van numeradas** (al filtrar saldrían salteadas: 01, 02, 04…).
El rótulo que sale al pasar el ratón es solo el nombre y la categoría.

Y las fotos de los mosaicos aparecen solas en la portada ARCHIVO.

---

## 2 bis. Categoría y «Seleccionados» son dos cosas distintas

Es la duda más fácil de tener, así que aquí va clarito:

| Campo | Qué decide |
|---|---|
| `cat: "marca"` | **en qué apartado** está — Marca, Campaña o Ilustración |
| `destacado: true` | **si sale en tu escaparate**, el botón *Seleccionados* |

- `destacado: true` → sale en *Seleccionados* **y** en su categoría.
- `destacado: false` → **no** sale en *Seleccionados*, pero sí al pinchar su
  categoría. Sigue estando en la web, solo que no en la primera pantalla.

Así eliges qué quieres enseñar primero sin borrar nada. Ahora mismo hay **5**
destacados de 7 — fuera están *Kit Mapilo* y *Four Seasons*. Para cambiarlo,
una sola palabra en `js/script.js`.

---

## 3. Los bloques de contenido de una ficha

Van dentro de `bloques: [ … ]`, **en el orden en que los escribas**. Se pueden
mezclar y repetir todo lo que quieras.

```js
// Un texto
{ t: "texto", html: "<p>Un párrafo.</p><p>Otro párrafo.</p>" },

// Un mosaico — lo normal, dos o tres fotos por fila
{ t: "mosaico", imgs: [
    "media/proyectos/gaia/web-01.jpg",
    "media/proyectos/gaia/web-02.jpg"
]},

// Una foto sola a todo el ancho
{ t: "full", img: "media/proyectos/gaia/web-01.jpg" },
```

Dentro de un texto puedes usar `<strong>negrita</strong>`, `<em>cursiva</em>`,
`<br>` para saltar de línea y `<p>…</p>` para separar párrafos.

Si necesitas escribir comillas dobles dentro del texto, ponles una barra
delante: `\"`.

La ficha técnica del final es un texto normal con la clase `ficha-meta`:

```js
{ t: "texto", html: "<p class=\"ficha-meta\"><strong>Rol</strong> Lo que hiciste.<br><strong>Herramientas</strong> Illustrator · Photoshop.</p>" }
```

### Cómo se reparten las fotos del mosaico

Todas las fotos de una misma fila salen con **el mismo alto** y con el ancho
proporcional a su forma, así llenan el ancho completo y ninguna se recorta ni se
deforma.

| Fotos en el bloque | Cómo salen |
|---|---|
| 2 | una fila de 2 |
| 3 | una fila de 3 |
| 4 | 2 y 2 |
| 5 | 3 y 2 |
| 6 | 3 y 3 |

En el móvil se apilan una debajo de otra.

**Y además el mosaico mira la forma de cada foto**, porque si no las verticales
se quedaban como sellos al lado de una apaisada:

- **Una vertical + dos apaisadas** → la vertical se va a un lado, tan alta como
  las otras dos puestas una encima de la otra. (Si la escribes la primera, se
  pone a la izquierda; si no, a la derecha.)
- **Una foto muy panorámica con verticales** → la panorámica se va sola a su
  fila, a todo el ancho, y las verticales se reparten la fila de al lado. Así
  ninguna queda aplastada.

Los tres números que gobiernan esto están al principio de `js/script.js`:

| Número | Qué hace |
|---|---|
| `CUANTAS_POR_FILA` | cuántas fotos caben por fila según el ancho |
| `ES_VERTICAL` (0.85) | a partir de qué forma una foto se considera vertical |
| `ALTO_MINIMO` (0.34) | fila más baja que esto → se reparte de otra manera |

### Ver las fotos en grande — la galería

Dentro de un proyecto, **pinchando cualquier foto se abre una galería con todas
las fotos de ese proyecto**, empezando por la que has pinchado. Se pasa de una a
otra con **scroll horizontal** (rueda, trackpad o arrastrando en el móvil), con
las flechas de los lados o con las flechas del teclado. Se cierra pinchando
fuera, en CERRAR o con Escape.

El fondo es del color del papel, con la página de detrás desenfocada.

**Y pinchando la foto se amplía todavía más**, para mirar un detalle de cerca.
Entonces se recorre moviendo el ratón (o el dedo) y la rueda sube y baja cuánto
se amplía. Se vuelve al tamaño normal pinchando otra vez. Los topes están en
`js/script.js`, en el módulo de la lupa — `ZOOM_INICIAL` (2.4), `ZOOM_MIN` y
`ZOOM_MAX` (5).

Las fotos se ven más grandes, pero **nunca a pantalla completa ni estiradas por
encima de su tamaño real** — así no se pixelan. Si alguna vez las quieres más
grandes o más pequeñas, los topes están en `css/style.css`, en `.lupa-foto img`:

```css
max-width:  min(100%, 62rem, var(--nat-w, 62rem));   /* 62rem ≈ 990 px */
max-height: min(100%, 72vh,  var(--nat-h, 72vh));    /* 72vh = 72% del alto */
```

`--nat-w` y `--nat-h` son el tamaño original de cada foto, lo pone el JS solo.
Sube el `62rem` o el `72vh` si las quieres más grandes.

Funciona solo, no hay que marcar nada en las fotos.

---

## 4. Cambiar textos que NO son de proyectos

| Qué | Dónde |
|---|---|
| Bio, formación, prácticas, contacto | `sobremi.html` |
| Título y descripción de PROYECTOS | `project.html`, bloque `proy-head` |
| Frase del centro del ARCHIVO | `index.html`, `archivo-center-text` |
| Bio y redes del footer morado | `project.html` y `proyecto.html`, bloque `foot-card` |
| MADRID, SP / 2026 © | al final de cada página, `site-baseline` |

### El texto de SOBRE MÍ

Está en `sobremi.html`, dentro de `<div class="sm-intro">`. **Cada párrafo va en su
propio `<p>…</p>`** (no uses `<br><br>`): así el efecto de lectura puede atenuar
cada párrafo por separado.

Para poner algo en **negrita**, envuélvelo en `<strong>…</strong>`.

```html
<p>Soy Lorena Sánchez, <strong>diseñadora gráfica</strong>. Y esto es normal.</p>
<p>Este es otro párrafo.</p>
```

Los apartados de abajo (EDUCACIÓN, PRÁCTICAS, LOGROS, CONTACTO) son bloques
`<section class="sm-block reveal">` — copia uno entero si quieres añadir otro.
El enlace «Escríbeme» lleva al apartado (CONTACTO).

### Las dos fotos de SOBRE MÍ

Son distintas a propósito:

- **La de la puerta azul** está en `<div class="sm-fixed">` — es la capa que
  **no se mueve** con el scroll, junto con el nombre de la derecha.
- **La de pequeña** está dentro de `<div class="sm-loop">`, la primera de todas
  — es decir, **es una pieza más del texto**: sube contigo al hacer scroll y
  vuelve a salir en cada vuelta del bucle infinito.

Si quieres meter más fotos que acompañen al texto, ponlas ahí dentro, donde
quieras, con `class="sm-photo"`.

**Regla de estilo:** en los textos de la web no se usan dos puntos `:`, se usan
guiones largos `—`.

Si cambias el correo, cámbialo en los **tres** sitios del enlace: el `href`, el
`data-copy` y el texto que se ve.

---

## 5. Cosas de la portada ARCHIVO

En `js/script.js`, busca `ARCHIVO (landing)`. Dentro de `build()` están juntos
todos los números que puedes tocar:

| Número | Qué hace |
|---|---|
| `CUANTAS` (24) | **cuántas fotos salen en total**. Súbelo si la quieres más llena, bájalo si te agobia |
| `ANCHO_PROP` (0.115 – 0.19) | el tamaño de cada imagen, en proporción al ancho de la pantalla |
| `ANCHO_TOPE` (130 – 330 px) | y sus topes en píxeles, para que ni en un móvil salgan diminutas ni en un monitor enorme salgan gigantes |
| `AIRE` (0.05) | el espacio que se deja alrededor del texto del centro. Bájalo y las imágenes se pegan más |
| `LLENADO` (0.76) | lo llena que queda la pared. Bájalo y habrá más sitio vacío entre las fotos |
| `FACTOR_MIN` (1.45 / 1.5) | lo mínimo que mide la pared comparada con la pantalla, para que siempre haya algo que explorar arrastrando |
| `RESERVA_ALTO` (1.05) | el alto que se le supone a cada foto para repartirlas. Más alto = más separadas |
| `ALTO_MAXIMO` (2.0) | lo más alta que puede salir una foto. Solo se usa para que ninguna se meta detrás del título |

- **Qué fotos salen** → **no salen todas** (llenaban demasiado). Sale **al menos
  una de cada proyecto**, elegida **al azar cada vez que se entra**, así que la
  portada nunca es igual dos veces. El resto se completa por turnos entre
  proyectos hasta llegar a `CUANTAS`, y nunca se repite ninguna.
- **Cómo se reparten** → para cada foto se sortean muchas posiciones y se queda
  con la mejor: la que cae más lejos de las demás y sin otra foto del mismo
  proyecto al lado (dos del mismo trabajo se parecen y juntas cantan).
- **Dónde NO se ponen** → en la franja del menú de arriba y en la de
  MADRID, SP / 2026 ©, para que al entrar se lean limpios. Si arrastras sí
  pasan fotos por detrás, y por eso esos rótulos llevan un **halo difuminado**
  de color papel (está en el CSS, busca `HALO`) que los hace legibles encima de
  cualquier imagen. Si lo quieres más marcado, sube los píxeles de los
  desenfoques.
- **El texto del centro** vive **dentro de la pared**, en su centro exacto — al
  arrastrar se queda donde está, con sus imágenes alrededor, en vez de
  seguirte por la pantalla. Lo coloca el JS (`center.style.left/top`).
- **El hueco que se le deja es CUADRADO** y se calcula solo con lo que mide la
  caja del texto. Esa caja es estrecha a propósito (`.archivo-center` en el CSS,
  `width: min(19rem, 70vw)`): así los nombres largos se parten en dos líneas
  —*Four Seasons × / Veuve Clicquot*— y ocupan un bloque cuadrado en vez de una
  línea larguísima. De repartir bien las líneas se encarga `text-wrap: balance`.
- Al pasar el ratón por una pieza, su nombre sale en el texto grande **y** en la
  línea de abajo (*Arrastra para explorar*), que está pegada a la pantalla — así
  se lee siempre, aunque hayas arrastrado lejos del centro.

---

## 5 bis. La miniatura que sigue al cursor

Sale al pasar el ratón por dos sitios:

- la **lista de proyectos** de una ficha → la foto de ese proyecto;
- **LORENA SÁNCHEZ** del menú de arriba, en todas las páginas → tu foto de
  Sobre mí.

Para cambiar esa última foto, en `js/script.js` busca `FOTO_DEL_NOMBRE` (está
justo encima del módulo) y pon otra ruta. El tamaño máximo de la miniatura está
en `css/style.css`, en `.project-preview img`.

En móvil y tableta no aparece: no hay ratón al que seguir.

---

## 6. Colores y tipografías

Están todos juntos al principio de `css/style.css`, en `:root`:

| Variable | Para qué |
|---|---|
| `--tinta` | el morado de textos y del footer |
| `--papel` | el crema del fondo |
| `--gutter` | el margen lateral de todas las páginas |
| `--nav-h` | alto del menú de arriba (lo calcula el JS, no lo toques) |

---

## 7. Guardar los cambios en git

```
git add -A
git commit -m "Lo que has cambiado"
```

---

## 8. Si algo se rompe

- **La ficha sale en blanco** → casi siempre es una coma o una comilla mal
  puesta en `PROYECTOS`. Abre la web, pulsa F12, pestaña *Console*, y el error
  te dice la línea.
- **Una foto no sale** → la ruta está mal escrita. Ojo con mayúsculas, acentos y
  espacios: en las rutas web todo en minúsculas y sin acentos.
- **Cambias algo y no se ve** → Ctrl + Shift + R.
- **Volver atrás del todo** → `git checkout -- .` deshace lo no guardado.
