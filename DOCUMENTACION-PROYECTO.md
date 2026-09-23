# Portfolio Lorena Sánchez — Documentación del proyecto

> Documento de traspaso. Recoge TODO lo hecho en la adaptación del proyecto de clase
> **"Peloteo"** al **portfolio personal de Lorena Sánchez**, cómo funciona cada cosa y
> qué queda pendiente. Última actualización: 2026.

---

## 0. Cómo arrancar el proyecto (importante)

Es una web **estática** (HTML + CSS + JS). NO se puede abrir con doble clic (`file://`),
porque los `partials`/rutas no cargan bien. Hay que servirla con un servidor local.

Desde la carpeta del proyecto, en la terminal:

```bash
python3 -m http.server 8790
```

Y abrir en el navegador: **http://localhost:8790/index.html**

> ⚠️ **Caché**: el servidor de Python cachea CSS/JS. Si haces un cambio y no lo ves,
> recarga con **Cmd + Shift + R** (recarga forzada, ignora la caché).

---

## 1. Qué es este proyecto

- Web original: **"Peloteo"**, proyecto de clase hecho con Claudia Buezas y Laura Lázaro.
- Objetivo: convertirla en el **portfolio personal de Lorena Sánchez** (diseñadora
  gráfica y multimedia, Madrid), reutilizando la base técnica.
- Marca del portfolio = su **nombre real** (Lorena Sánchez), no "Peloteo".
- Se trabaja **por fases**, confirmando antes de reescribir.

### Carpetas
- **Raíz del proyecto** = versión de trabajo (la buena, ya consolidada).
- `_backup-original/` = copia original intacta de Peloteo. **NO TOCAR** (es la referencia).
- `PORTFOLIO-sin grill de archive/` = carpeta de mejoras propias de Lorena (se conservó,
  no se edita).

---

## 2. Sistema visual (paleta y tipografía)

Definido en `css/style.css` dentro de `:root`. Idea: **tinta morada sobre papel crema.**

| Token | Valor | Uso |
|-------|-------|-----|
| `--tinta` | `#4D124C` | Morado. TODO el texto, iconos, flechas, nav, bordes |
| `--papel` | `#FFFBF5` | Crema. TODOS los fondos |
| `--tinta-suave` | `rgba(77,18,76,.55)` | Texto secundario |
| `--linea` | `rgba(77,18,76,.14)` | Líneas/separadores |
| `--gutter` | `clamp(1.5rem,5vw,4.5rem)` | Margen lateral común |
| `--fmenu` | `clamp(16rem,28vw,24rem)` | Ancho de la columna fija de la ficha |

También se **remapearon** los tokens antiguos de Peloteo para que todo herede la paleta nueva:
`--green`, `--red`, `--white`, `--black` → apuntan a tinta/papel.

- **Tipografías**: se mantienen las **Roc Grotesk** (regular, wide-medium, bold) del original.
- `body`: fondo `--papel`, color `--tinta` (con `!important`).

---

## 3. Estructura de la web

Navbar (en TODAS las páginas, para consistencia):
- Enlaces a la izquierda: **SOBRE MÍ** · **PROYECTOS** (el activo va subrayado).
- **LORENA SÁNCHEZ** a la derecha → es solo **texto, NO es un enlace** (para ir a la
  página de información hay que pulsar "SOBRE MÍ").

Páginas:
1. **`index.html`** = **SOBRE MÍ** (página de inicio).
2. **`project.html`** = **PROYECTOS** (rejilla de trabajos + filtros).
3. **`proyecto.html`** = **FICHA** (interior de un proyecto).
4. Se **eliminó** la página Work (stack 3D) y `about.html`. La antigua ARCHIVE pasó a ser PROYECTOS.

---

## 4. Página SOBRE MÍ (`index.html`)

**Composición fija** (`.sm-fixed`, no se mueve al hacer scroll en escritorio):
- **Izquierda**: dos fotos con los tops alineados, distinta altura, sin deformar:
  - `lorena-puerta-azul.jpeg` (vertical, más grande, `height:52vh`)
  - `lorena-pequena.jpeg` (horizontal, más baja, `height:30vh`)
