/* ============================================================================
   Portfolio Lorena Sánchez — comportamiento de la web
   Páginas: index (Archivo) · project (Proyectos) · proyecto (Ficha) · sobremi
   Dependencias: GSAP (+ Draggable solo en Archivo). Sin jQuery ni Bootstrap.
   Cada bloque comprueba si sus elementos existen, así el mismo archivo sirve
   para todas las páginas.
   ========================================================================== */



// ALTO REAL DEL MENÚ FIJO
// La barra de arriba mide distinto según el ancho de la pantalla. Aquí se mide
// de verdad y se guarda en la variable --nav-h, que usa el CSS para dejar el
// hueco justo debajo (ficha, proyectos, sobre mí y archivo). Así nunca queda
// una rendija por la que se vea pasar el texto.
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  const medir = () => {
    const alto = Math.round(nav.getBoundingClientRect().height);
    if (alto > 0) document.documentElement.style.setProperty("--nav-h", alto + "px");
  };

  medir();
  window.addEventListener("load", medir);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);

  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(medir, 120); });
});


/* ============================================================================
   GALERÍA MOSAICO (los bloques { t: "mosaico", imgs: [...] } de la ficha)
   ============================================================================
   Reparte las fotos en filas justificadas — todas las de una fila salen con el
   mismo alto y con el ancho proporcional a su forma, así llenan el ancho
   completo y ninguna se recorta ni se estira.

   FOTOS VERTICALES — cuando en una fila hay UNA vertical y DOS apaisadas, la
   vertical se pone a un lado tan alta como las otras dos puestas una encima de
   la otra. Así no se quedan las tres aplastadas en una línea horizontal.

   Para cambiar cuántas fotos caben por fila, toca CUANTAS_POR_FILA de abajo.
   Para decidir a partir de qué forma una foto se considera vertical, ES_VERTICAL.
   ========================================================================== */
window.ajustarMosaicos = function (scope) {
  const root = scope || document;

  // Máximo de fotos por fila según el ancho que tenga la galería
  function CUANTAS_POR_FILA(ancho) {
    if (ancho < 480) return 1;     // móvil — una debajo de otra
    if (ancho < 760) return 2;     // tablet
    return 3;                      // escritorio
  }

  // Una foto es "vertical" cuando su ancho/alto baja de esto (1 = cuadrada)
  const ES_VERTICAL = 0.85;

  // Alto mínimo de una fila, en proporción al ancho de la galería. Si una fila
  // saldría más baja que esto, se reparte de otra forma (ver CASO 2 abajo).
  const ALTO_MINIMO = 0.34;

  root.querySelectorAll(".fb-mosaico").forEach(galeria => {
    // La lista original de fotos se guarda la primera vez, porque el reparto
    // las cambia de sitio (a veces acaban dentro de una columna).
    if (!galeria._figs || !galeria._figs.length) {
      galeria._figs = Array.from(galeria.querySelectorAll("figure"));
    }
    const figs = galeria._figs;
    if (!figs.length) return;

    const ancho = Math.floor(galeria.getBoundingClientRect().width);
    if (!ancho) return;

    // Forma de cada foto (ancho / alto). Si todavía no ha cargado, se supone
    // apaisada y se vuelve a calcular en cuanto cargue.
    const formas = figs.map(f => {
      const img = f.querySelector("img");
      if (img && img.naturalWidth && img.naturalHeight) return img.naturalWidth / img.naturalHeight;
      return 1.4;
    });

    // Si no ha cambiado nada (mismo ancho y mismas formas) no se vuelve a
    // montar. Sin esto, mover el DOM dispararía otra vez al observador y la
    // galería se quedaría dando vueltas.
    const firma = ancho + "|" + formas.map(a => a.toFixed(3)).join(",");
    if (galeria._firma === firma) return;
    galeria._firma = firma;

    const hueco = parseFloat(getComputedStyle(galeria).columnGap) || 10;

    // Se vacía y se vuelve a montar desde cero (las fotos son las mismas de
    // siempre, no se recargan)
    galeria.textContent = "";

    // Móvil — una debajo de otra, sin cuentas
    if (CUANTAS_POR_FILA(ancho) === 1) {
      figs.forEach(f => {
        f.style.width = "";
        f.style.flex = "";
        galeria.appendChild(f);
      });
      return;
    }

    // Filas lo más igualadas posible: 4 fotos -> 2 y 2 · 5 fotos -> 3 y 2
    const porFila = CUANTAS_POR_FILA(ancho);
    let nFilas = Math.ceil(figs.length / porFila);
    // Nunca se deja una foto sola en una fila (ocuparía todo el ancho ella sola)
    while (nFilas > 1 && Math.floor(figs.length / nFilas) < 2) nFilas--;
    const base = Math.floor(figs.length / nFilas);
    const sobran = figs.length % nFilas;

    // --- Herramientas para montar una fila ---------------------------------

    const nuevaFila = () => {
      const fila = document.createElement("div");
      fila.className = "fb-fila";
      galeria.appendChild(fila);
      return fila;
    };

    // Alto que tendría una fila con estas fotos puestas en línea
    const altoDe = (idx) => {
      const suma = idx.reduce((a, k) => a + formas[k], 0);
      return (ancho - hueco * (idx.length - 1)) / suma;
    };

    // Fila normal: todas en línea, mismo alto, ancho según su forma
    const filaEnLinea = (idx) => {
      const fila  = nuevaFila();
      const suma  = idx.reduce((a, k) => a + formas[k], 0);
      const libre = ancho - hueco * (idx.length - 1);
      idx.forEach(k => {
        const f = figs[k];
        f.style.flex  = "0 0 auto";
        f.style.width = Math.max(40, Math.floor(libre * (formas[k] / suma))) + "px";
        fila.appendChild(f);
      });
    };

    function montar(idx) {
      const verticales = idx.filter(k => formas[k] < ES_VERTICAL);

      // CASO 1 — tres fotos, UNA vertical y dos apaisadas.
      // La vertical va a un lado, tan alta como las otras dos apiladas.
      if (idx.length === 3 && verticales.length === 1) {
        const fila = nuevaFila();
        const v  = verticales[0];
        const hh = idx.filter(k => k !== v);
        const av = formas[v];
        // alto de la pila = anchoPila/forma1 + hueco + anchoPila/forma2
        const S  = 1 / formas[hh[0]] + 1 / formas[hh[1]];
        // Igualando alturas, sabiendo que anchoV + hueco + anchoPila = ancho:
        let wPila = (ancho - hueco * (1 + av)) / (1 + av * S);
        wPila = Math.max(60, Math.min(ancho - hueco - 60, wPila));
        const wV = ancho - hueco - wPila;

        const figV = figs[v];
        figV.style.flex  = "0 0 auto";
        figV.style.width = Math.floor(wV) + "px";

        const col = document.createElement("div");
        col.className = "fb-col";
        col.style.flex  = "0 0 auto";
        col.style.width = Math.floor(wPila) + "px";
        hh.forEach(k => {
          figs[k].style.flex  = "";
          figs[k].style.width = "";
          col.appendChild(figs[k]);
        });

        // La vertical se queda del lado en el que la escribiste
        if (v === idx[0]) { fila.appendChild(figV); fila.appendChild(col); }
        else              { fila.appendChild(col);  fila.appendChild(figV); }
        return;
      }

      // CASO 2 — la fila saldría demasiado baja. Pasa cuando una foto muy
      // panorámica convive con verticales: la panorámica se lo come todo y las
      // demás quedan como sellos. Entonces la panorámica se va sola a su fila
      // (a todo el ancho, que es como mejor se ve) y el resto se reparte.
      if (idx.length >= 3 && altoDe(idx) < ancho * ALTO_MINIMO) {
        let ancha = idx[0];
        idx.forEach(k => { if (formas[k] > formas[ancha]) ancha = k; });
        const resto = idx.filter(k => k !== ancha);
        if (resto.length >= 2) {
          // Se respeta el orden en el que las escribiste
          if (ancha === idx[0]) { filaEnLinea([ancha]); montar(resto); }
          else                  { montar(resto); filaEnLinea([ancha]); }
          return;
        }
      }

      // CASO 3 — lo normal
      filaEnLinea(idx);
    }

    let i = 0;
    for (let nf = 0; nf < nFilas; nf++) {
      const cuantas = base + (nf < sobran ? 1 : 0);
      const idx = [];
      for (let k = 0; k < cuantas; k++) idx.push(i + k);
      i += cuantas;
      montar(idx);
    }
  });
};

// Recalcular cuando cargan las fotos y cuando cambia el tamaño de la ventana
document.addEventListener("DOMContentLoaded", () => {
  const recalcular = () => window.ajustarMosaicos(document);

  document.addEventListener("load", (e) => {
    if (e.target && e.target.tagName === "IMG" && e.target.closest(".fb-mosaico")) recalcular();
  }, true);   // true = captura, porque el evento load de las imágenes no burbujea

  window.addEventListener("load", recalcular);

  // Si cambia el ancho de una galería (aparece la barra de scroll, gira el
  // móvil, se abre el inspector...), se vuelve a repartir sola.
  if ("ResizeObserver" in window) {
    const observador = new ResizeObserver(entradas => {
      entradas.forEach(e => window.ajustarMosaicos(e.target.parentElement || document));
    });
    const observar = () => document.querySelectorAll(".fb-mosaico").forEach(g => observador.observe(g));
    observar();
    // La ficha se genera por JS, así que se vuelve a mirar un poco después
    setTimeout(observar, 600);
  }
  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(recalcular, 120); });
});

/* ============================================================================
   MINIATURA QUE SIGUE AL CURSOR
   ============================================================================
   Aparece al pasar el ratón por:
     · la lista de proyectos de una ficha  -> la foto de ese proyecto
     · LORENA SÁNCHEZ del menú de arriba   -> tu foto de Sobre mí

   Para cambiar la foto del nombre, toca FOTO_DEL_NOMBRE de aquí abajo.
   ========================================================================== */
const FOTO_DEL_NOMBRE = "media/img/lorena-puerta-azul.jpeg";

document.addEventListener("DOMContentLoaded", () => {
  // La miniatura solo existe en la ficha; en las demás páginas se crea aquí,
  // porque el nombre del menú está en todas.
  let preview = document.querySelector(".project-preview");
  if (!preview) {
    preview = document.createElement("div");
    preview.className = "project-preview";
    preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = '<img alt="">';
    document.body.appendChild(preview);
  }
  const img = preview.querySelector("img");
  if (!img || !window.gsap) return;

  // Sin ratón de verdad (móvil, tableta) no tiene sentido: no se enseña
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const xTo = gsap.quickTo(preview, "x", { duration: 0.35, ease: "power3" });
  const yTo = gsap.quickTo(preview, "y", { duration: 0.35, ease: "power3" });

  // Qué foto le toca a cada cosa por la que pasas
  function fotoDe(el) {
    if (el.classList.contains("nav-name")) return FOTO_DEL_NOMBRE;
    return el.getAttribute("data-img");
  }

  // Delegado: la lista de la ficha se construye por JS después de cargar
  document.addEventListener("mouseover", (e) => {
    const item = e.target.closest(".ficha-item, .nav-name");
    if (!item || item.contains(e.relatedTarget)) return;
    const src = fotoDe(item);
    if (!src) return;
    if (img.getAttribute("src") !== src) img.src = src;
    gsap.to(preview, { opacity: 1, duration: 0.2 });
  });

  document.addEventListener("mouseout", (e) => {
    const item = e.target.closest(".ficha-item, .nav-name");
    if (!item || item.contains(e.relatedTarget)) return;
    gsap.to(preview, { opacity: 0, duration: 0.2 });
  });

  // Sigue al cursor, pero se mantiene SIEMPRE dentro de la pantalla
  // (así las imágenes verticales no se cortan aunque el ratón esté abajo).
  window.addEventListener("mousemove", (e) => {
    const pad = 16;
    const pw = preview.offsetWidth || 0;
    const ph = preview.offsetHeight || 0;
    const x = Math.max(pad, Math.min(e.clientX + 20, window.innerWidth - pw - pad));
    const y = Math.max(pad, Math.min(e.clientY + 20, window.innerHeight - ph - pad));
    xTo(x);
    yTo(y);
  });
});




// ENTRADAS AL HACER SCROLL (una sola vez) + flecha que se desvanece
document.addEventListener("DOMContentLoaded", () => {
  // Reutilizable: se puede llamar tras inyectar contenido nuevo (ej. la ficha)
  window.initReveals = function (scope) {
    const root = scope || document;
    const reveals = root.querySelectorAll(".reveal:not(.is-visible)");
    if (!reveals.length) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(el => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        const el = entry.target;
        // En Sobre mí la animación se REPITE (scroll infinito): aparece al bajar
        // y desaparece al subir. En el resto, una sola vez.
        const repeat = !!el.closest(".sm-text");
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          if (!repeat) obs.unobserve(el);
        } else if (repeat) {
          el.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(el => {
      // aparición desigual (retardo aleatorio) para los textos de Sobre mí
      if (el.closest(".sm-text") && !el.style.transitionDelay) {
        el.style.transitionDelay = (Math.random() * 0.35).toFixed(2) + "s";
      }
      io.observe(el);
    });
  };
  window.initReveals(document);
});


// Menú móvil (tipo Peloteo): botón MENÚ abre/cierra el overlay
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  if (!toggle || !menu) return;
  const closeBtn = menu.querySelector(".nav-menu-close");

  const setOpen = (open) => {
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
  };

  toggle.addEventListener("click", () => setOpen(true));
  if (closeBtn) closeBtn.addEventListener("click", () => setOpen(false));
  // Al pinchar un enlace del menú, se cierra
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
  // Cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) setOpen(false);
  });
});


