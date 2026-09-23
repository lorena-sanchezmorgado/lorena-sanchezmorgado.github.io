# Portfolio · Lorena Sánchez

Web personal de **Lorena Sánchez Morgado**, diseñadora gráfica y multimedia (Madrid).
Sitio **estático** (HTML + CSS + JavaScript) con GSAP por CDN. Sin jQuery ni Bootstrap.

Este README es el **punto de entrada** para seguir desarrollando. La documentación de
decisiones y textos está en los `.md` de la raíz (ver [Documentación](#documentación)).

---

## Arrancar en local

Es una web estática, pero **no abras los `.html` con doble clic** (`file://`): las fichas
de proyecto se construyen con JS y algunas rutas fallan. Sírvela con un servidor local.

**La forma fácil (Windows, sin instalar nada):** doble clic en **`start-servidor.bat`**.
Arranca un pequeño servidor (PowerShell) y abre la web en el navegador. Para pararlo, cierra
la ventana negra que se abre. La web queda en **http://localhost:8790/index.html**.

> Alternativa por terminal: `powershell -ExecutionPolicy Bypass -File scripts\serve.ps1`
> (Si algún día instalas Python: `python -m http.server 8790`.)

> Si cambias CSS/JS y no ves el cambio, es la **caché**: recarga forzada con
> **Ctrl + Shift + R** (en Mac, Cmd + Shift + R).

---

## Estructura

```
index.html          → ARCHIVO (portada, lienzo de trabajos arrastrable)
project.html        → PROYECTOS (rejilla + filtros)
proyecto.html       → FICHA de proyecto (se rellena por JS según ?p= y ?cat=)
sobremi.html        → SOBRE MÍ (bio, formación, contacto)

css/style.css       → estilos (paleta, nav, menú, sobremí, proyectos, ficha, footer, cursor)
js/script.js        → lógica: reveal, menú móvil, filtros, construcción de la ficha, archivo
js/cursor.js        → cursor personalizado (bola en modo inversión)

media/img/          → fotos de Lorena + imágenes de la web
media/icon/         → favicon
media/proyectos/    → imágenes de proyectos (ver convención abajo)

referencia/         → código antiguo de Peloteo, guardado para copiar y pegar (no se carga)
```

Son **cuatro páginas** y ya no hay más: cada una es una pantalla distinta de la web.
Las fichas de proyecto **no son archivos**, las genera `proyecto.html` con los datos
del array `PROYECTOS`, así que añadir proyectos no añade HTML.

Solo se **versionan en git** el código y las imágenes que la web usa. El material en crudo
(PSD, PDF, AI, vídeos y carpetas de proyecto con nombres con acentos) y los respaldos quedan
**fuera del repo** pero **siguen en tu disco** (ver `.gitignore`).

---

## Sistema visual

Tinta morada sobre papel crema. Tokens en `css/style.css` (`:root`):

| Token | Valor | Uso |
|---|---|---|
| `--tinta` | `#4D124C` | texto, iconos, líneas, nav |
| `--papel` | `#FFFBF5` | todos los fondos |
| `--tinta-suave` | `rgba(77,18,76,.55)` | texto secundario, años |
| `--linea` | `rgba(77,18,76,.14)` | filetes y bordes |

Tipografía: **Roc Grotesk** (en `css/fonts/`). Regla de estilo: los textos de la web **no usan
el signo `:`** (sí valen los guiones largos `—`).

---

## Añadir un proyecto nuevo

→ **Paso a paso y con ejemplos en [`GUIA-RAPIDA.md`](GUIA-RAPIDA.md)**, y también
en comentarios dentro de [`js/script.js`](js/script.js) (justo encima del array
`PROYECTOS`) y de [`project.html`](project.html).

Resumen — el contenido está **dirigido por datos**, no se crea ningún .html nuevo:

1. **Prepara las imágenes** con el script que las reduce y las renombra:
   ```
   powershell -ExecutionPolicy Bypass -File scripts\optimizar-imagenes.ps1 -Origen "media\proyectos\Mi Carpeta" -Destino "media\proyectos\mi-slug"
   ```
   Deja `web-01.jpg`, `web-02.jpg`... a menos de 400 KB cada una.
2. **Añade el objeto** al array `PROYECTOS` de `js/script.js`:
   ```js
   {
     id: 7, slug: "nuevo", nombre: "Nombre", anio: "2025",
     disc: "Disciplina · Disciplina", cat: "marca",   // marca | campana | ilustracion
     img: "media/proyectos/nuevo/web-01.jpg",
     badge: "Ganador",                                 // opcional
     intro: "Frase de una línea.",
     bloques: [
       { t: "texto",   html: "<p>…</p>" },
       { t: "mosaico", imgs: ["…/web-02.jpg", "…/web-03.jpg"] },
       { t: "full",    img: "…/web-04.jpg" }
     ]
   }
   ```
   `mosaico` = galería justificada, 2 o 3 fotos por fila, misma altura y sin recortes.
   Si en una fila hay una vertical y dos apaisadas, la vertical se coloca a un lado
   con la altura de las dos apiladas; si una foto muy panorámica aplastaría al resto,
   se va sola a su fila.
3. **`destacado: true` o `false`** decide si sale en el filtro *Seleccionados*.
   `cat:` decide el apartado — son dos cosas distintas.
4. Y añade la carpeta nueva a las excepciones `!media/proyectos/…/` de `.gitignore`.

**No hay que tocar `project.html`**: la rejilla `.proy-grid` y el contador `(n)` de
*Seleccionados* se generan desde `PROYECTOS`, en ese mismo orden.

Las imágenes de los mosaicos aparecen solas en la portada ARCHIVO.

Categorías (`CAT_NOMBRES`): `seleccionados` · `marca` · `campana` · `ilustracion`.

---

## Código ya programado reutilizable (de Peloteo)

Está guardado en [`referencia/`](referencia/) (ver [`referencia/LEEME.md`](referencia/LEEME.md)).
No se carga en la web, es sólo para copiar y pegar

- **Archivo — vista libre + vista cuadrícula**: imágenes arrastrables con GSAP `Draggable`
  y toggle de vista (`peloteo-script.js`). *(La sección Archivo fue el trabajo de Lorena
  en Peloteo.)* La portada actual ya usa una versión nueva de este lienzo.
- **Física de letras del título**: el rótulo del hero rebota al pasar el ratón (`#heroLoop`).
- **Marquee del footer**. La **miniatura que sigue al cursor** sí sigue viva, en la ficha.

Ese código usa jQuery y Bootstrap, que la web ya no carga: al reutilizarlo hay que pasarlo
a JavaScript normal o volver a añadir las librerías.

---

## Estado y pendientes

**Hecho**: paleta morado/papel, nav nuevo, ARCHIVO (portada arrastrable con todas
las imágenes de los proyectos), SOBRE MÍ, PROYECTOS (rejilla generada desde los
datos + filtros + `destacado`), FICHA data-driven con galerías en mosaico que se
adaptan a la forma de cada foto, lupa al pinchar una imagen, menú móvil, cursor,
footer responsive. 7 proyectos, todos con imágenes optimizadas
(`web-NN.jpg`, < 600 KB cada una).

**Pendiente principal**:
1. Revisar el texto de *Puerta de Alcalá* — hablaba de auriculares y notas
   musicales, pero las imágenes son del cartel «Callejea por Madrid». Está
   marcado con un comentario "OJO LORENA" en `js/script.js`.
2. Montar el resto de proyectos que hay en `media/proyectos` (Gaia,
   Los Americanos, Chupachups, Twin Peaks, Dicho y Echo, Cuadros, Fotografías…).
3. Decidir si ARCHIVO y SOBRE MÍ llevan también el footer morado de contacto
   (hoy sólo lo tienen PROYECTOS y FICHA).
4. Revisar qué proyectos quieres en *Seleccionados*. Ahora mismo son 5 de 7
   (fuera: Kit Mapilo y Four Seasons) — se cambia con `destacado: true/false`.

---

## Documentación

- **[`GUIA-RAPIDA.md`](GUIA-RAPIDA.md) — cómo añadir proyectos, textos e imágenes tú sola. Empieza por aquí.**

- [`PORTFOLIO_LORE_DOC.md`](PORTFOLIO_LORE_DOC.md) — documento maestro (decisiones + textos).
- [`DOCUMENTACION-PROYECTO.md`](DOCUMENTACION-PROYECTO.md) — traspaso técnico detallado.
- [`TEXTOS-WEB.md`](TEXTOS-WEB.md) — textos de referencia (⚠️ contiene datos por confirmar).