- **Derecha arriba**: nombre-subtítulo **"DISEÑADORA, CREATIVA, ARTISTA"**
  (`.sm-name` / `.sm-name-2`), **siempre alineado a la derecha**, debajo del navbar,
  por encima de las fotos, con aire al borde. (Antes se rompía en pantallas medias
  porque el `max-width` usaba `vh`; se cambió a `min(52vw, 40rem)`.)

**Texto** (`.sm-text`, scrollea, alineado bajo la foto pequeña):
- `.sm-intro` = descripción/presentación (PLACEHOLDER, pendiente el texto real de Lorena).
- Bloques `.sm-block .reveal` (aparecen al hacer scroll con IntersectionObserver, una vez,
  respetando `prefers-reduced-motion`). **Espaciado**: los apartados van pegados entre sí
  (`gap: 2.2rem`) y solo la descripción queda separada del resto (`.sm-intro margin-bottom: 7rem`).
- **Flecha ↓** centrada (`.sobremi-arrow`), desaparece al empezar a bajar (`body.is-scrolled`).

### Textos reales ya metidos en SOBRE MÍ

**(EDUCACIÓN)**
- → UDIT, Madrid — Graduada en Diseño, Multimedia y Gráfico / 2022-26
- → IES Antonio Machado, Alcalá de Henares — Graduada en Bachillerato en la modalidad de
  Artes Plásticas, Imagen y Diseño / 2020-22
- → B2 First Cambridge / 2024

**(PRÁCTICAS)**
- → El Corte Inglés, Madrid — Seis meses de prácticas en el departamento de Marca Propia
  de «El Corte Inglés» / 2024-25

**(LOGROS)**
- → Puerta de Alcalá — Finalista en el concurso de diseño organizado por el Ayuntamiento
  de Madrid / 2025

**(CONTACTO)**
- Email — lorena.sanchez25@gmail.com
- Instagram — @lore.shz
- LinkedIn — Lorena Sánchez

> ⚠️ **Conflicto de contacto a confirmar**: `TEXTOS-WEB.md` tenía otros valores
> (`lorena.sanchezmorgado25@gmail.com` / `@loreshz_`). Ahora mismo se usan
> `lorena.sanchez25@gmail.com` / `@lore.shz`. **Confirmar cuáles son los buenos.**

---

## 5. Página PROYECTOS (`project.html`)

- Título grande a la izquierda: **"Del concepto al arte final."**
- Descripción a la derecha (PLACEHOLDER lorem, pendiente texto real).
- **Fila de filtros** (`.proy-filter`), **todo alineado a la izquierda**:
  **SELECCIONADOS (nº)** + MARCA / CAMPAÑA / ILUSTRACIÓN. El activo va opaco, los demás al 50%.
- **Rejilla** (`.proy-grid`) reutilizando el hover con overlay de texto del archive de Peloteo.
  - Columnas **progresivas 4 → 3 → 2 → 1** (para que las imágenes nunca queden minúsculas):
    - `>1180px` → 4 · `≤1180` → 3 · `≤820` → 2 · `≤520` → 1
- Cada tarjeta enlaza a `proyecto.html?p=N&cat=X`, donde `cat` es el filtro activo desde
  el que se entra (así la ficha muestra el apartado correcto).

---

## 6. Página FICHA (`proyecto.html`)

Interior de un proyecto.
- **Barra superior fija** (`.ficha-top`): **"(CATEGORÍA)"** a la izquierda + **VOLVER**
  (subrayado) a la derecha.
- **Columna izquierda fija** (`.ficha-menu`): lista de proyectos del apartado del que vienes,
  el actual en **negrita**.