/* ============================================================================
   PROYECTOS — la rejilla de miniaturas y el filtro
   ============================================================================
   La rejilla NO está escrita a mano en project.html — se construye aquí con la
   lista PROYECTOS de más abajo, en ese mismo orden. Así nunca se descuadra:
   añades el proyecto en un sitio y aparece en la rejilla, en la ficha y en el
   Archivo solo.

   El botón "Seleccionados" enseña únicamente los que llevan  destacado: true.
   Los botones de categoría (Marca, Campaña, Ilustración) enseñan todos los de
   esa categoría, sean destacados o no.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".proy-grid");
  const filters = document.querySelectorAll(".proy-filter .filter-item");
  if (!grid || !filters.length) return;

  const catLabel = { marca: "Marca", campana: "Campaña", ilustracion: "Ilustración" };

  // Pinta las tarjetas. SIN numerar — al filtrar por "Seleccionados" los
  // números saldrían salteados (01, 02, 04, 06...) y quedaba raro.
  grid.innerHTML = PROYECTOS.map(p => `
     <a class="proy-card" href="proyecto.html?p=${p.slug}&cat=${p.cat}"
       data-cat="${p.cat}" data-p="${p.slug}" data-destacado="${p.destacado ? "1" : "0"}">
      <div class="img-wrapper">
        <img class="img-grid" src="${p.img}" alt="${p.nombre}" loading="lazy">
        <div class="img-overlay"><span>${p.nombre}<br>${catLabel[p.cat] || ""}</span></div>
      </div>
    </a>`).join("");

  const cards = Array.from(grid.querySelectorAll(".proy-card"));

  // El contador del botón "Seleccionados" se calcula solo
  const cuenta = document.querySelector(".proy-filter .filter-count");
  if (cuenta) cuenta.textContent = "(" + PROYECTOS.filter(p => p.destacado).length + ")";

  function applyFilter(cat) {
    filters.forEach(f => f.classList.toggle("is-active", f.dataset.cat === cat));
    const destino = (cat === "todos") ? "seleccionados" : cat;
    cards.forEach(card => {
      const show = (cat === "todos")
        ? card.dataset.destacado === "1"
        : card.dataset.cat === cat;
      card.style.display = show ? "" : "none";
      // El enlace lleva el apartado del que vienes, para la lista de la ficha
      card.setAttribute("href", `proyecto.html?p=${card.dataset.p}&cat=${destino}`);
    });
  }

  filters.forEach(btn => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.cat));
  });

  applyFilter("todos");   // estado inicial: Seleccionados
});


// ¿DE QUÉ LADO SALE LA ETIQUETA "COPIAR"?
// Se prueba primero a la DERECHA del texto. Si ahí no cabe (por ejemplo el email
// del footer, que llega al borde de la tarjeta morada) se pasa a la IZQUIERDA, y
// si tampoco cabe (pantallas muy estrechas) se pone DEBAJO. Se mide justo antes
// de que aparezca.
function ladoDeLaEtiqueta(el) {
  const hint = el.getAttribute("data-hint") || "Copiar";
  // Ancho aproximado de la pastilla — se usa el texto más largo de los dos
  // ("¡Copiado!" es el que aparece después de hacer clic), más el hueco.
  const letras = Math.max(hint.length, 9);
  const ancho = letras * 8 + 34;

  const caja = el.getBoundingClientRect();
  const padre = (el.parentElement || document.body).getBoundingClientRect();

  const sitioDerecha = padre.right - caja.right;
  const sitioIzquierda = caja.left - padre.left;

  const cabeDerecha = sitioDerecha >= ancho;
  const cabeIzquierda = sitioIzquierda >= ancho;

  // 1º a la derecha · 2º a la izquierda · si no cabe en ninguna, debajo
  el.classList.toggle("hint-der", cabeDerecha);
  el.classList.toggle("hint-izq", !cabeDerecha && cabeIzquierda);
  el.classList.toggle("hint-abajo", !cabeDerecha && !cabeIzquierda);
}

// Se calcula al pasar el ratón por encima (y al enfocar con el teclado)
document.addEventListener("pointerover", (e) => {
  const el = e.target.closest && e.target.closest(".copyable[data-copy]");
  if (el) ladoDeLaEtiqueta(el);
});
document.addEventListener("focusin", (e) => {
  const el = e.target.closest && e.target.closest(".copyable[data-copy]");
  if (el) ladoDeLaEtiqueta(el);
});

// COPIAR AL PORTAPAPELES — cualquier elemento .copyable[data-copy]
// Al hacer clic copia el texto y muestra "¡Copiado!" un instante (en vez de abrir el mail).
document.addEventListener("click", (e) => {
  const el = e.target.closest(".copyable[data-copy]");
  if (!el) return;
  e.preventDefault();
  const value = el.getAttribute("data-copy");
  ladoDeLaEtiqueta(el);   // "¡Copiado!" es más largo que "Copiar": se recalcula

  const done = () => {
    el.classList.add("is-copied");
    clearTimeout(el._copyT);
    el._copyT = setTimeout(() => el.classList.remove("is-copied"), 1600);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value).then(done).catch(() => fallbackCopy(value, done));
  } else {
    fallbackCopy(value, done);
  }
});

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done && done(); } catch (_) { }
  document.body.removeChild(ta);
}


/* ============================================================================
   ***  AQUI SE ANADEN Y SE EDITAN LOS PROYECTOS  ***
   ============================================================================

   Todo lo que se ve en una ficha de proyecto sale de esta lista. No hay que
   crear ningún archivo .html nuevo — la página proyecto.html se rellena sola.

   -- CÓMO AÑADIR UN PROYECTO NUEVO, PASO A PASO ----------------------------

   1) PREPARA LAS IMÁGENES
      Las fotos originales pesan muchísimo. Pásalas por el script que las
      reduce y las renombra (abre la terminal en la carpeta del proyecto):

        powershell -ExecutionPolicy Bypass -File scripts\optimizar-imagenes.ps1
          -Origen "media\proyectos\NOMBRE DE TU CARPETA"
          -Destino "media\proyectos\slug-del-proyecto"

      (todo en una sola línea). Te deja web-01.jpg, web-02.jpg, web-03.jpg...
      dentro de la carpeta "slug-del-proyecto" (minúsculas, sin acentos ni
      espacios). Si quieres elegir el ORDEN a mano, usa -Archivos en vez de
      -Origen — hay un ejemplo dentro del propio script.

   2) COPIA UN PROYECTO DE ABAJO, PÉGALO Y CAMBIA LOS DATOS.
      Este es el molde, con todo lo que puede llevar:

        {
          id: 7,                                  // número único, no repetir
          slug: "mi-proyecto",                    // = carpeta de las imágenes
          nombre: "Nombre del proyecto",          // lo que se ve en la lista
          anio: "2025",                           // se muestra entre paréntesis
          disc: "Disciplina · Disciplina",        // debajo del nombre, en pequeño
          cat: "marca",                           // marca | campana | ilustracion
          img: "media/proyectos/mi-proyecto/web-01.jpg",   // miniatura del grid
          destacado: true,                        // ¿sale en "Seleccionados"? true | false
          badge: "Ganador",                       // OPCIONAL, pastilla junto a la intro
          intro: "Una frase que resuma el proyecto.",
          bloques: [
            ...aquí va el contenido, en el orden que quieras...
          ]
        },

   3) LOS BLOQUES — el contenido de la ficha, EN EL ORDEN EN QUE LOS ESCRIBAS.
      Hay tres tipos y se pueden mezclar y repetir las veces que quieras:

      * TEXTO
        { t: "texto", html: "<p>Un párrafo.</p><p>Otro párrafo.</p>" }

        Dentro del html se puede usar:
          <p>...</p>            un párrafo
          <strong>...</strong>  en negrita
          <em>...</em>          en cursiva
          <br>                  salto de línea
        Ojo — si escribes comillas dobles dentro del texto, ponles una barra
        delante así  \"  (si no, se rompe la línea).

      * MOSAICO  <-- lo normal, dos o tres fotos por fila
        { t: "mosaico", imgs: [
            "media/proyectos/mi-proyecto/web-02.jpg",
            "media/proyectos/mi-proyecto/web-03.jpg"
        ]},

        Las fotos de una misma fila salen con el mismo alto y llenan el ancho
        completo, sin recortarse ni deformarse. Con 2 o 3 imágenes sale una
        fila; con 4 salen 2 y 2; con 5, tres y dos. En el móvil se apilan.

      * FULL  (una sola foto a todo el ancho, para una imagen de portada)
        { t: "full", img: "media/proyectos/mi-proyecto/web-01.jpg" },

      Y la FICHA TÉCNICA del final es un bloque de texto normal con la clase
      "ficha-meta" (así se alinean las etiquetas en columna):

        { t: "texto", html: "<p class=\"ficha-meta\"><strong>Rol</strong> ...<br><strong>Herramientas</strong> ...</p>" }

   4) ¿VA EN "SELECCIONADOS"? -> destacado: true / false
      El botón "Seleccionados" de la página PROYECTOS es tu escaparate — ahí
      salen SOLO los proyectos con  destacado: true.

        destacado: true   -> sale en Seleccionados Y en su categoría
        destacado: false  -> NO sale en Seleccionados, pero sí al pinchar su
                             categoría (Marca, Campaña o Ilustración)

      Es decir, la categoría la decide  cat:  y el escaparate lo decide
      destacado:. Son dos cosas distintas. Cambiar una palabra (true por
      false) es todo lo que hay que hacer; el contador (5) del botón se
      recalcula solo.

   5) LISTO. NO hay que tocar project.html — la rejilla de miniaturas se
      construye sola con esta lista, en este mismo orden (mover un proyecto
      aquí arriba o abajo cambia su sitio en la rejilla). Y las imágenes de
      los mosaicos aparecen además, solas, en la portada ARCHIVO (el lienzo
      que se arrastra). No hay que tocar nada más.

   -- REGLA DE ESTILO DE LOS TEXTOS ----------------------------------------
   Sin dos puntos ":" en los textos de la web — se usan guiones largos —.
   ========================================================================== */

