# Referencia — código heredado de Peloteo (NO forma parte de la web)

Nada de esta carpeta se carga en la web. Está aquí sólo para poder **copiar y pegar**
piezas que ya estaban programadas y que algún día quieras reutilizar.

| Archivo | Qué contiene |
|---|---|
| `peloteo-archive.html` | La antigua página ARCHIVE de Peloteo (carrusel, botones «experience / grid view», rejilla de imágenes y lienzo arrastrable). |
| `peloteo-project-mobile.html` | Variante móvil de proyectos que nunca se llegó a usar. |
| `peloteo-script.js` | JS retirado de `js/script.js`: menú offcanvas de Bootstrap, marquee del footer, **física de las letras** del título, tarjetas 3D de WORK, carga de proyectos por AJAX, **cambio de vista** del archivo y **fotos arrastrables** con GSAP Draggable. |
| `peloteo-style.css` | CSS retirado de `css/style.css`: menú de Peloteo, HOME (hero + marquee), WORK, PROYECTO antiguo, ARCHIVE antiguo y ABOUT. |

Ojo: el código de aquí usa **jQuery, jQuery UI y Bootstrap**, que la web ya no carga.
Si reutilizas algo, o lo pasas a JavaScript normal o vuelves a añadir esas librerías
en el `<head>` de la página que lo necesite.

La versión de la web con estos archivos vivos es el commit `b871a3b` (y anteriores).