- **Columna derecha** (`.ficha-content`): descripción + imágenes con ritmo. Es la que scrollea.
- **La categoría y la lista dependen de dónde vienes** (parámetro `?cat=`):
  - Desde SELECCIONADOS → cabecera "(SELECCIONADOS)" y salen **todos** los proyectos.
  - Desde CAMPAÑA → "(CAMPAÑA)" y salen **solo** los de campaña. Igual para MARCA/ILUSTRACIÓN.
- **Preview al pasar el ratón** por un proyecto de la lista: aparece una foto que sigue al
  cursor (efecto de Peloteo, `.project-preview`).
- **Responsive (≤900px)**: la columna fija de la izquierda **se oculta** y el **nombre del
  proyecto (izquierda) + la fecha (derecha)** aparecen arriba en la columna de contenido
  (`.ficha-title`, se rellena por JS desde el proyecto actual).

---

## 7. Menú responsive (tipo Peloteo)

Cuando la pantalla se hace pequeña (**≤1100px**) el navbar se colapsa:
- Los enlaces inline se ocultan.
- Aparece el botón **MENÚ** a la **izquierda** (subrayado, tamaño 1.9rem igual que los
  enlaces del nav). LORENA SÁNCHEZ queda a la derecha.
- Al pulsar MENÚ se abre un **overlay a pantalla completa morado** (`.nav-menu`), igual
  que Peloteo pero en morado en vez de rojo:
  - Enlaces en **cajas con borde**, todas del **mismo tamaño**, centradas horizontal y
    verticalmente.
  - El apartado **activo** sale relleno (fondo crema, texto morado).
  - **Hover**: un ítem normal se rellena; el ítem **activo se invierte** (se vacía) al pasar
    el ratón, para que se note que lo estás seleccionando.
  - Botón **CERRAR** arriba a la izquierda (mismo tamaño que MENÚ y subrayado).
- Se cierra con CERRAR, al pulsar un enlace, o con la tecla Escape.

---

## 8. Footer (MADRID, SP / 2026 ©)

- **SOBRE MÍ (escritorio)**: footer **fijo** abajo del todo.
- **SOBRE MÍ (móvil ≤900px)**: como las fotos se apilan arriba, el footer **deja de ser
  fijo** y baja al final del contenido (scroll para verlo). No tapa nada.
- **PROYECTOS y FICHA**: footer con patrón "sticky footer" (`margin-top:auto`): si el
  contenido cabe, se clava abajo **sin** poder hacer scroll; si no cabe, se coloca tras las
  imágenes con un hueco y se ve haciendo scroll. Nunca se solapa con las imágenes ni se recorta.

---

## 9. Cursor personalizado (efecto Peloteo)

- Círculo de **24px** (`.cursor-ball`), movido con GSAP (`js/cursor.js`), oculto en táctil.
- Está **SIEMPRE en modo inversión**: `background: var(--papel); mix-blend-mode: difference;`
  - Sobre fondo claro se ve **oscuro/negro**.
  - Sobre fondo morado se ve claro.
  - Sobre texto e imágenes **invierte los colores** (efecto Peloteo).
- Es un único estado fijo (sin cambiar de color según lo que hay debajo) **a propósito**:
  antes cambiaba de estado y producía un parpadeo/"glitch" que no gustaba. Al estar siempre
  igual, no hay glitch y aun así invierte todo lo que tiene debajo (incluido MADRID, el
  nombre, etc.).

> Nota: con `mix-blend-mode` el fondo bajo el círculo, sobre crema, sale casi negro (no un
> morado puro). Es lo máximo que permite la técnica de inversión.

---

## 10. Archivos principales

| Archivo | Qué es |
|---------|--------|
| `index.html` | Página SOBRE MÍ |
| `project.html` | Página PROYECTOS (rejilla + filtros) |
| `proyecto.html` | Página FICHA (interior de proyecto) |
| `css/style.css` | Hoja de estilos principal (paleta, nav, menú, sobremí, proyectos, ficha, footer, cursor) |
| `js/script.js` | Lógica: reveal on scroll, menú móvil, filtros de PROYECTOS, construcción de la ficha, preview |
| `js/cursor.js` | Movimiento del cursor (bola siempre en modo inversión) |
| `media/img/` | Imágenes (fotos de Lorena + imágenes placeholder de Peloteo) |
| `media/icon/icono-l.jpg` | Favicon (la "L" morada) |
| `TEXTOS-WEB.md` | Textos de referencia (⚠️ NO fiarse del todo, Lorena hace cambios) |
| `_backup-original/` | Copia original intacta — NO TOCAR |