const PROYECTOS = [

  // ---------------------------------------------------------------- (01)
  {
    id: 1, slug: "compas", nombre: "Compás", anio: "2026", disc: "Branding, UX/UI, Campaña",
    cat: "marca", img: "media/proyectos/compas/web-portada.jpg", destacado: true,
    intro: "Mi Trabajo Fin de Grado, una app de bienestar y prevención que cambia las cifras por color para que cuidarse sea fácil y no dé miedo. <em>El bienestar no se mide, se ve.</em>",
    bloques: [
      { t: "texto", html: "<p>Compás nace de una idea sencilla, cuidarse no debería empezar cuando el cuerpo o la mente ya empiezan a fallar. Viene de cerca, de ver en mi entorno familiar cómo el envejecimiento cambia el día a día, y de una pregunta, ¿puede el diseño ayudar a que las personas se cuiden antes, con calma, mientras todavía es fácil? <br><br> El foco no está en la vejez avanzada, sino en el momento previo. Diseñé la experiencia para adultos de 50 a 65 años con poca o media soltura digital, alrededor de microhábitos de estimulación cognitiva, actividad física ligera y bienestar emocional. Es un proyecto de diseño, no de salud. Compás no diagnostica, no trata y no sustituye a ningún profesional. Solo acompaña desde lo cotidiano.</p>" },

      { t: "texto", html: "<p>La respuesta fue traducir el progreso en algo que se ve. En vez de puntuar a la persona, la interfaz arranca en blanco y se va llenando de color a medida que aparecen los pequeños gestos del día, y cada hábito deja una pegatina de color. Mi referente fue <em>The Obliteration Room</em> de Yayoi Kusama, una sala que empieza vacía y se transforma cuando la gente pega puntos. El avance deja de ser un número para volverse una huella visual que motiva desde el logro y crece a tu ritmo.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-01.jpg",
          "media/proyectos/compas/web-32.jpg",
          "media/proyectos/compas/web-02.jpg"
        ]
      },

      { t: "texto", html: "<p>Para no diseñar a ciegas hice una encuesta a 74 personas del público objetivo. Lo más revelador es que la verdadera barrera no es la edad, sino la calidad de la experiencia. Lo que más ayuda a sostener una rutina es la flexibilidad para hacerla cuando se puede, poder ver el propio avance y tener retos alcanzables, justo lo que dibuja el sistema de compás. Y lo que hace abandonar una app es la repetición, el exceso de notificaciones y la sensación de culpa. Por eso elegí una gamificación no competitiva, que solo suma y nunca riñe.</p>" },

      { t: "texto", html: "<p>Con la investigación clara, diseñé la app de principio a fin. Empecé con bocetos rápidos a mano para ordenar las pantallas y los pasos, y de ahí pasé a los wireframes, donde fijé la estructura y la jerarquía sin distraerme con el color. <br><br> La arquitectura es deliberadamente simple. Cuatro secciones fijas en la barra de abajo, Hoy, Progreso, Juntos y Perfil, y una sola acción principal por pantalla para no abrumar a alguien con poca soltura digital. En Hoy la persona ve los gestos del día, un paseo, un vaso de agua, un juego para la mente o un momento de calma, y elige el que le apetece, con botones grandes, textos claros y mucho aire.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-03.png",
          "media/proyectos/compas/web-04.png",
          "media/proyectos/compas/web-05.jpg",
          "media/proyectos/compas/web-06.jpg",
          "media/proyectos/compas/web-07.jpg"
        ]
      },

      { t: "texto", html: "<p>El corazón de compás es cómo se ve el progreso. La pantalla arranca casi en blanco y cada gesto completado deja una pegatina de color, así que el avance se percibe de un vistazo, sin números ni rachas. Faltar un día solo deja un hueco, y al cerrar la semana el conjunto forma un mural que puedes contemplar. El progreso es tuyo y no se compara con nadie. Hasta el icono de la app cambia de color según el área que más cuidas, para que la sientas viva.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-08.jpg",
          "media/proyectos/compas/web-09.jpg",
          "media/proyectos/compas/web-10.jpg",
          "media/proyectos/compas/web-11.jpg" 
        ]
      },

      { t: "texto", html: "<p>Toda la marca se construye sobre una sola idea, el punto de color. El logotipo es una marca mixta en minúsculas y trazo redondeado, con la o convertida en una pegatina que lleva dentro un asterisco, la marca mínima de la que parte todo el sistema. Ese asterisco tiene cinco brazos en lugar de seis, uno por cada área de cuidado, y el brazo que falta representa lo que pone la propia persona, una identidad abierta que se completa con el uso. <br><br> Para la marca elegí la tipografía Chillax, y para la interfaz PT Root UI, muy legible en tamaños pequeños y de ancho constante entre pesos, algo importante para este público. La paleta son siete colores luminosos sobre blanco, cada uno un área. Y la pegatina no es un guiño infantil, es un gesto que esta generación reconoce, la de quien creció pegando cromos y completando álbumes poco a poco.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-13.jpg",
          "media/proyectos/compas/web-14.png"
        ]
      },

      { t: "texto", html: "<p>La marca también vive fuera del móvil. Diseñé una web sencilla con el mismo lenguaje, mucho blanco, tipografía grande y la pegatina de color, donde presentar compás, contar cómo funciona el cuidado en color y descargar la app sin líos. La misma idea en otro formato.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-15.jpg",
          "media/proyectos/compas/web-16.jpg"
        ]
      },

      { t: "texto", html: "<p>De la pantalla la marca salta a la calle con el mismo tono, invitar a participar y nunca asustar, sin mensajes alarmistas sobre la enfermedad. Los carteles trabajan por fases, primero intrigan con la pegatina de color sobre blanco y después revelan la marca. De esa idea nace <em>Pon una pegatina</em>, una activación en la que cada persona pega el color de lo que ya ha hecho hoy sobre un panel que se va llenando entre todos, igual que la app. <em>Encuentra tu color.</em></p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-18.jpg",
          "media/proyectos/compas/web-19.jpg",
          "media/proyectos/compas/web-20.jpg"
        ]
      },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-21.jpg",
          "media/proyectos/compas/web-22.jpg"
        ]
      },

      { t: "texto", html: "<p>El folleto acompaña a la activación y explica la marca de un vistazo. Desplegado se lee de corrido, qué es compás, cómo el color se llena con cada gesto y qué cuida cada una de las áreas, pensado para llevárselo a casa y entenderlo sin ayuda.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-23.jpg",
          "media/proyectos/compas/web-25.jpg"
        ]
      },

      { t: "texto", html: "<p>En redes mantengo la misma familia visual, pegatinas grandes, frases cortas y capturas reales de la app. Preparé la parrilla, las publicaciones y las historias de Instagram, con un sistema fácil de mantener y de llevar a otras plataformas.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-26.png",
          "media/proyectos/compas/web-27.jpg",
          "media/proyectos/compas/web-28.jpg"
        ]
      },

      { t: "texto", html: "<p>Por último pensé cómo se sostiene sin cobrar por cuidarse, algo clave en un proyecto de prevención. La regla es simple, lo que cuida tu salud es gratis y lo de pago son solo extras de comodidad. Hay una versión completa opcional, pero el modelo se apoya sobre todo en instituciones a las que les interesa la prevención, como farmacias o mutuas. Cuidarse no debería tener un muro de pago.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/compas/web-29.jpg",
          "media/proyectos/compas/web-30.jpg",
          "media/proyectos/compas/web-31.jpg"
        ]
      },

      { t: "texto", html: "<p>Diseñé compás en Figma como un prototipo navegable, con un recorrido completo por la incorporación, las cuatro secciones y el momento en que la pantalla se llena de color. Puedes recorrerlo tú, o leer la memoria completa del proyecto.</p><p class=\"ficha-cta-row\"><a class=\"ficha-cta\" href=\"https://www.figma.com/proto/hi1tiUSJOvPyDZEnX6ERxJ/TFG_compas_Prototipo_LorenaSanchez?node-id=32-126&starting-point-node-id=22%3A35\" target=\"_blank\" rel=\"noopener\">Abrir prototipo en Figma </a> <a class=\"ficha-cta\" href=\"media/proyectos/compas/compas-memoria.pdf\" target=\"_blank\" rel=\"noopener\">Leer la memoria en PDF </a></p>" }
    ]
  },

  // ---------------------------------------------------------------- (02)
  {
    id: 2, slug: "thompson", nombre: "Hotel Thompson", anio: "2023", disc: "Ilustración, Packaging, Diseño textil",
    cat: "ilustracion", img: "media/proyectos/thompson/web-02.jpg", destacado: true,
    intro: "Propuesta ganadora del concurso de diseño de camiseta para el Thompson Hotel Madrid, compuesta por una camiseta y un amenity inspirado en la cultura madrileña.",
    bloques: [
      { t: "texto", html: "<p>Thompson Madrid organizó un concurso para crear una propuesta inspirada en la identidad y la cultura de la ciudad, formada por una camiseta y un amenity para sus huéspedes. Mi propuesta parte de algunos de los símbolos más reconocibles de Madrid para crear dos piezas con una misma identidad, pero con historias diferentes. <br><br> El reto era encontrar una forma de hablar de Madrid que fuese reconocible para quien visita la ciudad, pero que también tuviese una historia detrás y se sintiera cercana y auténtica.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/thompson/web-06.jpg"
        ]
      },

      { t: "texto", html: "<p>Para la camiseta quise representar Madrid desde una perspectiva diferente, alejándome de una representación literal de sus monumentos. La idea surgió de imaginar que estamos tumbados y miramos hacia el cielo, rodeados por algunos de los edificios y símbolos más reconocibles de la ciudad. <br><br> A partir de esta perspectiva creé una composición circular en la que aparecen el Oso y el Madroño, la Puerta de Alcalá, las Cuatro Torres, el edificio Schweppes, el Tío Pepe, el edificio Metrópolis y la entrada de Metro. Todos ellos están dibujados de una forma más libre, como si fueran trazos de un boceto, buscando que la ilustración se sintiera espontánea y cercana. <br><br> La frase “De Madrid al cielo” completa la composición y refuerza esa idea de mirar hacia arriba. Es una expresión muy ligada a Madrid y que resume, de una forma sencilla, ese sentimiento de que no hay lugar como esta ciudad.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/thompson/web-02.jpg",
          "media/proyectos/thompson/web-04.jpg"
        ]
      },

      { t: "texto", html: "<p>Para la segunda parte del concurso diseñé un amenity en forma de lata de barquillos, buscando que el regalo fuese algo más que un simple objeto promocional. <br><br> La elección de los barquillos parte de su relación con la tradición madrileña y con las fiestas de San Isidro. A partir de ahí quise construir una pequeña historia alrededor de la lata y recuperar otra expresión muy característica de Madrid: “Más chulo que un ocho”. <br><br> El diseño está protagonizado por el tranvía número ocho, relacionado con el origen de esta expresión y con los chulapos y chulapas que lo utilizaban para acudir a las fiestas y verbenas madrileñas. La historia queda integrada en el propio packaging para que el huésped pueda descubrirla al abrir la lata. <br><br> Además, la lata está pensada para conservarse y reutilizarse después de consumir los barquillos, convirtiéndose también en un pequeño recuerdo del paso por Madrid.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/thompson/web-03.jpg",
          "media/proyectos/thompson/web-05.jpg"
        ]
      },

      { t: "texto", html: "<p>Para la segunda parte del concurso diseñé un amenity en forma de lata de barquillos, buscando que el regalo fuese algo más que un simple objeto promocional. <br><br> La elección de los barquillos parte de su relación con la tradición madrileña y con las fiestas de San Isidro. A partir de ahí quise construir una pequeña historia alrededor de la lata y recuperar otra expresión muy característica de Madrid: “Más chulo que un ocho”. <br><br> El diseño está protagonizado por el tranvía número ocho, relacionado con el origen de esta expresión y con los chulapos y chulapas que lo utilizaban para acudir a las fiestas y verbenas madrileñas. La historia queda integrada en el propio packaging para que el huésped pueda descubrirla al abrir la lata. <br><br> Además, la lata está pensada para conservarse y reutilizarse después de consumir los barquillos, convirtiéndose también en un pequeño recuerdo del paso por Madrid.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/thompson/web-07.jpg"
        ]
      },

      { t: "texto", html: "<p>Este proyecto fue una experiencia especialmente significativa para mí, ya que surgió de una colaboración entre mi universidad y Thompson Madrid. Desde el primer momento me sentí muy cercana al proyecto, especialmente después de conocer de primera mano qué buscaba el hotel y cómo planteaban el concurso. <br><br> Fue un reto muy emocionante, pero también me daba cierto miedo. En ese momento estaba empezando segundo de carrera y el concurso estaba abierto a todos los estudiantes, así que sentía que muchas de las personas que participaban podían tener más experiencia que yo. Trabajar para una marca hotelera tan grande y con presencia internacional hacía que el proyecto fuese todavía más importante para mí. <br><br> Por eso, recibir el premio fue especialmente gratificante. Me quedo con la experiencia de haberme enfrentado a un proyecto que me sacaba de mi zona de confort, de haber aprendido durante el proceso y, sobre todo, con la ilusión y el agradecimiento de haber podido formar parte de una oportunidad así.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/thompson/web-08.jpg"
        ]
      }
    ]
  },

  // ---------------------------------------------------------------- (03)
  {
    id: 3, slug: "mapilo", nombre: "Kit Mapilo", anio: "2025", disc: "Packaging · Producto",
    cat: "marca", img: "media/proyectos/mapilo/web-01.jpg", destacado: false,
    intro: "Un kit de juegos de mesa pensado para hacer una pausa y cuidar la mente lejos de la pantalla.",
    bloques: [
      { t: "texto", html: "<p>Un kit físico que reúne varios juegos sencillos en un sistema de packaging coherente, pensado para desconectar un rato y ejercitar la mente sin pantallas.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/mapilo/web-01.jpg",
          "media/proyectos/mapilo/web-02.jpg"
        ]
      },

      { t: "texto", html: "<p>Cada juego tiene su color y su icono, y todos comparten la misma retícula, así que el kit se lee como una familia aunque cada caja funcione por separado.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/mapilo/web-03.jpg",
          "media/proyectos/mapilo/web-04.jpg",
          "media/proyectos/mapilo/web-05.jpg"
        ]
      },

      { t: "texto", html: "<p class=\"ficha-meta\"><strong>Rol</strong> Proyecto individual. Concepto, diseño de juegos y packaging.<br><strong>Herramientas</strong> Illustrator · Photoshop.</p>" }
    ]
  },

  // ---------------------------------------------------------------- (04)
  {
    id: 4, slug: "pichi", nombre: "Pichi", anio: "2025", disc: "Creación de Marca, Ilustración, Packaging",
    cat: "campana", img: "media/proyectos/pichi/web-11.jpg", destacado: true,
    intro: "Cerveza muy Madrileña.",
    bloques: [
      { t: "texto", html: "<p>Quería crear una cerveza que tuviera algo de Madrid, pero sin limitarme a utilizar los símbolos que ya conocemos de siempre. Hablándolo con mi familia surgió la idea de investigar canciones antiguas que se escuchaban durante las fiestas de San Isidro y fue ahí donde apareció Pichi. Empecé a investigar la canción, el personaje y todo lo que había detrás del nombre, y me gustó la idea de coger algo tan ligado a la tradición madrileña y darle una vuelta para convertirlo en una marca más actual.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/pichi/web-01.jpg"
        ]
      },

      { t: "texto", html: "<p>Pichi no es solamente un nombre, sino una forma de entender la marca. Me interesaba recuperar esa estética tan reconocible de Madrid y mezclarla con algo más joven, directo y colorido. Para ello trabajé a partir de referencias de la gráfica popular y de carteles antiguos, jugando con colores muy marcados, formas sencillas y una estética que pudiera sentirse tradicional sin parecer antigua. <br><br> A partir de ahí decidí que la marca tendría tres cervezas diferentes, cada una con su propia personalidad. Los nombres y las ilustraciones parten de personajes y expresiones relacionadas con Pichi y, a partir de cada uno, fui construyendo su carácter y el momento en el que tendría sentido disfrutar de cada cerveza.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/pichi/web-02.jpg",
          "media/proyectos/pichi/web-03.jpg",
          "media/proyectos/pichi/web-04.jpg"
        ]
      },

      { t: "texto", html: "<p>Chicuela es la más ligera y social de las tres. Su nombre parte de una de las palabras que aparecen en la canción y me gustaba porque transmite una energía fresca y despreocupada. Para representarla utilicé un abanico, un objeto muy ligado a lo cotidiano y a ese gesto tan reconocible de la calle. La combinación de colores y la ilustración buscan darle ese carácter más alegre y fácil de llevar.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/pichi/web-05.jpg",
          "media/proyectos/pichi/web-06.jpg",
          "media/proyectos/pichi/web-07.jpg"
        ]
      },

      { t: "texto", html: "<p>Servidor fue la que más me costó construir porque no quería recurrir a la imagen típica del chulapo para hablar de Madrid. Quería encontrar algo menos evidente que siguiera teniendo sentido dentro de la marca. El nombre viene de la expresión “seguro servidor” y parte de una personalidad más tranquila y pausada. Por eso la ilustración gira alrededor del reloj de bolsillo de los serenos y de una cerveza pensada para disfrutar sin demasiada prisa.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/pichi/web-08.jpg",
          "media/proyectos/pichi/web-09.jpg",
          "media/proyectos/pichi/web-10.jpg"
        ]
      },

      { t: "texto", html: "<p>Candela es la más intensa de las tres. El nombre viene de la expresión “dar candela” y me gustaba porque transmite esa idea de cuando el ambiente empieza a animarse y la tarde se alarga hasta la noche. Para la ilustración utilicé una farola fernandina, un elemento muy reconocible de Madrid, y trabajé una combinación de colores más potente para reforzar ese carácter.</p>" },

      { t: "texto", html: "<p><strong>No quería representar al típico madrileño. Quería que Pichi pudiéramos ser todos.</strong></p>" },

      { t: "texto", html: "<p>Una vez tuve las tres variedades, trabajé las etiquetas como un mismo sistema para que cada una pudiera tener su propia personalidad sin dejar de sentirse parte de la misma marca. También quise dejar cierta libertad en la colocación de la etiqueta secundaria, permitiendo que cambiara de posición y pudiera incluso tapar parte del nombre o de la ilustración.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/pichi/web-11.jpg",
          "media/proyectos/pichi/web-12.jpg",
          "media/proyectos/pichi/web-13.jpg"
        ]
      },

    ]
  },

  // ---------------------------------------------------------------- (05)
  {
    id: 5, slug: "four-seasons", nombre: "Four Seasons × Veuve Clicquot", anio: "2024", disc: "Campaña, Ilustración",
    cat: "campana", img: "media/proyectos/four-seasons/web-07.jpg", destacado: true,
    intro: "Campaña ilustrada de cobranding entre Four Seasons y Veuve Clicquot.",
    bloques: [
      { t: "texto", html: "<p>Este proyecto parte de una campaña ficticia para Four Seasons y Veuve Clicquot que desarrollamos en clase. La propuesta buscaba unir las dos marcas a través de una serie de ilustraciones ambientadas en diferentes destinos del hotel. <br><br> Desde el principio tenía bastante claro que quería alejarme de una representación demasiado realista. En clase habíamos trabajado a Edward Penfield y René Gruau y su forma de utilizar las manchas, el contraste y el color me gustó muchísimo. Me interesaba especialmente cómo el fondo podía tener tanto peso como la propia figura y cómo unos pocos colores podían hacer que una composición destacara sin necesidad de llenarla de elementos.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/four-seasons/web-01.jpg"
        ]
      },

      { t: "texto", html: "<p>Para conseguir ese acabado utilicé un pincel que imitaba el trazo de un rotulador seco, buscando que las formas quedaran algo irregulares y que se notara el gesto. También tomé como referencia las paletas de Edward Penfield, porque me gustaba esa sensación un poco vintage que podía aportar al proyecto. <br><br> Cada destino lo trabajé pensando primero en el propio Four Seasons y en cómo podía representar su personalidad a través de una escena concreta. Para Marrakech me fijé en una de las zonas de restaurante del hotel, jugando con las cortinas rojas, las lámparas y la atmósfera del espacio. En la Riviera Francesa quise llevar la escena al exterior y aprovechar la terraza y la piscina como parte de la composición, rodeada de vegetación y tumbonas. Para Nueva York decidí salir del interior del hotel y utilizar su propia fachada como protagonista, acompañándola de elementos muy reconocibles de la ciudad como el rascacielos y el taxi. <br><br> También diferencié cada destino a través del color. Marrakech tiene una paleta más cálida, con naranjas, turquesas y amarillo. La Riviera Francesa combina verdes oliva y turquesas con el amarillo, mientras que Nueva York se mueve entre azules y morados, manteniendo ese mismo toque amarillo que une toda la campaña.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/four-seasons/web-02.jpg",
          "media/proyectos/four-seasons/web-03.jpg",
          "media/proyectos/four-seasons/web-04.jpg"
        ]
      },

      { t: "texto", html: "<p>Mi favorita es la Riviera Francesa, sobre todo por cómo pude utilizar el agua para deformar la figura de la chica que está buceando. Me gustaba que el entorno no se quedara simplemente como un fondo, sino que también formara parte de la ilustración. <br><br> Una vez definidas las ilustraciones, las adapté pensando en los distintos formatos en los que podría aparecer la campaña. Quería que funcionaran como cartel, publicación de Instagram e historia de Instagram sin perder fuerza al cambiar de proporción.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/four-seasons/web-05.jpg",
          "media/proyectos/four-seasons/web-06.jpg",
          "media/proyectos/four-seasons/web-07.jpg"
        ]
      },

      { t: "texto", html: "<p>El resultado es una campaña formada por tres ilustraciones que representan destinos muy diferentes, pero que comparten una misma forma de entender el color, las manchas y la composición. Me gusta especialmente que el resultado se aleje un poco de lo que normalmente asociamos con una campaña de lujo y que, aun así, siga transmitiendo esa sensación de elegancia.</p>" },

    ]
  },

  {
    id: 6, slug: "puerta-alcala", nombre: "Puerta de Alcalá", anio: "2025", disc: "Ilustración, Cartel, Diseño textil",
    cat: "ilustracion", img: "media/proyectos/puerta-alcala/web-01.jpg", destacado: true,
    intro: "Callejea por Madrid es una propuesta de ilustración para el concurso Reinterpreta la Puerta de Alcalá de 2025.",
    bloques: [
      { t: "texto", html: "<p>El concurso Reinterpreta la Puerta de Alcalá proponía crear una nueva versión de uno de los grandes símbolos de Madrid y aplicarla al diseño de una camiseta promocional para la ciudad. El reto era encontrar una forma de representar Madrid que fuese reconocible, pero que al mismo tiempo aportase una mirada personal y diferente a los símbolos que ya forman parte de su identidad. <br><br> Para comenzar, busqué referencias en elementos que forman parte del paisaje cotidiano de Madrid. Los mosaicos y azulejos de sus calles fueron el punto de partida, junto con una paleta de azules y pequeños toques amarillos y una tipografía de inspiración chulapa. Me interesaba conseguir una estética que mezclase la tradición madrileña con una interpretación más fresca y actual.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/puerta-alcala/web-07.jpg"
        ]
      },

      { t: "texto", html: "<p>A partir de estas referencias nació “Callejea por Madrid”. La idea era convertir la ciudad en un pequeño mosaico, donde cada pieza representase una parte de Madrid y, al unirse, construyese una imagen más completa. <br><br> La Puerta de Alcalá ocupa el centro como punto de partida del recorrido. A su alrededor desarrollé diferentes ilustraciones de iconos de la ciudad, como el Oso y el Madroño y el Templo de Debod. También introduje caminos entre las piezas para hacer referencia a las calles y reforzar la idea de recorrer y descubrir Madrid.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/puerta-alcala/web-01.jpg",
          "media/proyectos/puerta-alcala/web-02.jpg"
        ]
      },

      { t: "texto", html: "<p>El resultado fue un sistema de ilustraciones que podía adaptarse a diferentes aplicaciones. En el cartel, las piezas construyen una composición en forma de mosaico alrededor de la Puerta de Alcalá, mientras que en la camiseta el mismo lenguaje se transforma en una propuesta más gráfica y llevable. <br><br> La propuesta fue seleccionada como finalista del concurso, llevando una reinterpretación personal de Madrid a través de la ilustración y sus elementos más reconocibles.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/puerta-alcala/web-08.jpg",
          "media/proyectos/puerta-alcala/web-05.jpg",
          "media/proyectos/puerta-alcala/web-09.jpg",
          "media/proyectos/puerta-alcala/web-10.jpg"
        ]
      }
    ]
  },

  {
    id: 7, slug: "cata-la-lata", nombre: "Cata la lata", anio: "2026", disc: "Packaging, Producto",
    cat: "marca", img: "media/proyectos/cata-la-lata/web-02.jpg", destacado: true,
    intro: "Serie Atlántica es una propuesta de packaging para el concurso Cata la Lata del 2026.",
    bloques: [
      { t: "texto", html: "<p>Cata la Lata es un concurso de diseño organizado por ANFACO-CECOPESCA y la Fundación Banco Sabadell que busca nuevas propuestas para el packaging de sus conservas de pescado y marisco. En esta edición había que crear una colección para tres variedades, mejillones en escabeche, sardinillas en aceite de oliva y atún claro en aceite de oliva, manteniendo una identidad común entre ellas. <br><br> Desde el principio tenía claro que no quería hacer un packaging que simplemente enseñara el producto. Me apetecía buscar una forma de representar estas conservas desde otro sitio, y ahí fue cuando empecé a pensar en el mar, en el agua y en todo ese movimiento que tiene.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/cata-la-lata/web-01.jpg",
          "media/proyectos/cata-la-lata/web-02.jpg",
          "media/proyectos/cata-la-lata/web-03.jpg"
        ]
      },

      { t: "texto", html: "<p>Quería que las tres variedades pudieran reconocerse sin necesidad de dibujar un mejillón, una sardina y un atún de una forma completamente literal. Empecé a fijarme en sus formas y en sus colores y pensé que podía utilizar todo eso de una manera mucho más libre. <br><br> Me interesaba especialmente la relación con el agua. Quería que el color se moviera, se mezclara y tuviera una parte que no estuviera completamente bajo mi control. Por eso empecé a experimentar con diferentes formas de pintar hasta encontrar una técnica que me permitiera conseguir esa sensación.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/cata-la-lata/web-04.jpg",
          "media/proyectos/cata-la-lata/web-05.jpg",
          "media/proyectos/cata-la-lata/web-06.jpg"
        ]
      },

      { t: "texto", html: "<p>Al principio hice pruebas bastante más literales, intentando que se reconociera claramente cada animal. Pero poco a poco fui soltando esa idea y empecé a trabajar de una forma mucho más intuitiva, añadiendo trazos, manchas y cambios de color. <br><br> Hice muchas pruebas para llegar a las tres ilustraciones finales, pero no buscaba simplemente encontrar el dibujo que mejor representara cada conserva. Quería que funcionaran también como manchas y formas por sí mismas, incluso aunque parte de la figura quedara escondida. <br><br> Ahí fue cuando la acuarela empezó a tener realmente sentido para el proyecto. En vez de intentar controlar todo lo que hacía la pintura, decidí aprovechar lo que ocurría cuando el agua se llevaba el color, cuando dos tonos se mezclaban o cuando un trazo no salía exactamente como esperaba.</em></p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/cata-la-lata/web-07.jpg",
          "media/proyectos/cata-la-lata/web-08.jpg",
          "media/proyectos/cata-la-lata/web-09.jpg",
          "media/proyectos/cata-la-lata/web-10.jpg",
          "media/proyectos/cata-la-lata/web-11.jpg"
        ]
      },

      { t: "texto", html: "<p>Cuando tuve las ilustraciones que quería, las escaneé y trabajé algunos detalles en Photoshop. No quería convertirlas en ilustraciones completamente limpias ni corregir todo lo que había ocurrido sobre el papel. Me gustaba que todavía se pudieran ver pequeñas imperfecciones e incluso algunos trazos del lápiz. <br><br>Después llevé las ilustraciones al packaging y fui buscando cómo colocar los textos sin que terminaran quitándole protagonismo al color y a las formas. Quería que la información estuviera presente, pero que no fuese lo primero que se viera. <br><br> Al final, lo que más me gusta del proyecto es precisamente que no intenta esconder cómo está hecho. La acuarela, las manchas, los trazos y hasta algunas pequeñas imperfecciones forman parte del resultado y hacen que cada envase tenga algo un poco diferente.</em></p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/cata-la-lata/web-12.jpg",
          "media/proyectos/cata-la-lata/web-13.jpg",
          "media/proyectos/cata-la-lata/web-14.jpg"
        ]
      },

    ]
  }

];

const CAT_NOMBRES = {
  seleccionados: "SELECCIONADOS",
  marca: "MARCA",
  campana: "CAMPAÑA",
  ilustracion: "ILUSTRACIÓN"
};

// FICHA — construye la lista del apartado del que vienes, con el actual en negrita
document.addEventListener("DOMContentLoaded", () => {
  const list = document.querySelector(".ficha-list");
  if (!list) return;

  const params = new URLSearchParams(window.location.search);
  let cat = params.get("cat") || "seleccionados";
  if (!CAT_NOMBRES[cat]) cat = "seleccionados";
  const p = params.get("p") || "";
  const esProyecto = x => x.slug === p || String(x.id) === p;

  // "Seleccionados" = solo los que llevan destacado: true (igual que la rejilla)
  const lista = (c) => (c === "seleccionados")
    ? PROYECTOS.filter(x => x.destacado)
    : PROYECTOS.filter(x => x.cat === c);

  let items = lista(cat);

  // Si has llegado a un proyecto que NO está en Seleccionados (por ejemplo
  // desde el Archivo), la lista de al lado pasa a ser la de su categoría —
  // así el proyecto que estás viendo siempre sale en ella.
  if (!items.some(esProyecto)) {
    const suyo = PROYECTOS.find(esProyecto);
    if (suyo) { cat = suyo.cat; items = lista(cat); }
  }

  const current = items.find(esProyecto)?.slug || (items[0] && items[0].slug);

  list.innerHTML = items.map(x => `
    <li class="ficha-item${x.slug === current ? " is-current" : ""}" data-p="${x.slug}" data-img="${x.img}">
      <a href="proyecto.html?p=${x.slug}&cat=${cat}">
        <div><h5>${x.nombre}</h5><p>${x.disc}</p></div>
        <span class="ficha-year">(${x.anio})</span>
      </a>
    </li>`).join("");

  const catEl = document.querySelector(".ficha-cat");
  if (catEl) catEl.textContent = "(" + CAT_NOMBRES[cat] + ")";

  // Nombre + fecha del proyecto actual (visible solo en móvil, en la columna derecha)
  const currentProj = items.find(x => x.slug === current);
  if (currentProj) {
    const nameEl = document.querySelector(".ficha-title-name");
    const yearEl = document.querySelector(".ficha-title-year");
    if (nameEl) nameEl.textContent = currentProj.nombre;
    if (yearEl) yearEl.textContent = "(" + currentProj.anio + ")";

    // Contenido de la derecha (intro + bloques), renderizado desde los datos
    const body = document.querySelector(".ficha-body");
    if (body) {
      let html = "";
      if (currentProj.intro) {
        const badge = currentProj.badge ? ` <span class="ficha-badge">${currentProj.badge}</span>` : "";
        html += `<div class="fb-text reveal"><p class="ficha-lead">${currentProj.intro}${badge}</p></div>`;
      }
      (currentProj.bloques || []).forEach(b => {
        if (b.t === "texto") {
          html += `<div class="fb-text reveal">${b.html}</div>`;

        } else if (b.t === "full") {
          html += `<div class="fb-full reveal"><img src="${b.img}" alt="${currentProj.nombre}"></div>`;

        } else if (b.t === "mosaico" || b.t === "par") {
          // "par" es el nombre antiguo del mosaico de dos fotos, sigue valiendo.
          // El "reveal" va en CADA figure (no en el bloque): así cada foto del
          // mosaico aparece por separado al hacer scroll, no todas de golpe.
          const fotos = (b.imgs || []).map(src =>
            `<figure class="reveal"><img src="${src}" alt="${currentProj.nombre}" loading="lazy"></figure>`).join("");
          html += `<div class="fb-mosaico">${fotos}</div>`;
        }
      });
      body.innerHTML = html;
      if (window.initReveals) window.initReveals(body);
      if (window.ajustarMosaicos) window.ajustarMosaicos(body);
    }
  }
});