### Datos de proyectos (en `js/script.js`)
Hay un array `PROYECTOS` con la estructura de cada trabajo. **Es placeholder** y de ahí se
construye todo (rejilla, ficha, lista, categorías). Estructura de cada objeto:

```js
{ id: 1, nombre: "Nombre proyecto", anio: "2025",
  disc: "Illustration, Animation, Art Direction",
  cat: "marca",           // marca | campana | ilustracion
  img: "media/img/fello10.jpeg" }
```

Mapa de nombres de categoría (`CAT_NOMBRES`): seleccionados → SELECCIONADOS,
marca → MARCA, campana → CAMPAÑA, ilustracion → ILUSTRACIÓN.

---

## 11. LO QUE QUEDA PENDIENTE (contenido real)

Todo esto sigue con **placeholder** (imágenes de Peloteo, "Nombre proyecto", lorem):

1. **Texto de presentación** de SOBRE MÍ (`.sm-intro` en `index.html`).
2. **Texto descriptivo** de la página PROYECTOS (lorem en `.proy-desc`).
3. **Proyectos reales**: rellenar el array `PROYECTOS` en `js/script.js` (nombre, año,
   disciplina, categoría, imagen) y las imágenes de las tarjetas en `project.html`.
4. **Contenido de cada ficha** (descripción + imágenes) en `proyecto.html`.
5. **Confirmar email e Instagram** (ver conflicto en la sección 4).
6. (Opcional) Revisar el responsive en móvil/tablet de las 4 páginas con el contenido real.

---

## 12. Historial de cambios (resumen por fases)

- **F1** — Paleta morado/papel, nav nuevo, limpieza, se borró `work.html` y `about.html`.
- **F2** — SOBRE MÍ = `index.html`: composición fija (fotos + nombre), texto con reveal,
  flecha. Refinados espaciados, tamaños y alineaciones.
- **F3** — PROYECTOS = `project.html`: título, descripción, filtros, rejilla con hover.
- **F4** — FICHA = `proyecto.html`: barra fija, columna fija, contenido data-driven según
  `?cat=`, preview al hover.
- **F5a** — Responsive: rejilla 4→3→2→1, nombre siempre a la derecha sin romperse,
  "SOBRE MÍ" nunca se parte, footer de SOBRE MÍ al fondo en móvil.
- **F5b** — Menú móvil tipo Peloteo (morado), botón MENÚ a la izquierda, aparece a ≤1100px,
  filtros de PROYECTOS a la izquierda.
- **F5c** — Cajas del menú iguales y centradas, MENÚ más grande y subrayado, ficha en móvil
  (lista fija oculta + nombre/fecha a la derecha).
- **F5d/e/f** — Cursor: efecto de inversión tipo Peloteo, 24px, siempre en modo inversión
  (sin glitch). CERRAR igual de grande que MENÚ y subrayado. LORENA SÁNCHEZ deja de ser
  enlace. Hover del ítem activo del menú se invierte.

---

## 13. Notas técnicas útiles

- Librerías: Bootstrap 5.3, jQuery 3.7, GSAP 3.12 (+ Draggable), jQuery UI (por CDN).
- El cursor usa `mix-blend-mode: difference` (por eso invierte).
- El menú móvil, los filtros y la ficha se manejan en `js/script.js` con delegación de
  eventos e `URLSearchParams` (`?p=` y `?cat=`).
- Si algún cambio "no se ve": es la **caché** → **Cmd + Shift + R**.
- No abrir con `file://`: siempre con `python3 -m http.server`.
```