/* ============================================================================
   LUPA — la galería de fotos de un proyecto
   ============================================================================
   Al pinchar cualquier foto del contenido de un proyecto se abre una galería
   con TODAS las fotos de ese proyecto, empezando por la que has pinchado.
   Se pasa de una a otra con scroll horizontal (rueda, trackpad, arrastrando en
   el móvil) o con las flechas del teclado. Se cierra pinchando fuera, en
   CERRAR o con Escape.

   Las fotos se ven más grandes, pero NUNCA a pantalla completa ni estiradas
   por encima de su tamaño real — los topes están en el CSS (.lupa-foto img).

   No hay nada que tocar aquí ni en el HTML: coge solas todas las fotos que
   hayas puesto en los bloques del proyecto.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // La lupa (ampliar fotos) es de la ficha de un proyecto. Se crea siempre y se
  // abre con window.abrirLupa(lista, i) por si se reutiliza desde otra página.

  // --- El HTML de la lupa, una sola vez -----------------------------------
  const lupa = document.createElement("div");
  lupa.className = "lupa";
  lupa.setAttribute("aria-hidden", "true");
  lupa.hidden = true;
  lupa.innerHTML =
    `<div class="lupa-pista"></div>` +
    `<button class="lupa-cerrar" type="button">Cerrar</button>` +
    `<button class="lupa-ir lupa-ir--izq" type="button" aria-label="Anterior">&#8592;</button>` +
    `<button class="lupa-ir lupa-ir--der" type="button" aria-label="Siguiente">&#8594;</button>` +
    `<div class="lupa-cuenta"></div>`;
  document.body.appendChild(lupa);

  const pista  = lupa.querySelector(".lupa-pista");
  const cuenta = lupa.querySelector(".lupa-cuenta");
  const irIzq  = lupa.querySelector(".lupa-ir--izq");
  const irDer  = lupa.querySelector(".lupa-ir--der");

  /* ---- AMPLIAR PARA VER EL DETALLE ---------------------------------------
     Pinchando la foto se amplía todavía más y se recorre moviendo el ratón (o
     el dedo). La rueda sube y baja cuánto se amplía. Estos son los topes. */
  const ZOOM_INICIAL = 2.4;
  const ZOOM_MIN = 1.3;
  const ZOOM_MAX = 5;
  let zoom = 0;             // 0 = sin ampliar

  const celdaActiva = () => celdas[Math.max(0, Math.min(celdas.length - 1, objetivo))];

  // A qué punto de la foto se mira (el ratón manda)
  function apuntar(e) {
    const fig = celdaActiva();
    if (!fig || !zoom) return;
    const r = fig.getBoundingClientRect();
    const px = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const py = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    fig.style.setProperty("--ox", px.toFixed(1) + "%");
    fig.style.setProperty("--oy", py.toFixed(1) + "%");
  }

  function ponerZoom(nivel, e) {
    const fig = celdaActiva();
    if (!fig) return;
    zoom = nivel;
    if (nivel) {
      fig.style.setProperty("--zoom", nivel.toFixed(2));
      fig.classList.add("is-zoom");
      if (e) apuntar(e);
    } else {
      fig.classList.remove("is-zoom");
      fig.style.removeProperty("--ox");
      fig.style.removeProperty("--oy");
    }
  }

  function quitarZoom() {
    celdas.forEach(f => {
      f.classList.remove("is-zoom");
      f.style.removeProperty("--ox");
      f.style.removeProperty("--oy");
    });
    zoom = 0;
  }

  // Las fotos a mostrar: { src, alt, w, h }. Se rellena al abrir (window.abrirLupa).
  let fuentes = [];
  // Una "pantalla" por cada foto. Se vuelve a montar cada vez que se abre.
  let celdas = [];
  function montarPista() {
    pista.textContent = "";
    fuentes.forEach(f => {
      const fig = document.createElement("figure");
      fig.className = "lupa-foto";
      const img = document.createElement("img");
      img.src = f.src;
      img.alt = f.alt || "";
      img.loading = "lazy";
      fig.appendChild(img);
      pista.appendChild(fig);

      // El tamaño original de la foto, para no agrandarla más de la cuenta
      const tope = () => {
        if (!img.naturalWidth) return;
        fig.style.setProperty("--nat-w", img.naturalWidth + "px");
        fig.style.setProperty("--nat-h", img.naturalHeight + "px");
      };
      if (f.w && f.h) {
        fig.style.setProperty("--nat-w", f.w + "px");
        fig.style.setProperty("--nat-h", f.h + "px");
      } else if (img.naturalWidth) {
        tope();
      } else {
        img.addEventListener("load", tope);
      }
    });
    celdas = Array.from(pista.children);
    pintarEstado();
  }

  // La foto a la que vamos. Se guarda aparte porque durante el desplazamiento
  // suave el scroll todavía no ha llegado, y si no se pierde la cuenta al dar
  // varias veces seguidas a la flecha.
  let objetivo = 0;

  function indiceActual() {
    const paso = pista.clientWidth || 1;
    return Math.round(pista.scrollLeft / paso);
  }

  function pintarEstado(i) {
    const n = (i === undefined) ? indiceActual() : i;
    cuenta.textContent = (n + 1) + " / " + celdas.length;
    irIzq.disabled = n <= 0;
    irDer.disabled = n >= celdas.length - 1;
  }

  function irA(i, suave) {
    quitarZoom();                 // al cambiar de foto se vuelve al tamaño normal
    objetivo = Math.max(0, Math.min(celdas.length - 1, i));
    pista.scrollTo({ left: objetivo * pista.clientWidth, behavior: suave ? "smooth" : "auto" });
    pintarEstado(objetivo);
  }

  function abrir(i) {
    lupa.hidden = false;
    lupa.setAttribute("aria-hidden", "false");
    document.body.classList.add("lupa-abierta");
    irA(i, false);
    // Un respiro para que el navegador pinte el estado inicial y se note el
    // fundido (con setTimeout, que sí corre aunque la pestaña esté de fondo)
    setTimeout(() => { lupa.classList.add("is-open"); irA(i, false); }, 10);
  }

  function cerrar() {
    quitarZoom();
    lupa.classList.remove("is-open");
    lupa.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lupa-abierta");
    setTimeout(() => { if (!lupa.classList.contains("is-open")) lupa.hidden = true; }, 260);
  }

  // API global: abre la lupa con una lista de fotos (cadenas de src o { src, alt,
  // w, h }) y arranca por la i-ésima. La usan la ficha y la galería.
  window.abrirLupa = function (lista, i) {
    fuentes = (lista || [])
      .map(x => (typeof x === "string" ? { src: x } : x))
      .filter(x => x && x.src);
    if (!fuentes.length) return;
    montarPista();
    abrir((i == null || i < 0) ? 0 : Math.min(i, fuentes.length - 1));
  };

  // Pinchar LA FOTO -> amplía / reduce. Pinchar fuera (o en CERRAR) -> cierra
  lupa.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG") { ponerZoom(zoom ? 0 : ZOOM_INICIAL, e); return; }
    if (e.target.closest(".lupa-ir")) return;
    cerrar();
  });

  // Mientras está ampliada, la foto se recorre moviendo el ratón o el dedo
  pista.addEventListener("mousemove", apuntar);
  pista.addEventListener("touchmove", (e) => {
    if (!zoom || !e.touches[0]) return;
    e.preventDefault();
    apuntar(e.touches[0]);
  }, { passive: false });

  irIzq.addEventListener("click", () => irA(objetivo - 1, true));
  irDer.addEventListener("click", () => irA(objetivo + 1, true));

  // Cuando el scroll lo mueves tú (arrastrando o con el trackpad), manda él
  let t;
  pista.addEventListener("scroll", () => {
    clearTimeout(t);
    t = setTimeout(() => { objetivo = indiceActual(); pintarEstado(objetivo); }, 80);
  }, { passive: true });

  window.addEventListener("resize", () => { if (!lupa.hidden) irA(objetivo, false); });

  // La rueda: si la foto está ampliada, amplía más o menos; si no, pasa de foto
  let ruedaOcupada = false;
  pista.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;   // gesto horizontal: lo hace el navegador
    e.preventDefault();
    if (zoom) {
      const nuevo = zoom * (e.deltaY > 0 ? 0.88 : 1.14);
      ponerZoom(nuevo < ZOOM_MIN ? 0 : Math.min(ZOOM_MAX, nuevo), e);
      return;
    }
    if (ruedaOcupada) return;
    ruedaOcupada = true;
    setTimeout(() => { ruedaOcupada = false; }, 320);
    irA(objetivo + (e.deltaY > 0 ? 1 : -1), true);
  }, { passive: false });

  document.addEventListener("keydown", (e) => {
    if (lupa.hidden) return;
    if (e.key === "Escape") cerrar();
    else if (e.key === "ArrowRight") irA(objetivo + 1, true);
    else if (e.key === "ArrowLeft")  irA(objetivo - 1, true);
  });

  // --- FICHA de proyecto: al pinchar una foto del contenido, abre la lupa con
  //     TODAS las fotos del proyecto, empezando por esa. --------------------
  const body = document.querySelector(".ficha-body");
  if (body) {
    const fotos = () => Array.from(body.querySelectorAll("img"));
    /* Si una foto NO carga (ruta mal escrita, archivo que falta...) no se deja
       el hueco roto: se quita del proyecto y se recoloca el mosaico. */
    body.addEventListener("error", (e) => {
      const img = e.target;
      if (!img || img.tagName !== "IMG") return;
      const fig = img.closest("figure") || img.closest(".fb-full");
      const galeria = img.closest(".fb-mosaico");
      if (fig) fig.remove(); else img.remove();
      if (galeria) {
        galeria._figs = Array.from(galeria.querySelectorAll("figure"));
        galeria._firma = null;
        if (!galeria._figs.length) galeria.remove();
        else if (window.ajustarMosaicos) window.ajustarMosaicos(body);
      }
    }, true);   // true = captura, el evento error de las imágenes no burbujea

    body.addEventListener("click", (e) => {
      const img = e.target.closest("img");
      if (!img || !body.contains(img)) return;
      e.preventDefault();
      const els = fotos();
      const lista = els.map(im => ({
        src: im.getAttribute("src"), alt: im.alt || "",
        w: im.naturalWidth || 0, h: im.naturalHeight || 0
      }));
      const i = els.indexOf(img);
      window.abrirLupa(lista, i < 0 ? 0 : i);
    });
  }
});


/* ============================================================================
   FICHA — la lista de la izquierda, quieta desde el primer momento
   ============================================================================
   La lista es "sticky": se queda pegada mientras lees y se va al llegar al
   footer. El problema era que su sitio pegajoso (el "top" del CSS) no caía
   exactamente donde la lista ya estaba al cargar, así que al empezar a hacer
   scroll daba un pequeño salto para colocarse. Aquí se mide dónde está de
   verdad y se le pone ese mismo valor, así no se mueve nada.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".ficha-menu");
  if (!menu) return;

  function colocar() {
    // En móvil la lista no se ve (el CSS la oculta), no hay nada que medir
    if (!menu.offsetParent) return;
    // Se quita el sticky un instante para leer su posición natural, sin que la
    // propia pegajosidad falsee la medida.
    const antes = menu.style.position;
    menu.style.position = "static";
    const natural = menu.getBoundingClientRect().top + window.scrollY;
    menu.style.position = antes;
    if (natural > 0) menu.style.top = Math.round(natural) + "px";
  }

  colocar();
  window.addEventListener("load", colocar);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(colocar);

  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(colocar, 150); });

  // La barra (SELECCIONADOS)/VOLVER acompaña a la lista: mientras la lista está
  // fija (leyendo la derecha) la barra también; cuando la lista empieza a subir
  // (al final de la ficha) la barra sube lo mismo, así se van juntas.
  const top = document.querySelector(".ficha-top");
  if (top) {
    const sync = () => {
      // En móvil la lista está oculta: la barra va en el flujo, sin transform.
      if (!menu.offsetParent) { top.style.transform = ""; return; }
      const fijado = parseFloat(getComputedStyle(menu).top) || 0;   // dónde se clava la lista
      const delta = fijado - menu.getBoundingClientRect().top;      // cuánto ha subido ya
      top.style.transform = delta > 0 ? `translateY(${-delta}px)` : "";
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("load", sync);
  }
});


// FICHA — abrir siempre arriba del todo, sin que el navegador recupere el
// scroll de la visita anterior (era lo que hacía ese desplazamiento raro al
// entrar en un proyecto).
if (document.body && document.body.classList.contains("page-ficha") && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}


// ENTRADA al entrar a una pantalla: la pantalla arranca "vacía" y los elementos
// van apareciendo de forma DESIGUAL (desde un pequeño desplazamiento, con retardo
// aleatorio). Ocurre en cada carga de página.
document.addEventListener("DOMContentLoaded", () => {
  if (!window.gsap) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Elementos a animar según la página (los textos de Sobre mí los anima el
  // sistema de "reveal", así que aquí solo van el nombre y las fotos).
  const sels = [
    ".sm-photo", ".sm-name",                    // sobre mí (collage fijo)
    ".historia-volver", ".historia-title",      // quién es Lore: solo los fijos (el resto va por "reveal" al hacer scroll)
    ".proy-head", ".proy-title", ".proy-desc", ".proy-filter", ".proy-card" // proyectos
    // La ficha NO entra aquí: su contenido se anima aparte (reveals).
    // El contenido de historia (foto grande, fecha, textos, orla) tampoco:
    // usa "reveal" para que aparezca A MEDIDA que se hace scroll.
  ];
  const els = [];
  sels.forEach(s => document.querySelectorAll(s).forEach(e => { if (!els.includes(e)) els.push(e); }));
  if (!els.length) return;

  gsap.set(els, { opacity: 0, y: () => gsap.utils.random(18, 52) });
  const tl = gsap.to(els, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    stagger: { each: 0.08, from: "random" },
    clearProps: "transform"
  });

  // Red de seguridad: si la animación no llega a correr (p. ej. la pestaña se
  // carga en segundo plano y el navegador pausa las animaciones), forzamos que
  // el contenido acabe visible de todas formas. Nunca se queda invisible.
  setTimeout(() => {
    if (tl.progress() < 1) {
      gsap.killTweensOf(els);
      gsap.set(els, { opacity: 1, y: 0, clearProps: "transform" });
    }
  }, 2500);
});


// SOBRE MÍ — scroll "infinito": al terminar en el contacto, si sigues bajando
// vuelve a empezar por "Soy Lorena Sánchez…". El texto pasa por DETRÁS de las fotos
// (ya está así por z-index). Solo en el layout de escritorio (>900px).
document.addEventListener("DOMContentLoaded", () => {
  const text = document.querySelector(".sm-text");
  const base = text && text.querySelector(".sm-loop");
  if (!base) return;

  const mq = window.matchMedia("(min-width: 901px)");
  let clones = [], loopH = 0, top1 = 0, enabled = false, ticking = false;

  // El clon conserva .reveal para re-animarse al aparecer (scroll infinito).
  // Solo limpiamos estilos en línea de la entrada y los ids duplicados.
  function clean(root) {
    root.querySelectorAll(".sm-intro, .sm-name, .sm-photo").forEach(el => {
      el.style.opacity = ""; el.style.transform = ""; el.style.transitionDelay = "";
    });
    root.querySelectorAll(".reveal").forEach(el => el.classList.remove("is-visible"));
    root.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
  }

  function measure() {
    top1 = base.getBoundingClientRect().top + window.scrollY;
    if (clones[0]) {
      loopH = clones[0].getBoundingClientRect().top - base.getBoundingClientRect().top;
    }
  }

  function addClone() {
    const c = base.cloneNode(true);
    c.classList.add("sm-loop--clone");
    c.setAttribute("aria-hidden", "true");
    clean(c);
    text.appendChild(c);
    clones.push(c);
    if (window.initReveals) window.initReveals(c);   // observa los reveals del clon
  }

  function build() {
    if (enabled) return;
    document.documentElement.style.scrollBehavior = "auto";  // el salto del bucle es instantáneo
    document.body.style.scrollBehavior = "auto";
    addClone();
    measure();
    if (loopH <= 0) { destroy(); return; }
    // Suficientes copias para que nunca quede hueco al reiniciar
    const need = Math.max(2, Math.ceil(window.innerHeight / loopH) + 1);
    let guard = 0;
    while (clones.length < need && guard++ < 8) addClone();
    enabled = true;
  }

  function destroy() {
    clones.forEach(c => c.remove());
    clones = [];
    enabled = false;
  }

  function onScroll() {
    if (!enabled || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (loopH > 0 && y >= top1 + loopH) {
        // Salto instantáneo y SIN animación de reveal en ese frame, para que el
        // reinicio no se note (nada de "raya"/salto). El contenido es idéntico.
        document.body.classList.add("sm-jump");
        window.scrollTo(0, y - loopH);
        requestAnimationFrame(() => document.body.classList.remove("sm-jump"));
      }
      ticking = false;
    });
  }

  function sync() { if (mq.matches) build(); else destroy(); }

  sync();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", () => { if (enabled) measure(); });
  // Las fuentes cambian la altura del texto: re-medir cuando estén listas
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { if (enabled) measure(); });
  }
  window.addEventListener("resize", () => { destroy(); sync(); });
  if (mq.addEventListener) mq.addEventListener("change", () => { destroy(); sync(); });
});


// ARCHIVO (landing) — pared de trabajos DISPERSA (no rejilla), con un gran centro
// libre para el texto (estilo referencia). Se ARRASTRA para explorar (no hay scroll)
// con un leve parallax entre piezas. Al pasar el ratón por una pieza, el texto
// central cambia a su nombre y la pieza se resalta (las demás se atenúan).
document.addEventListener("DOMContentLoaded", () => {
  const vp = document.querySelector(".archivo-viewport");
  const canvas = document.querySelector(".archivo-canvas");
  const center = document.querySelector(".archivo-center");
  const centerText = document.querySelector(".archivo-center-text");
  if (!vp || !canvas || !window.gsap) return;

  /* ---- QUÉ IMÁGENES SALEN EN EL ARCHIVO --------------------------------
     Se cogen TODAS las imágenes de todos los proyectos (la miniatura + las de
     los mosaicos). Así, al añadir fotos a un proyecto, aparecen solas aquí.
     Si alguna vez quieres que una foto NO salga en el archivo, quítala del
     mosaico o mueve el proyecto de sitio.
     -------------------------------------------------------------------- */
  function imagenesDeProyecto(p) {
    const lista = [p.img];
    (p.bloques || []).forEach(b => {
      if (b.t === "mosaico" || b.t === "par") lista.push(...(b.imgs || []));
      else if (b.t === "full" && b.img) lista.push(b.img);
    });
    return lista;
  }

  const barajar = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---- CUÁNTAS FOTOS SALEN EN LA PARED -----------------------------------
     No salen todas: llenaban demasiado y agobiaban. Sale AL MENOS UNA de cada
     proyecto —elegida al azar cada vez que se entra, así la portada nunca es
     igual— y luego se completa con más, repartiendo por turnos entre proyectos
     para que no se llene de las del que más fotos tiene.

     Sube o baja CUANTAS si la quieres más llena o más despejada.
     -------------------------------------------------------------------- */
  const CUANTAS = 36;

  const proyectos = (typeof PROYECTOS !== "undefined") ? PROYECTOS : [];
  const vistas = new Set();

  // Las fotos de cada proyecto, sin repetir y en orden aleatorio
  const porProyecto = proyectos.map(p => {
    const fotos = [];
    imagenesDeProyecto(p).forEach(src => {
      if (vistas.has(src)) return;          // sin repetir la misma foto
      vistas.add(src);
      fotos.push({ img: src, nombre: p.nombre, id: p.id, slug: p.slug, cat: p.cat });
    });
    return barajar(fotos);
  });

  const data = [];
  // 1) una de cada proyecto, seguro
  porProyecto.forEach(fotos => { if (fotos.length) data.push(fotos.shift()); });
  // 2) y se completa por turnos hasta llegar a CUANTAS
  let quedan = true;
  while (data.length < CUANTAS && quedan) {
    quedan = false;
    for (const fotos of porProyecto) {
      if (!fotos.length) continue;
      quedan = true;
      data.push(fotos.shift());
      if (data.length >= CUANTAS) break;
    }
  }
  // Se barajan para que no salgan agrupadas por proyecto
  barajar(data);

  if (!data.length) return;

  const DEFAULT_HTML = centerText ? centerText.innerHTML : "";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let drag = null, items = [], startX = 0, startY = 0, anchoTexto = 0;

  // Hover: el texto CENTRAL cambia al nombre de la pieza y se resalta la pieza
  // (las demás se atenúan). La línea de abajo "Arrastra para explorar" NO cambia
  // (se queda fija), como pidió Lorena.
  canvas.addEventListener("mouseover", e => {
    const it = e.target.closest(".archivo-item");
    if (!it) return;
    const nombre = it.getAttribute("data-nombre");
    if (centerText) centerText.textContent = nombre;
    canvas.classList.add("has-hover");
    it.classList.add("is-hover");
  });
  canvas.addEventListener("mouseout", e => {
    const it = e.target.closest(".archivo-item");
    if (!it) return;
    if (centerText) centerText.innerHTML = DEFAULT_HTML;
    canvas.classList.remove("has-hover");
    it.classList.remove("is-hover");
  });

  // Parallax: cada pieza se desplaza un poco distinto al arrastrar (según profundidad)
  function applyParallax(x, y) {
    const dx = x - startX, dy = y - startY;
    items.forEach(it => {
      const d = parseFloat(it.dataset.depth) - 1;
      it.style.transform = "translate(" + (dx * d * 0.14).toFixed(1) + "px," + (dy * d * 0.14).toFixed(1) + "px)";
    });
  }

  function build() {
    const vw = vp.clientWidth, vh = vp.clientHeight;
    if (vw < 10 || vh < 10) return;
    canvas.innerHTML = ""; items = [];
    // El texto va DENTRO de la pared, así que se vuelve a meter cada vez que
    // se reconstruye (el innerHTML de arriba lo ha vaciado todo).
    if (center) canvas.appendChild(center);

    /* ---- LOS NÚMEROS QUE PUEDES TOCAR --------------------------------------
       AIRE — cuánto espacio se deja alrededor del texto antes de que empiecen
         las imágenes, en proporción al ancho de la ventana. Bájalo y las
         imágenes se pegan más al texto.
       ANCHO_* — el tamaño de cada imagen. Se calcula con el ancho de la
         pantalla, pero con un mínimo y un máximo en píxeles para que ni en un
         móvil salgan diminutas ni en un monitor enorme salgan gigantes.
       -------------------------------------------------------------------- */
    const AIRE       = 0.028;
    const ANCHO_PROP = [0.15, 0.21];    // proporción del ancho de la ventana (más grandes, sobre todo las pequeñas)
    const ANCHO_TOPE = [175, 360];      // mínimo y máximo en píxeles
    // Alto que se le reserva a cada pieza para repartirlas, en proporción a su
    // ancho. El alto de verdad lo da la imagen al cargar; esto es una estimación.
    const RESERVA_ALTO = 1.05;
    // Y esto es lo MÁS alta que puede llegar a salir una foto (las verticales de
    // 1500x2250 o parecidas). Solo hace falta para no taparle el texto.
    const ALTO_MAXIMO  = 2.0;
    // Lo llena que queda la pared (1 = a reventar). Baja el número y habrá más
    // sitio vacío entre las fotos.
    const LLENADO   = 0.76;

    const anchoMin = Math.round(gsap.utils.clamp(ANCHO_TOPE[0], ANCHO_TOPE[1], vw * ANCHO_PROP[0]));
    const anchoMax = Math.round(gsap.utils.clamp(ANCHO_TOPE[0], ANCHO_TOPE[1], vw * ANCHO_PROP[1]));

    // SALEN TODAS LAS FOTOS DE LA WEB, UNA SOLA VEZ CADA UNA. Antes había un
    // tope de 44 piezas y se quedaban fuera las últimas; y si algún día hubiera
    // menos fotos que piezas, se habrían repetido. Ninguna de las dos cosas
    // pasa ya: una pieza por foto, ni más ni menos.
    const N = data.length;

    // El lienzo (la pared que se arrastra) se calcula para que quepan esas N
    // fotos con el aire que diga LLENADO. Nunca menor que FACTOR_MIN veces la
    // ventana, para que siempre haya algo que explorar arrastrando.
    const FACTOR_MIN = (vw < 760) ? 2.3 : 2.15;   // más grande = más espacio para arrastrar
    const anchoMedio = (anchoMin + anchoMax) / 2;
    const areaNecesaria = N * anchoMedio * anchoMedio * RESERVA_ALTO / LLENADO;
    const FACTOR = Math.max(FACTOR_MIN, Math.sqrt(areaNecesaria / (vw * vh)));
    const cw = Math.round(vw * FACTOR);
    const ch = Math.round(vh * FACTOR);
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";

    // El claro del centro se calcula con lo que MIDE EL TEXTO de verdad, no con
    // un porcentaje a ojo. Antes se usaba la caja que lo contiene (mucho más
    // ancha que las letras) y por eso las imágenes quedaban lejísimos.
    // Se mide la CAJA del texto (no las letras): así el hueco vale también
    // para el nombre del proyecto que aparece al pasar el ratón, que puede ser
    // más largo que la frase de partida.
    const rTexto = center ? center.getBoundingClientRect() : null;
    anchoTexto = (rTexto && rTexto.width) ? rTexto.width : vw * 0.3;
    const altoTexto = (rTexto && rTexto.height) ? rTexto.height : vh * 0.14;
    const aire = vw * AIRE;

    // El hueco del centro es CUADRADO: se toma el lado mayor del bloque de
    // texto y se le suma el aire. Antes era una elipse ancha y baja, y el
    // hueco quedaba con forma de sobre en vez de cuadrado.
    const cx = cw / 2, cy = ch / 2;
    const hueco = Math.max(anchoTexto, altoTexto) / 2 + aire;
    const placed = [];

    /* ---- POR DONDE NO SE PONEN FOTOS ---------------------------------------
       Donde caen los rótulos fijos —el menú de arriba y MADRID, SP / 2026 ©—
       con la pared en su sitio de partida. Así al entrar se leen limpios.
       Si arrastras, sí pasan imágenes por detrás: para eso llevan el halo
       difuminado (está en el CSS, busca "HALO").
       -------------------------------------------------------------------- */
    const desX = (cw - vw) / 2, desY = (ch - vh) / 2;   // el lienzo arranca centrado
    const MARGEN_ROTULO = 18;
    const zonas = [];
    // Se miden LAS LETRAS, no la barra entera: entre ARCHIVO/PROYECTOS/SOBRE MÍ
    // y LORENA SÁNCHEZ hay un hueco enorme, y entre MADRID, SP y 2026 © otro.
    // Ahí sí pueden ir fotos, y si no la portada se quedaba medio vacía.
    document.querySelectorAll(".site-nav a, .site-nav .nav-toggle, .site-baseline--fixed span, .archivo-hint")
      .forEach(el => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        zonas.push({
          x: desX + r.left - MARGEN_ROTULO,
          y: desY + r.top  - MARGEN_ROTULO,
          w: r.width  + MARGEN_ROTULO * 2,
          h: r.height + MARGEN_ROTULO * 2
        });
      });
    const pisaRotulo = (x, y, w, h) => zonas.some(z =>
      !(x + w <= z.x || z.x + z.w <= x || y + h <= z.y || z.y + z.h <= y));

    /* ---- CÓMO SE REPARTEN LAS FOTOS ----------------------------------------
       Para cada foto se sortean muchas posiciones y se elige LA MEJOR, no la
       primera que valga. "Mejor" = la que queda más lejos de las demás, y sin
       otra foto del mismo proyecto al lado (dos fotos del mismo trabajo se
       parecen mucho y juntas cantan como si fueran la misma).

       Antes se cogía la primera posición libre, y eso dejaba unos sitios
       apelotonados y otros vacíos. Así queda repartido parejo y, además,
       siempre entran TODAS las fotos.
       -------------------------------------------------------------------- */
    const distanciaAlMasCercano = (a) => {
      let min = Infinity;
      for (const b of placed) {
        const d = Math.hypot((a.x + a.w / 2) - (b.x + b.w / 2), (a.y + a.h / 2) - (b.y + b.h / 2));
        if (d < min) min = d;
      }
      return min;
    };
    // Lo cerca que le queda la foto MÁS CERCANA DE SU MISMO PROYECTO
    const distanciaAlMismo = (a, id) => {
      let min = Infinity;
      for (const b of placed) {
        if (b.id !== id) continue;
        const d = Math.hypot((a.x + a.w / 2) - (b.x + b.w / 2), (a.y + a.h / 2) - (b.y + b.h / 2));
        if (d < min) min = d;
      }
      return min;
    };

    for (let n = 0; n < N; n++) {
      const p = data[n];
      const w = Math.round(gsap.utils.random(anchoMin, anchoMax));
      // Alto aproximado que se le reserva a la pieza. El real lo da la imagen
      // cuando carga, así que esto es una estimación: si se pasa de generosa,
      // quedan bandas vacías; si se queda corta, se pisan un poco más (que es
      // justo el aire de collage que buscamos).
      const h = Math.round(w * RESERVA_ALTO);
      let mejor = null, mejorNota = -Infinity;

      // Las fotos se quedan ENTERAS dentro de la pared (sin sangrar por los
      // bordes) y con un pequeño margen para que no toquen el borde: así se ve
      // siempre la imagen completa al arrastrar hasta ella.
      const bordeX = w * 0.15, bordeY = h * 0.15;

      for (let k = 0; k < 280; k++) {
        const x = gsap.utils.random(bordeX, cw - w - bordeX);
        const y = gsap.utils.random(bordeY, ch - h - bordeY);
        const mx = x + w / 2, my = y + h / 2;
        // Hueco CUADRADO del centro. Se mide con la pieza ENTERA, no solo con
        // su centro, para que el claro que se ve sea el que dice "hueco".
        //
        // En vertical se mide distinto según la pieza esté por DEBAJO o por
        // ENCIMA del texto: la imagen crece hacia abajo desde donde la
        // colocamos, así que por debajo manda su borde de arriba (que sí
        // conocemos) y por encima manda el de abajo, que depende del alto
        // real. Por eso ahí se es generoso — si no, una foto vertical acaba
        // metiéndose detrás del título.
        const dy = my - cy;
        const margenY = (dy >= 0 ? h / 2 : w * ALTO_MAXIMO - h / 2);
        if (Math.abs(mx - cx) < hueco + w / 2 && Math.abs(dy) < hueco + margenY) continue;
        if (pisaRotulo(x, y, w, h)) continue;

        const caja = { x, y, w, h };
        // Nota = lo lejos que queda de la foto más cercana. Se corta en w*2.4
        // para que no se vayan todas a los bordes buscando el récord.
        let nota = Math.min(distanciaAlMasCercano(caja), w * 2.4);
        // Y un castigo por tener cerca otra foto del mismo proyecto — cuanto
        // más cerca, más castigo. Es gradual a propósito: hay proyectos con 13
        // fotos y exigirles a todas una distancia fija sería imposible de
        // cumplir, así que en vez de descartar, se prefiere la que menos pega.
        const SEPARA = w * 1.8;
        const dMismo = distanciaAlMismo(caja, p.id);
        if (dMismo < SEPARA) nota -= (SEPARA - dMismo) * 2.5;
        if (nota > mejorNota) { mejorNota = nota; mejor = caja; }
      }
      if (!mejor) continue;
      const { x, y } = mejor;
      const a = document.createElement("a");
      a.className = "archivo-item";
      a.href = "proyecto.html?p=" + p.slug + "&cat=" + (p.cat || "seleccionados");
      a.setAttribute("data-nombre", p.nombre);
      a.style.width = w + "px";
      a.style.left = Math.round(x) + "px";
      a.style.top = Math.round(y) + "px";
      a.dataset.depth = gsap.utils.random(0.9, 1.12).toFixed(3);
      const img = document.createElement("img");
      img.src = p.img; img.alt = p.nombre; img.setAttribute("draggable", "false");
      // Si la foto no carga (ruta mal escrita, archivo que falta) se quita la
      // pieza entera: mejor un hueco que un icono de imagen rota en la portada.
      img.addEventListener("error", () => {
        a.remove();
        const i = items.indexOf(a);
        if (i >= 0) items.splice(i, 1);
      });
      a.appendChild(img);
      canvas.appendChild(a);
      placed.push({ x, y, w, h, id: p.id });
      items.push(a);
    }

    /* Al repartir solo se sabe el ANCHO de cada foto; el alto de verdad no
       llega hasta que la imagen carga, y una vertical puede acabar metiéndose
       en la franja de los rótulos. Así que en cuanto están todas cargadas se
       repasa y se aparta la que haya quedado encima, por el lado más cerca. */
    function separarDeRotulos() {
      if (!zonas.length) return;
      items.forEach(a => {
        const alto = a.offsetHeight;
        if (!alto) return;
        const y0 = parseFloat(a.style.top);
        const x0 = parseFloat(a.style.left);
        const ancho = parseFloat(a.style.width);
        // Solo estorban los rótulos que le pillan de lado a lado
        const estorban = zonas.filter(z => !(x0 + ancho <= z.x || z.x + z.w <= x0));
        if (!estorban.length) return;
        // ¿Cabe en esta altura sin tocar ninguno? (puede sangrar un poco por
        // arriba y por abajo, igual que al repartirlas)
        const libre = (y) => y >= -alto * 0.35 && y <= ch - alto * 0.65 &&
          estorban.every(z => y + alto <= z.y || z.y + z.h <= y);
        if (libre(y0)) return;
        // Se prueban los bordes de cada rótulo y se coge el que menos la mueva
        const candidatos = [];
        estorban.forEach(z => candidatos.push(z.y - alto, z.y + z.h));
        const buenos = candidatos.filter(libre);
        if (!buenos.length) return;   // no hay hueco donde quepa: se queda
        buenos.sort((p, q) => Math.abs(p - y0) - Math.abs(q - y0));
        a.style.top = Math.round(buenos[0]) + "px";
      });
    }

    // Se repasa cada vez que carga una foto (no al final), para que se coloque
    // mientras aún están apareciendo y no se vea ningún salto.
    items.forEach(a => {
      const im = a.querySelector("img");
      if (im.complete) separarDeRotulos();
      else {
        im.addEventListener("load", separarDeRotulos);
        im.addEventListener("error", separarDeRotulos);
      }
    });
    setTimeout(separarDeRotulos, 1800);   // red de seguridad por si alguna no carga

    // El texto, en el centro exacto de la pared
    if (center) {
      center.style.left = Math.round(cw / 2) + "px";
      center.style.top  = Math.round(ch / 2) + "px";
    }

    // Posición inicial: lienzo centrado
    startX = Math.round((vw - cw) / 2);
    startY = Math.round((vh - ch) / 2);
    gsap.set(canvas, { x: startX, y: startY });

    // Arrastrar mueve TODO el lienzo (bounds: sus bordes no entran en la ventana)
    if (drag) drag.kill();
    if (window.Draggable) {
      drag = Draggable.create(canvas, {
        type: "x,y",
        dragClickables: true,
        bounds: { minX: vw - cw, maxX: 0, minY: vh - ch, maxY: 0 },
        onPress() { canvas.classList.add("is-grabbing"); },
        onRelease() { canvas.classList.remove("is-grabbing"); },
        onDrag() { applyParallax(this.x, this.y); }
      })[0];
    }

    // Entrada desigual (pantalla vacía  se llena). La escala va en la imagen para
    // no pisar el transform de parallax del enlace; se limpia al acabar.
    if (!reduce) {
      const imgs = items.map(it => it.querySelector("img"));
      gsap.set(imgs, { opacity: 0, scale: 0.88, transformOrigin: "50% 50%" });
      const tl = gsap.to(imgs, {
        opacity: 1, scale: 1, duration: 0.6, ease: "power2.out",
        stagger: { each: 0.06, from: "random" }, clearProps: "transform"
      });
      setTimeout(() => { if (tl.progress() < 1) { gsap.killTweensOf(imgs); gsap.set(imgs, { opacity: 1, clearProps: "transform" }); } }, 2500);
    }
  }

  // Esperar a que la ventana tenga tamaño real antes de repartir las piezas.
  // Se intenta por varios caminos a propósito: requestAnimationFrame NO corre
  // si la pestaña está en segundo plano, y entonces la pared no se montaba
  // hasta que volvías a ella. Con el temporizador y el evento de carga, se
  // monta igual. El "if (!items.length)" evita repartirla dos veces.
  const listo    = () => vp.clientWidth > 10 && vp.clientHeight > 10;
  const intentar = () => { if (!items.length && listo()) build(); };

  let tries = 0;
  const tick = () => {
    if (listo()) { build(); return; }
    if (tries++ > 45) return;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.addEventListener("load", intentar);
  setTimeout(intentar, 600);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) intentar(); });

  // La tipografía tarda un poco en cargar y el texto del centro cambia de
  // tamaño. Como el claro del centro se calcula con lo que mide, hay que
  // repartir otra vez si ha cambiado de verdad.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!center || !items.length) return;
      const r = center.getBoundingClientRect();
      if (r.width && Math.abs(r.width - anchoTexto) > 8) build();
    });
  }

  // recolocar al cambiar el tamaño de la ventana
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 250); });
});


// FOOTER — el nombre gigante se ajusta EXACTO al ancho de la tarjeta.
// Sin esto, en tablet y móvil el nombre se salía por los lados (se recortaba).
// Y si aun así saldría demasiado pequeño, se cambia por las iniciales "L.S.".
document.addEventListener("DOMContentLoaded", () => {
  const name = document.querySelector(".foot-name");
  if (!name) return;

  const MIN = 28;    // px — tamaño mínimo de seguridad
  const MAX = 152;   // px — 9.5rem, el tope del diseño
  const MINI = 46;    // px — por debajo de esto se pasa a "L.S."
  //      (sube el número si quieres que cambie antes)

  // Mide cuánto ocuparía el nombre a 100px y devuelve el tamaño que lo hace
  // caber justo en el ancho de la tarjeta
  function medir() {
    const hueco = name.clientWidth;
    if (!hueco) return 0;
    name.style.fontSize = "100px";
    const ancho = name.scrollWidth;
    if (!ancho) { name.style.fontSize = ""; return 0; }
    return (hueco / ancho) * 100 * 0.99;
  }

  function fit() {
    // Primero se prueba con el nombre normal
    name.classList.remove("es-mini");
    let size = medir();
    if (!size) return;

    // Si sale demasiado pequeño, se usan las iniciales y se vuelve a medir
    if (size < MINI) {
      name.classList.add("es-mini");
      const conIniciales = medir();
      if (conIniciales) size = conIniciales;
    }

    name.style.fontSize = Math.min(MAX, Math.max(MIN, size)).toFixed(2) + "px";
  }

  fit();
  // Las tipografías cambian el ancho al cargar: se vuelve a medir
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener("load", fit);

  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fit, 120); });
});


// SOBRE MÍ — "Escríbeme" lleva al apartado (CONTACTO) y lo deja bien colocado
// en pantalla, no pegado al borde de arriba.
document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".sm-text")) return;

  // Delegado: así también funciona en las copias que crea el bucle infinito
  document.addEventListener("click", (e) => {
    const enlace = e.target.closest('.sm-text a[href="#contacto"]');
    if (!enlace) return;
    const destino = document.getElementById("contacto");
    if (!destino) return;
    e.preventDefault();

    // (CONTACTO) queda CENTRADO en la pantalla — ni pegado arriba ni abajo.
    // El margen es lo que sobra por encima: la mitad del hueco libre. Nunca
    // menos que el menú, para que no se meta por debajo de la barra.
    const nav = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue("--nav-h")) || 90;
    const alto = destino.getBoundingClientRect().height;
    const margen = Math.max(nav + 24, (window.innerHeight - alto) / 2);

    const y = destino.getBoundingClientRect().top + window.scrollY - margen;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  });
});


/* La foto de pequeña ya no se aparta al hacer scroll — ahora vive DENTRO del
   texto (ver sobremi.html), así que sube con él y vuelve a salir en cada vuelta
   del bucle. Por eso aquí ya no hace falta ningún código. */


/* ============================================================================
   GALERÍA — estudios de arte  [pintura.html]
   ----------------------------------------------------------------------------
   - Fuente de verdad: media/proyectos/pintura/web-obras.json (ver web-LEEME-obras.md).
     Cada OBRA lleva titulo, tecnica, descripcion, principal + detalles[] + proceso[].
     La ENTRADA muestra SOLO la `principal` de cada obra con publicar:true (portada),
     en una columna, con su técnica al lado. NO se deduce nada del nombre del archivo.
   - Al pinchar una obra: el texto de la izquierda cambia al de la obra (titulo/
     tecnica/descripcion) y a la derecha aparece una TIRA HORIZONTAL EN BUCLE con
     principal -> detalles -> proceso. Solo las imágenes cambian (fundido).
   - Para cambiar textos, qué se publica, principal/detalle/proceso o el orden, se
     edita el JSON. Aquí NO se toca nada.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.querySelector(".page-lienzo");
  const grid = page && page.querySelector(".lienzo-grid");
  const info = page && page.querySelector("#galInfo");
  if (!grid) return;

  const DIR = "media/proyectos/pintura/";
  const infoDefault = info ? info.innerHTML : "";   // texto de la PÁGINA (para restaurar)
  const bucleVertical = window.matchMedia("(min-width: 901px)").matches;  // el bucle solo en escritorio
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const eyebrowEl = () => page.querySelector(".lienzo-eyebrow");
  // Fundido + leve desplazamiento (como el resto de páginas). Reutilizable.
  function fade(els) {
    els = (els || []).filter(Boolean);
    if (!els.length) return;
    if (reduce || !window.gsap) { els.forEach(el => { el.style.opacity = ""; }); return; }
    gsap.killTweensOf(els);
    gsap.fromTo(els,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: els.length > 1 ? 0.1 : 0, clearProps: "transform,opacity" });
  }
  // Al VOLVER anima SOLO la rejilla (lo que cambia).
  function animarEntrada(conTexto) {
    if (reduce || !window.gsap) { grid.style.opacity = ""; return; }
    fade(conTexto ? [eyebrowEl(), info, grid] : [grid]);
  }

  const grande = im => {
    const partes = (im.srcset || "").split(",").map(s => s.trim()).filter(Boolean);
    return partes.length ? partes[partes.length - 1].split(/\s+/)[0] : im.src;
  };
  const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Cuando TODAS las imágenes de un contenedor tienen tamaño real, ejecuta cb.
  function alCargar(cont, cb) {
    const els = Array.from(cont.querySelectorAll("img"));
    let quedan = els.length || 1;
    const listo = () => { if (--quedan <= 0) cb(); };
    if (!els.length) return cb();
    els.forEach(im => { if (im.complete) listo(); else { im.addEventListener("load", listo, { once: true }); im.addEventListener("error", listo, { once: true }); } });
    setTimeout(cb, 700);   // red de seguridad
  }

  let obras = [], oneLen = 0, periodo = 0;

  // Escondemos el texto de la izquierda desde ya, para que no parpadee antes de
  // que la animación de entrada lo revele (el fetch tarda un instante).
  if (!reduce && window.gsap) gsap.set([page.querySelector(".lienzo-eyebrow"), info].filter(Boolean), { opacity: 0 });

  fetch(DIR + "web-obras.json")
    .then(r => r.json())
    .then(construir)
    .catch(err => {
      console.warn("GALERÍA — no se pudo cargar web-obras.json:", err);
      if (window.gsap) gsap.set([page.querySelector(".lienzo-eyebrow"), info].filter(Boolean), { opacity: 1 });
    });

  const itemHTML = (o, i, eager) => {
    const im = o.principal;
    const horiz = (im.w || 0) >= (im.h || 0);
    const alt = (o.titulo ? o.titulo + " — " : "") + "obra de Lorena Sánchez";
    const tag = o.tecnica ? `<span class="lienzo-tag">(${esc(o.tecnica)})</span>` : "";
    return `<figure class="lienzo-item ${horiz ? "is-horiz" : "is-vert"}" data-i="${i}">
      <img src="${im.src}" srcset="${im.srcset}" sizes="(max-width: 900px) 92vw, ${horiz ? "60vw" : "20vw"}"
           width="${im.w}" height="${im.h}" alt="${esc(alt)}"
           ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>
      ${tag}
    </figure>`;
  };

  function construir(data) {
    obras = (data || []).filter(o => o && o.publicar);
    oneLen = obras.length;

    const uno = obras.map((o, i) => itemHTML(o, i, i === 0)).join("");
    // En escritorio, 3 copias para el scroll vertical EN BUCLE. En móvil, una.
    grid.innerHTML = bucleVertical ? (uno + uno + uno) : uno;

    grid.addEventListener("click", e => {
      if (gridMov > 6) { gridMov = 0; return; }   // fue un arrastre, no un clic
      const fig = e.target.closest(".lienzo-item");
      if (fig) abrirObra(parseInt(fig.dataset.i, 10));
    });

    hoverCue();
    if (bucleVertical) {
      // El texto entra como en el resto de páginas. La rejilla se coloca YA en su
      // sitio (centrada) y se mantiene invisible hasta entonces; después solo hace
      // un fundido de OPACIDAD (sin desplazarse), así las imágenes aparecen ya
      // colocadas en su sitio, no "entran" moviéndose.
      fade([eyebrowEl(), info]);
      grid.style.opacity = "0";
      centrarEntrada();                        // los altos están reservados (width/height): coloca bien ya
      let revelada = false;                    // alCargar puede llamar 2 veces (carga + red de seguridad)
      alCargar(grid, () => {
        centrarEntrada();                      // reafirma cuando las imágenes tienen su alto real
        if (revelada) return;
        revelada = true;
        grid.style.opacity = "";
        if (!reduce && window.gsap) gsap.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
      });
    } else {
      animarEntrada(true);   // móvil: texto + obras juntos, sin bucle
    }
  }

  // Coloca la PRIMERA obra centrada en pantalla (copia del medio), con la anterior
  // y la siguiente asomando arriba y abajo.
  function centrarEntrada() {
    const items = grid.children;
    if (items.length < oneLen * 2) return;
    periodo = items[oneLen].offsetTop - items[0].offsetTop;
    const primera = items[oneLen];
    grid.scrollTop = primera.offsetTop - (grid.clientHeight - primera.clientHeight) / 2;
  }
  // Bucle vertical: al acercarse a un borde, salta un juego (imperceptible).
  grid.addEventListener("scroll", () => {
    if (!bucleVertical || !periodo || page.classList.contains("is-detail")) return;
    if (grid.scrollTop < periodo * 0.5) grid.scrollTop += periodo;
    else if (grid.scrollTop > periodo * 1.5) grid.scrollTop -= periodo;
  }, { passive: true });

  // Arrastrar para desplazar la columna vertical (además de la rueda). Solo en
  // escritorio (en móvil manda el scroll táctil de la página). No pone "manita":
  // con la bola personalizada solo se ve el círculo (lo fuerza el CSS).
  let gDrag = false, gY0 = 0, gS0 = 0, gridMov = 0, gCap = false, gPid = null;
  grid.addEventListener("pointerdown", e => {
    if (!bucleVertical || page.classList.contains("is-detail")) return;
    gDrag = true; gY0 = e.clientY; gS0 = grid.scrollTop; gridMov = 0; gCap = false; gPid = e.pointerId;
  });
  grid.addEventListener("pointermove", e => {
    if (!gDrag) return;
    const dy = e.clientY - gY0;
    if (Math.abs(dy) > gridMov) gridMov = Math.abs(dy);
    // Capturamos el puntero SOLO cuando ya es un arrastre (>6px). Si capturásemos
    // en el pointerdown, el 'click' se redirigiría a la rejilla y no abriría la obra.
    if (!gCap && gridMov > 6) { gCap = true; try { grid.setPointerCapture(gPid); } catch (_) {} }
    if (gCap) grid.scrollTop = gS0 - dy;
  });
  const finGDrag = () => { gDrag = false; gCap = false; };
  grid.addEventListener("pointerup", finGDrag);
  grid.addEventListener("pointercancel", finGDrag);

  /* ---- Etiqueta "CLICK" bajo el cursor (solo aparece; no atenúa las demás) - */
  function hoverCue() {
    const label = document.querySelector(".cursor-ver");
    const fino  = window.matchMedia("(pointer: fine)");
    const moveL = (label && window.gsap) ? gsap.quickTo(label, "left", { duration: 0.3, ease: "power3.out" }) : null;
    const moveT = (label && window.gsap) ? gsap.quickTo(label, "top",  { duration: 0.3, ease: "power3.out" }) : null;

    grid.addEventListener("mouseover", e => {
      if (e.target.closest(".lienzo-item") && fino.matches) document.body.classList.add("show-vercue");
    });
    grid.addEventListener("mouseout", e => {
      if (e.target.closest(".lienzo-item")) document.body.classList.remove("show-vercue");
    });
    if (label) window.addEventListener("mousemove", e => {
      if (moveL) { moveL(e.clientX); moveT(e.clientY); }
      else { label.style.left = e.clientX + "px"; label.style.top = e.clientY + "px"; }
    });
  }

  /* ---- DETALLE de una obra: tira horizontal a todo el ancho, en bucle ----- */
  const detail = document.createElement("div");
  detail.className = "gal-detail";
  const strip = document.createElement("div");
  strip.className = "gal-strip";
  detail.appendChild(strip);
  page.querySelector(".lienzo-cols").appendChild(detail);

  const cerrarBtn = document.createElement("button");
  cerrarBtn.type = "button";
  cerrarBtn.className = "gal-cerrar";
  cerrarBtn.textContent = "VOLVER";
  cerrarBtn.hidden = true;
  document.body.appendChild(cerrarBtn);

  let abierta = false, unSet = 0, oneLenDet = 0;

  function swapInfo(html) {
    if (!info) return;
    info.classList.add("is-swap");
    setTimeout(() => { info.innerHTML = html; info.classList.remove("is-swap"); }, 200);
  }
  const infoObra = o =>
    `<p class="lienzo-info-title">${esc(o.titulo || "")}</p>` +
    (o.tecnica ? `<p class="lienzo-info-tecnica">${esc(o.tecnica)}</p>` : "") +
    `<p class="lienzo-info-desc">${esc(o.descripcion || "")}</p>`;

  // Tira con 3 copias del juego -> bucle horizontal. La 1ª imagen (principal)
  // queda alineada con la columna (padding-left en el CSS) y no se mueve.
  function montarTira(items) {
    oneLenDet = items.length;
    let html = "";
    for (let c = 0; c < 3; c++) {
      items.forEach(im => {
        const horiz = (im.w || 0) >= (im.h || 0);
        html += `<figure class="${horiz ? "is-horiz" : "is-vert"}"><img src="${grande(im)}" alt="Obra de Lorena Sánchez" draggable="false"></figure>`;
      });
    }
    strip.innerHTML = html;
    alCargar(strip, centrar);
  }
  function centrar() {
    const figs = strip.children;
    unSet = (figs.length >= oneLenDet * 2)
      ? (figs[oneLenDet].offsetLeft - figs[0].offsetLeft)   // ancho exacto de un juego (con el gap)
      : (strip.scrollWidth / 3);
    strip.scrollLeft = 0;   // arranca en la 1ª imagen (medio escondida): solo se ve de ahí a la derecha
  }

  function abrirObra(i) {
    const o = obras[i]; if (!o) return;
    const items = [o.principal, ...(o.detalles || []), ...(o.proceso || [])].filter(Boolean);
    montarTira(items);
    swapInfo(infoObra(o));
    document.body.classList.remove("show-vercue");
    if (!bucleVertical) window.scrollTo({ top: 0, behavior: "auto" });   // móvil: al abrir, arriba

    grid.style.opacity = "0";                 // las obras se van (fundido)
    setTimeout(() => {
      page.classList.add("is-detail");
      grid.style.opacity = "";
      detail.classList.remove("is-enter");
      void detail.offsetWidth;                // reinicia la animación de entrada
      detail.classList.add("is-enter");
      cerrarBtn.hidden = false;
      alCargar(strip, centrar);
    }, 260);
    abierta = true;
  }

  function cerrarObra() {
    if (!abierta) return;
    abierta = false;
    page.classList.remove("is-detail");
    cerrarBtn.hidden = true;
    swapInfo(infoDefault);
    animarEntrada(false);                      // al VOLVER solo animan las obras (lo que cambia)
    setTimeout(() => { strip.innerHTML = ""; }, 320);
  }

  cerrarBtn.addEventListener("click", cerrarObra);
  window.addEventListener("keydown", e => { if (abierta && e.key === "Escape") cerrarObra(); });

  // Bucle horizontal HACIA DELANTE: tras la última imagen viene la primera. Se
  // arranca en 0 (1ª imagen) y, al avanzar un par de juegos, se salta uno hacia
  // atrás de forma imperceptible (contenido idéntico) -> scroll infinito a la dcha.
  strip.addEventListener("scroll", () => {
    if (!abierta || !unSet) return;
    if (strip.scrollLeft >= unSet * 2) strip.scrollLeft -= unSet;
  }, { passive: true });

  // Rueda vertical -> desplazamiento horizontal
  strip.addEventListener("wheel", e => {
    if (!abierta) return;
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (!d) return;
    e.preventDefault();
    strip.scrollLeft += d;
  }, { passive: false });

  // Arrastrar para desplazar
  let drag = false, x0 = 0, s0 = 0, stripMov = 0, sCap = false, sPid = null;
  strip.addEventListener("pointerdown", e => { drag = true; x0 = e.clientX; s0 = strip.scrollLeft; stripMov = 0; sCap = false; sPid = e.pointerId; });
  strip.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > stripMov) stripMov = Math.abs(dx);
    // Igual que en la columna: capturar solo al arrastrar, para que el click en
    // una imagen siga abriendo la lupa.
    if (!sCap && stripMov > 6) { sCap = true; strip.classList.add("is-drag"); try { strip.setPointerCapture(sPid); } catch (_) {} }
    if (sCap) strip.scrollLeft = s0 - dx;
  });
  const finDrag = () => { drag = false; sCap = false; strip.classList.remove("is-drag"); };
  strip.addEventListener("pointerup", finDrag);
  strip.addEventListener("pointercancel", finDrag);

  window.addEventListener("resize", () => { if (abierta) centrar(); else if (bucleVertical) centrarEntrada(); });
});
