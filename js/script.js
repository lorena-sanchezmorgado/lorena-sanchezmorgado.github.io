/* ============================================================================
   Portfolio Lorena Sánchez — comportamiento de la web
   Páginas: index (Archivo) · project (Proyectos) · proyecto (Ficha) · sobremi
   Dependencias: GSAP. Sin jQuery ni Bootstrap. El lienzo del Archivo (zoom+pan)
   es propio, con un bucle de suavizado por requestAnimationFrame.
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


// FICHA — ENTRADA. Al pinchar una foto en la portada, allí las imágenes se abren
// hacia los lados hasta vaciar la pantalla y solo entonces se navega, así que la
// ficha entra directamente con sus propias apariciones (los "reveals" al cargar y
// al hacer scroll). No hay relevo de imagen: la portada ya deja la pantalla vacía.


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

  const catLabel = { uxui: "UX/UI", packaging: "Packaging", editorial: "Editorial", ilustracion: "Ilustración", fotografia: "Fotografía" };

  // Pinta las tarjetas. SIN numerar — al filtrar por "Seleccionados" los
  // números saldrían salteados (01, 02, 04, 06...) y quedaba raro.
  grid.innerHTML = PROYECTOS.map(p => `
    <a class="proy-card" draggable="false" href="proyecto.html?p=${p.slug}&cat=${p.cat}&volver=project"
       data-cat="${p.cat}" data-p="${p.slug}" data-destacado="${p.destacado ? "1" : "0"}">
      <div class="img-wrapper">
        <img class="img-grid" src="${p.img}" alt="${p.nombre}" draggable="false" decoding="async">
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
      card.setAttribute("href", `proyecto.html?p=${card.dataset.p}&cat=${destino}&volver=project`);
    });
  }

  filters.forEach(btn => {
    btn.addEventListener("click", () => { applyFilter(btn.dataset.cat); carrusel.rebuild(); });
  });

  const categoriaInicial = new URLSearchParams(window.location.search).get("cat");
  applyFilter(categoriaInicial && categoriaInicial !== "seleccionados"
    && Array.from(filters).some(f => f.dataset.cat === categoriaInicial) ? categoriaInicial : "todos");

  /* ------------------------------------------------------------------------
     CARRUSEL: la fila se desliza sola (despacio) y también se arrastra con el
     ratón. Al pasar el ratón por encima se para para poder mirar; al salir sigue.
     Para que el bucle sea infinito se clona el juego de tarjetas visible.
     · VELOCIDAD_CARRUSEL  = píxeles por fotograma (más alto = más rápido).
     ------------------------------------------------------------------------ */
  const carrusel = (function () {
    const VELOCIDAD_CARRUSEL = 0.4;
    // TAMAÑO DE LAS TARJETAS — todas pegadas ARRIBA; el borde de ABAJO queda en
    // SIERRA. La ALTURA de cada foto depende de su forma (sin deformar, object-fit
    // cover): las verticales llegan hasta abajo y las horizontales quedan más
    // bajitas pero anchas.
    //   BASE_AR  = proporción (ancho/alto) hasta la que la foto ocupa TODO el alto
    //              (<= BASE_AR -> vertical, llega abajo). Súbelo para que más fotos
    //              lleguen abajo; bájalo para que solo lleguen las muy verticales.
    //   MIN_ALTO = alto mínimo (fracción del alto disponible) de las más panorámicas.
    const BASE_AR  = 1.0;
    const MIN_ALTO = 0.7;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let setW = 0, raf = 0, token = 0, cabe = false;
    let hovering = false, dragging = false, mov = 0, pausaHasta = 0;

    const visibles = () => cards.filter(c => c.style.display !== "none");
    const limpiarClones = () => grid.querySelectorAll(".proy-card--clone").forEach(c => c.remove());

    // Da a cada foto su alto (según lo vertical que sea) y su ancho (según su
    // forma real, sin deformar). Tops iguales -> el borde de abajo queda en sierra.
    function ajustarFormas() {
      const Hmax = grid.clientHeight;
      if (!Hmax || Hmax <= 0) return;
      // Con 1-2 fotos van GRANDES y ocupan todo el alto; con dos, clonar() activa
      // el bucle solo si no caben. Con 3+ se usa la sierra habitual.
      const pocas = visibles().length < 3;
      cards.forEach(c => {
        const im = c.querySelector("img");
        const wrap = c.querySelector(".img-wrapper");
        if (!im || !wrap || !im.naturalWidth) return;
        const ar = im.naturalWidth / im.naturalHeight;         // >1 apaisada · <1 vertical
        let h, w;
        if (pocas) {
          h = Hmax;                                            // completan el alto (grandes)
          w = Math.round(h * ar);                              // ancho natural (sin recorte)
        } else {
          const frac = Math.max(MIN_ALTO, Math.min(1, BASE_AR / ar));
          h = Math.round(Hmax * frac);                         // alto: verticales hasta abajo
          w = Math.min(Math.round(h * ar), Math.round(Hmax * 1.35));   // ancho real (tope panorámicas)
        }
        wrap.style.height = h + "px";
        wrap.style.width = w + "px";
        wrap.style.aspectRatio = "";                           // mandan el alto/ancho explícitos
      });
    }

    function medir() {
      const vis = visibles();
      const primero = vis[0];
      const clonSiguiente = primero && Array.from(grid.querySelectorAll(".proy-card--clone"))
        .find(c => c.offsetLeft > primero.offsetLeft);
      setW = clonSiguiente ? clonSiguiente.offsetLeft - primero.offsetLeft : 0;
    }

    // Duplica el juego de tarjetas visible tantas veces como haga falta para
    // llenar la pantalla y que el bucle sea infinito SIEMPRE (aunque haya pocas).
    function clonar() {
      const vis = visibles();
      if (!vis.length) { setW = 0; cabe = false; return; }
      // Una sola foto no forma un ciclo útil. Con dos, solo se activa el bucle
      // cuando el juego completo no cabe en el ancho visible.
      if (vis.length < 2) { setW = 0; cabe = true; return; }
      const anchoJuego = vis.reduce((s, c) => s + c.getBoundingClientRect().width, 0)
        + (vis.length - 1) * parseFloat(getComputedStyle(grid).columnGap || 0);
      if (anchoJuego <= 0) { setW = 0; cabe = false; return; }   // aún sin medidas: se reintenta fuera
      if (vis.length === 2 && anchoJuego <= grid.clientWidth) { setW = 0; cabe = true; return; }
      // Nº de copias para cubrir el ancho visible + un juego extra (colchón del bucle)
      const copias = Math.max(2, Math.ceil(grid.clientWidth / anchoJuego) + 1);
      const crearClon = c => {
          const cl = c.cloneNode(true);
          cl.classList.add("proy-card--clone");
          cl.setAttribute("draggable", "false");
          cl.setAttribute("aria-hidden", "true");
          cl.setAttribute("tabindex", "-1");
          cl.removeAttribute("href");   // el clon no navega
          return cl;
      };
      const anteriores = document.createDocumentFragment();
      vis.forEach(c => anteriores.appendChild(crearClon(c)));
      grid.insertBefore(anteriores, vis[0]);
      for (let k = 1; k < copias; k++) {
        vis.forEach(c => grid.appendChild(crearClon(c)));
      }
      cabe = false;
      medir();
      grid.scrollLeft = setW;
    }

    function esperarImgs(cb) {
      const els = Array.from(grid.querySelectorAll(".proy-card:not(.proy-card--clone) img"));
      let quedan = els.length || 1;
      const listo = () => { if (--quedan <= 0) cb(); };
      if (!els.length) return cb();
      els.forEach(im => {
        if (im.complete && im.naturalWidth) listo();
        else { im.addEventListener("load", listo, { once: true }); im.addEventListener("error", listo, { once: true }); }
      });
      setTimeout(cb, 1400);   // red de seguridad
    }

    // Monta clones + medición cuando el layout ya tiene ancho. Si aún no lo tiene
    // (panel oculto, fuentes sin cargar…) reintenta unas cuantas veces.
    function montar(t, intentos) {
      if (t !== token) return;
      limpiarClones();
      ajustarFormas();
      if (grid.clientWidth > 0) clonar();
      // Reintenta solo si aún no hay medidas — NO cuando simplemente "cabe" sin bucle.
      if (((!setW && !cabe) || grid.clientWidth <= 0) && intentos < 20) {
        requestAnimationFrame(() => montar(t, intentos + 1));
      }
    }

    function rebuild() {
      const t = ++token;
      limpiarClones();
      grid.scrollLeft = 0;
      setW = 0;
      let hecho = false;
      esperarImgs(() => {
        if (t !== token || hecho) return;   // llegó un rebuild más nuevo
        hecho = true;
        ajustarFormas();       // el recorte se aplica siempre (también con reduce)
        if (reduce) return;    // pero sin bucle ni movimiento automático
        montar(t, 0);
      });
    }

    // Mantiene el scroll dentro de las copias laterales; el juego original queda
    // centrado para poder arrastrar en ambos sentidos antes de envolver.
    function envolver(sl) {
      if (!setW) return Math.max(0, sl);
      const periodo = setW * 2;
      return ((sl % periodo) + periodo) % periodo;
    }

    // La rueda y el trackpad desplazan de forma nativa, fuera de envolver().
    // Normalizar el evento scroll evita que lleguen al final físico de las copias.
    grid.addEventListener("scroll", () => {
      if (!setW) return;
      const normalizado = envolver(grid.scrollLeft);
      if (Math.abs(normalizado - grid.scrollLeft) > 0.5) grid.scrollLeft = normalizado;
    }, { passive: true });

    function tick() {
      // No se mueve solo mientras arrastras, mientras el ratón está encima, ni
      // durante el instante posterior a soltar/usar la rueda.
      if (setW && !hovering && !dragging && performance.now() >= pausaHasta) {
        grid.scrollLeft = envolver(grid.scrollLeft + VELOCIDAD_CARRUSEL);
      }
      raf = requestAnimationFrame(tick);
    }

    // Parar SOLO cuando el ratón está sobre una FOTO (no sobre el blanco de la
    // sierra, aunque esté "dentro" del carrusel), para poder mirarla; seguir al salir.
    grid.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return;
      const bajoPuntero = document.elementFromPoint(e.clientX, e.clientY);
      hovering = !!bajoPuntero?.closest(".proy-card");
    });
    grid.addEventListener("pointerleave", () => { hovering = false; });
    // La rueda/trackpad también pausa un momento el movimiento automático
    grid.addEventListener("wheel", () => { pausaHasta = performance.now() + 1200; }, { passive: true });

    // ARRASTRE INCREMENTAL: el carrusel sigue tu ratón exacto (a tu velocidad),
    // sin que el deslizamiento automático se sume. Al soltar espera un momento
    // antes de retomar el movimiento solo.
    let lastX = 0, cap = false, pid = null;
    grid.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true; lastX = e.clientX; mov = 0; cap = false; pid = e.pointerId;
    });
    window.addEventListener("pointermove", e => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      mov += Math.abs(dx);
      if (!cap && mov > 6) { cap = true; grid.classList.add("is-drag"); try { grid.setPointerCapture(pid); } catch (_) {} }
      if (cap) grid.scrollLeft = envolver(grid.scrollLeft - dx);   // tu mano manda
    });
    const finDrag = e => {
      if (!dragging || (e && e.pointerId !== pid)) return;
      if (dragging) pausaHasta = performance.now() + 1200;   // deja un respiro tras soltar
      dragging = false; cap = false; grid.classList.remove("is-drag");
      pid = null;
    };
    window.addEventListener("pointerup", finDrag);
    window.addEventListener("pointercancel", e => { if (e.pointerId === pid) { mov = 0; finDrag(e); } });
    grid.addEventListener("lostpointercapture", () => { if (dragging) finDrag(); });
    // Si hubo arrastre, cancelar el clic de navegación (fase de captura)
    grid.addEventListener("click", e => { if (mov > 6) { e.preventDefault(); e.stopPropagation(); mov = 0; } }, true);

    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(rebuild, 160); });
    // Rehacer cuando cambian condiciones que afectan a la medida: fuentes cargadas,
    // la ventana termina de cargar y cuando el panel vuelve a ser visible.
    window.addEventListener("load", () => rebuild());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => rebuild());
    document.addEventListener("visibilitychange", () => { if (!document.hidden && !setW) rebuild(); });

    raf = requestAnimationFrame(tick);
    return { rebuild };
  })();

  carrusel.rebuild();
});


// ¿DE QUÉ LADO SALE LA ETIQUETA "COPIAR"?
// Se prueba primero a la DERECHA del texto. Si ahí no cabe (por ejemplo el email
// del footer, que llega al borde de la tarjeta morada) se pasa a la IZQUIERDA, y
// si tampoco cabe (pantallas muy estrechas) se pone DEBAJO. Se mide justo antes
// de que aparezca.
function ladoDeLaEtiqueta(el) {
  const hint = el.getAttribute("data-hint") || "Copiar";
  if (el.matches(".page-contacto .contacto-phone")) {
    el.classList.add("hint-abajo");
    el.classList.remove("hint-izq", "hint-der");
    return;
  }
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
          cat: "packaging",                       // uxui | packaging | editorial | ilustracion | fotografia
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
    cat: "uxui", img: "media/proyectos/compas/web-portada.jpg", destacado: true,
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

      { t: "full", img: "media/proyectos/thompson/web-06.jpg" },
      
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

      { t: "full", img: "media/proyectos/thompson/web-07.jpg" },

      { t: "texto", html: "<p>Este proyecto fue una experiencia especialmente significativa para mí, ya que surgió de una colaboración entre mi universidad y Thompson Madrid. Desde el primer momento me sentí muy cercana al proyecto, especialmente después de conocer de primera mano qué buscaba el hotel y cómo planteaban el concurso. <br><br> Fue un reto muy emocionante, pero también me daba cierto miedo. En ese momento estaba empezando segundo de carrera y el concurso estaba abierto a todos los estudiantes, así que sentía que muchas de las personas que participaban podían tener más experiencia que yo. Trabajar para una marca hotelera tan grande y con presencia internacional hacía que el proyecto fuese todavía más importante para mí. <br><br> Por eso, recibir el premio fue especialmente gratificante. Me quedo con la experiencia de haberme enfrentado a un proyecto que me sacaba de mi zona de confort, de haber aprendido durante el proceso y, sobre todo, con la ilusión y el agradecimiento de haber podido formar parte de una oportunidad así.</p>" },

      { t: "full", img: "media/proyectos/thompson/web-08.jpg" }
      
    ]
  },

  // ---------------------------------------------------------------- (03)
  {
    id: 3, slug: "mapilo", nombre: "Kit Mapilo", anio: "2025", disc: "Packaging, Producto",
    cat: "packaging", img: "media/proyectos/mapilo/web-05.jpg", destacado: false,
    intro: "Un kit de juegos de mesa pensado para hacer una pausa y cuidar la mente lejos de la pantalla.",
    bloques: [
      { t: "texto", html: "<p>Más que un envase, la propuesta es un pequeño sistema. Una funda exterior protege un contenedor con seis cajas, y en cada una vive un juego. No es un empaque de usar y tirar, sino un objeto que se queda cerca, se abre cuando apetece una pausa y se vuelve a guardar.</p>" },

      { t: "full", img: "media/proyectos/kit mapilo/que es mapilo.png" },

      { t: "texto", html: "<p>El punto de partida, un imaginario de formas planas, recortes y color en bloques, con el punto lúdico de lo hecho a mano. Ese cruce entre lo gráfico y lo artesanal marcó el tono de Mapilo, directo, amable y con carácter. Cada caja contiene un juego distinto y propone una forma diferente de trabajar la atención, la lógica, la memoria o la percepción espacial.</p>" },

      { t: "full", img: "media/proyectos/kit mapilo/moodboard.png" },
      {
        t: "mosaico", imgs: [
           "media/proyectos/kit mapilo/Frame 175.png",
          "media/proyectos/kit mapilo/Frame 176.png"
        ]
      },

      { t: "texto", html: "<p>Este kit no es solo un contenedor. La experiencia empieza desde la forma en que la persona lo ve, lo abre y empieza a descubrirlo. La funda exterior troquelada deja ver partes de color de las cajas del interior, pero sin mostrarlo todo. Eso genera una primera curiosidad, una especie de adelanto visual que invita a abrirlo. Después aparece una segunda capa más sencilla, para ﬁnalmente llegar a las seis cajas interiores. La apertura funciona por niveles, primero se intuye, luego se revela y al ﬁnal se usa. <br> <br>El troquel no está pensado solo como elemento decorativos, si no que forme parte de la experiencia. Todo las fases de cajas convierten el momento de abrir el pack en un pequeño recorrido.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/mapilo/web-04.jpg",
          "media/proyectos/mapilo/web-06.jpg",
          "media/proyectos/kit mapilo/c general detras.png"
        ]
      },

      { t: "texto", html: "<p> Para la funda exterior y las seis cajas interiores, se usaría un cartón compacto reciclado estucado de 350 g o 400 g. Para el contenedor interior como se necesita más resistencia se usaría un cartón gris reciclado de 1,5 mm, contracolado con papel impreso. <br><br> Para buscar la sostenibilidad, se evitar elementos innecesarios como una ventana plástica para los troquelados. Más que un empaque de un solo uso, el kit se piensa como un objeto que se quede en casa para guardar los juegos y seguir utilizándose de manera continuada.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/mapilo/web-05.jpg",
          "media/proyectos/kit mapilo/c juegos.png",
          "media/proyectos/kit mapilo/c juegos parte de atras.png"
        ]
      }
    ]
  },

  // ---------------------------------------------------------------- (04)
  {
    id: 4, slug: "pichi", nombre: "Pichi", anio: "2025", disc: "Creación de Marca, Ilustración, Packaging",
    cat: "packaging", img: "media/proyectos/pichi/web-11.jpg", destacado: true,
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
    cat: "ilustracion", img: "media/proyectos/four-seasons/web-07.jpg", destacado: false,
    intro: "Campaña ilustrada de cobranding entre Four Seasons y Veuve Clicquot.",
    bloques: [
      { t: "texto", html: "<p>Este proyecto parte de una campaña ficticia para Four Seasons y Veuve Clicquot que desarrollamos en clase. La propuesta buscaba unir las dos marcas a través de una serie de ilustraciones ambientadas en diferentes destinos del hotel. <br><br> Desde el principio tenía bastante claro que quería alejarme de una representación demasiado realista. En clase habíamos trabajado a Edward Penfield y René Gruau y su forma de utilizar las manchas, el contraste y el color me gustó muchísimo. Me interesaba especialmente cómo el fondo podía tener tanto peso como la propia figura y cómo unos pocos colores podían hacer que una composición destacara sin necesidad de llenarla de elementos.</p>" },

      { t: "full", img: "media/proyectos/four-seasons/web-01.jpg" },
      

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
    cat: "ilustracion", img: "media/proyectos/puerta-alcala/web-01.jpg", destacado: false,
    intro: "Callejea por Madrid es una propuesta de ilustración para el concurso Reinterpreta la Puerta de Alcalá de 2025.",
    bloques: [
      { t: "texto", html: "<p>El concurso Reinterpreta la Puerta de Alcalá proponía crear una nueva versión de uno de los grandes símbolos de Madrid y aplicarla al diseño de una camiseta promocional para la ciudad. El reto era encontrar una forma de representar Madrid que fuese reconocible, pero que al mismo tiempo aportase una mirada personal y diferente a los símbolos que ya forman parte de su identidad. <br><br> Para comenzar, busqué referencias en elementos que forman parte del paisaje cotidiano de Madrid. Los mosaicos y azulejos de sus calles fueron el punto de partida, junto con una paleta de azules y pequeños toques amarillos y una tipografía de inspiración chulapa. Me interesaba conseguir una estética que mezclase la tradición madrileña con una interpretación más fresca y actual.</p>" },

      { t: "full", img: "media/proyectos/puerta-alcala/web-07.jpg" },

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
    cat: "packaging", img: "media/proyectos/cata-la-lata/web-02.jpg", destacado: true,
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
  },

  {
    id: 8, slug: "abuela", nombre: "Mi abuela", anio: "2024", disc: "Fotografía documental",
    cat: "fotografia", img: "media/proyectos/abuela/web-01.jpg", destacado: false,
    intro: "Un retrato íntimo de la vida diaria de mi abuela, donde cada gesto cotidiano habla del paso del tiempo y de la fuerza de los vínculos familiares.",
    bloques: [
      { t: "texto", html: "<p>Las fotografías de mi abuela, ocupada en sus quehaceres diarios, hablan del paso del tiempo y, a la vez, de la permanencia de ciertas actividades. Cada acción cotidiana, cada rincón de su hogar, evoca la nostalgia de mi infancia y la fortaleza de los vínculos familiares.</p><p>A través de su figura quise mostrar cómo los valores se mantienen y se transmiten de generación en generación, dando forma a la identidad de mi pueblo.</p>" },

      { t: "contacto", imgs: [
        "media/proyectos/abuela/web-01.jpg", "media/proyectos/abuela/web-02.jpg", "media/proyectos/abuela/web-03.jpg",
        "media/proyectos/abuela/web-04.jpg", "media/proyectos/abuela/web-05.jpg", "media/proyectos/abuela/web-06.jpg",
        "media/proyectos/abuela/web-07.jpg", "media/proyectos/abuela/web-08.jpg", "media/proyectos/abuela/web-09.jpg",
        "media/proyectos/abuela/web-10.jpg", "media/proyectos/abuela/web-11.jpg", "media/proyectos/abuela/web-12.jpg",
        "media/proyectos/abuela/web-13.jpg", "media/proyectos/abuela/web-14.jpg", "media/proyectos/abuela/web-15.jpg",
        "media/proyectos/abuela/web-16.jpg", "media/proyectos/abuela/web-17.jpg", "media/proyectos/abuela/web-18.jpg",
        "media/proyectos/abuela/web-19.jpg"
      ]},

      { t: "texto", html: "<p>Para la realización, he utilizado un enfoque documental y narrativo, inspirándome en la intimidad y la autenticidad que caracterizan el estilo de Robert Frank y Kaylynn Deveney.<br> He adoptado métodos de observación, capturando momentos espontáneos y naturales en la vida cotidiana de mi abuela. </p>" },

      { t: "full", img: "media/proyectos/abuela/web-moodboard.jpg" },

      { t: "texto", html: "<p>Para la inspiración: <br><br> ROBERT FRANK<br> Lo que más me gusta de este artista es que al ser sus fotografías en blanco y negro crea grandes contrastes y así dirige el foco de atención en cada obra. También me gusto mucho la idea de mostrar la realidad cruda sin que las personas posen forzadamente para el. <br><br> KAYLYNN DEVENEY <br> De este artista me enfoqué en la idea de mostrar la vida diaria y actividades comunes que todos hacemos, pero desde ángulos interesantes que resaltan la belleza de estos. </p>" }
    ]
  },

  {
    id: 9, slug: "mi-pueblo", nombre: "Mi pueblo", anio: "2024", disc: "Fotografía documental",
    cat: "fotografia", img: "media/proyectos/mi-pueblo/web-01.jpg", destacado: false,
    intro: "La esencia de Daganzo de Arriba, su vida cotidiana, sus gentes y ese sentido de comunidad que define el lugar donde crecí.",
    bloques: [
      { t: "texto", html: "<p>Para este trabajo de fotografía, quise capturar la esencia de mi pueblo, un lugar que no solo es mi hogar, sino el escenario de mis más preciadosrecuerdos. Las imágenes de sus habitantes, jóvenes y adultos interactuando en su entorno diario, reflejan la vitalidad y el sentido de comunidad que lo caracterizan.</p><p>Capturar a las personas en momentos espontáneos, compartiendo tareas y disfrutando de la compañía mutua, destaca la importancia de las relaciones humanas y la convivencia armónica con la naturaleza y los animales</p>" },

      { t: "contacto", imgs: [
        "media/proyectos/mi-pueblo/web-01.jpg", "media/proyectos/mi-pueblo/web-02.jpg", "media/proyectos/mi-pueblo/web-03.jpg",
        "media/proyectos/mi-pueblo/web-04.jpg", "media/proyectos/mi-pueblo/web-05.jpg", "media/proyectos/mi-pueblo/web-06.jpg",
        "media/proyectos/mi-pueblo/web-07.jpg", "media/proyectos/mi-pueblo/web-08.jpg", "media/proyectos/mi-pueblo/web-09.jpg",
        "media/proyectos/mi-pueblo/web-10.jpg", "media/proyectos/mi-pueblo/web-11.jpg", "media/proyectos/mi-pueblo/web-12.jpg",
        "media/proyectos/mi-pueblo/web-13.jpg", "media/proyectos/mi-pueblo/web-14.jpg", "media/proyectos/mi-pueblo/web-15.jpg",
        "media/proyectos/mi-pueblo/web-16.jpg", "media/proyectos/mi-pueblo/web-17.jpg", "media/proyectos/mi-pueblo/web-18.jpg",
        "media/proyectos/mi-pueblo/web-19.jpg", "media/proyectos/mi-pueblo/web-20.jpg", "media/proyectos/mi-pueblo/web-21.jpg",
        "media/proyectos/mi-pueblo/web-22.jpg", "media/proyectos/mi-pueblo/web-23.jpg", "media/proyectos/mi-pueblo/web-24.jpg",
        "media/proyectos/mi-pueblo/web-25.jpg", "media/proyectos/mi-pueblo/web-26.jpg", "media/proyectos/mi-pueblo/web-27.jpg",
        "media/proyectos/mi-pueblo/web-28.jpg", "media/proyectos/mi-pueblo/web-29.jpg"
      ]},

      { t: "texto", html: "<p>Un enfoque documental y narrativo, en blanco y negro, inspirado en Robert Frank y Kaylynn Deveney. Retrato ambiental y fotografía de estilo de vida, con momentos capturados de forma natural. </p>" },

      { t: "full", img: "media/proyectos/mi-pueblo/web-moodboard.jpg" },

      { t: "texto", html: "<p>Para la inspiración: <br><br> ROBERT FRANK<br> Lo que más me gusta de este artista es que al ser sus fotografías en blanco y negro crea grandes contrastes y así dirige el foco de atención en cada obra. También me gusto mucho la idea de mostrar la realidad cruda sin que las personas posen forzadamente para el. <br><br> KAYLYNN DEVENEY <br> De este artista me enfoqué en la idea de mostrar la vida diaria y actividades comunes que todos hacemos, pero desde ángulos interesantes que resaltan la belleza de estos. </p>" }
    ]
  },

  {
    id: 10, slug: "twin-peaks", nombre: "Twin Peaks", anio: "2025", disc: "Editorial, Fotografía, Dirección de arte",
    cat: "fotografia", img: "media/proyectos/twin-peaks/web-mockup-05.jpg", destacado: true,
    intro: "Serie de bodegones que trascienden lo cotidiano,<em>Twin Peaks</em> y al universo inquietante de David Lynch, llevada a las páginas de la revista Aperture.",
    bloques: [
      // -- PROBLEMA --
      { t: "texto", html: "<p>Twin Peaks no se explica, se siente. El reto era traducir en imágenes fijas ese universo donde lo cotidiano se vuelve extraño y cada objeto guarda un secreto. Mi equipo y yo quisimos contar la serie de David Lynch sin recurrir a sus escenas, solo a través de las cosas que rodean a sus personajes, y darle forma dentro de una publicación real, un número especial de la revista de fotografía Aperture.</p>" },

      // -- CONCEPTO --
      { t: "texto", html: "<p>La idea fue construir cinco bodegones, uno por personaje, hechos solo con los objetos que los definen. En lugar de retratar a Cooper, Laura, Audrey, James o Bob, dejamos que hablen sus cosas como una taza de café humeante y una tarta de cereza, unos tacones rojos junto a un cigarro a medio consumir, un espejo roto y un clavo oxidado. Cada composición es un retrato sin rostro, el rastro de quién estuvo ahí.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/twin-peaks/web-concepto-01.jpg",
          "media/proyectos/twin-peaks/web-concepto-02.jpg",
          "media/proyectos/twin-peaks/web-concepto-03.jpg"
        ]
      },

      { t: "texto", html: "<p>Todo se sostiene sobre una misma estética, el estilo <em>whimsigoth</em>, ese cruce entre lo gótico y lo onírico que reinterpreta la oscuridad desde lo poético. Colores profundos, objetos simbólicos, luz tenue y una atmósfera melancólica donde lo mágico, lo extraño y lo común conviven de forma natural. Belleza y desasosiego a partes iguales, cien por cien Lynch. <br> Un imaginario propio para fijar el tono antes de hacer las fotografías, buscando texturas orgánicas, flores marchitas, claroscuros y objetos comunes cargados de misterio.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/twin-peaks/web-concepto-04.jpg",
          "media/proyectos/twin-peaks/web-moodboard.jpg",
          "media/proyectos/twin-peaks/web-concepto-05.jpg"
        ]
      },

      // -- PROCESO --
      { t: "texto", html: "<p>Para poder pasar del concepto al plató empecé dibujando cada bodegón a mano para decidir qué entra en el encuadre y cómo se coloca cada pieza, como planteamiento funcional pero tampoco como una composión totalmente cerrada. Y de ahí pasamos a montar y fotografiar las cinco composiciones, cuidando la luz baja y el color para que cada mesa respirara ese aire inquietante.</p>" },

      { t: "full", img: "media/proyectos/twin-peaks/web-bocetos.jpg" },

      { t: "texto", html: "<p>Las cinco fotografías finales fueron editadas para mantener la coherencia visual y resaltar la atmósfera melancólica que caracteriza este proyecto, pero únicamente el color y contrastes. Y mediante el uso de la doble exposición, técnica que consigue capturar dos imágenes al mismo tiempo sin el uso de la postproducción, logramos crear imágenes con una profundidad y una atmósfera únicas.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/twin-peaks/web-bodegon-01.jpg",
          "media/proyectos/twin-peaks/web-bodegon-02.jpg",
          "media/proyectos/twin-peaks/web-bodegon-03.jpg",
          "media/proyectos/twin-peaks/web-bodegon-04.jpg",
          "media/proyectos/twin-peaks/web-bodegon-05.jpg"
        ]
      },

      // -- RESULTADO CON MOCKUPS --
      { t: "texto", html: "<p>El resultado toma forma de revista, un número monográfico de Aperture dedicado a Twin Peaks. Una portada que resume la serie, un reportaje sobre David Lynch entre lo visible y lo oculto, y las imágenes saltando del papel a las vallas y a las redes con frases de la propia serie.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/twin-peaks/web-mockup-01.jpg",
          "media/proyectos/twin-peaks/web-mockup-02.jpg",
          "media/proyectos/twin-peaks/web-mockup-03.jpg",
          "media/proyectos/twin-peaks/web-mockup-04.jpg",
          "media/proyectos/twin-peaks/web-mockup-05.jpg",
          "media/proyectos/twin-peaks/web-mockup-06.jpg"
        ]
      }
    ]
  },

  {
    id: 11, slug: "dicho-y-hecho", nombre: "Dicho y hecho", anio: "2025", disc: "Editorial, Dirección de arte",
    cat: "editorial", img: "media/proyectos/dicho-y-hecho/portada en plastico.png", destacado: false,
    intro: "Una revista que rescata los refranes de siempre y los reinterpreta. Un proyecto en equipo donde la cultura popular se cruza con el diseño editorial.",
    bloques: [
      // -- CONTEXTO / CONCEPTO --
      { t: "texto", html: "<p>Dicho y hecho nace de una idea sencilla, que los refranes son pequeñas cápsulas de sabiduría popular que llevan siglos pasando de boca en boca y que casi nadie se ha parado a mirar de cerca. Quisimos rescatarlos y darles una vuelta desde el diseño, cruzando cultura popular, humor, historia y estética Z. Cada página es una excusa para redescubrir lo que ya sabías, o creías saber. El propio nombre de la revista es un refrán, y marca el tono de todo lo demás.<br><br>La revista gira en torno a seis refranes y cada uno se despliega como su propio artículo. Rastreamos de dónde viene, cómo ha viajado a otras lenguas y culturas y cómo sigue vivo hoy en el cine, la música o los memes, hasta llegar a una versión actualizada para la generación de las stories.</p>" },

      { t: "video", src: "media/proyectos/dicho-y-hecho/web-paginas.mp4" },

      // -- SISTEMA VISUAL --
      { t: "texto", html: "<p>El punto de partida visual, un imaginario de portadas y editoriales expresivas donde la tipografía manda y la imagen se trata sin miedo.<br><br> Toda la revista está diseñada en blanco y negro para darle un tono sobrio y atemporal. A partir de ahí, cada refrán cobra vida con un color propio que marca su espacio dentro de la revista.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/dicho-y-hecho/web-moodboard.jpg",
          "media/proyectos/dicho-y-hecho/web-paleta.jpg"
        ]
      },

      { t: "video", src: "media/proyectos/dicho-y-hecho/web-reticula.mp4" },
      { t: "video", src: "media/proyectos/dicho-y-hecho/web-tipografia.mp4" },

      // -- LOS REFRANES (RESULTADO) --
      { t: "texto", html: "<p>Seis refranes, seis universos. A cada dicho le asignamos un color según lo que quiere expresar, aprovechando lo que ya asociamos a cada tono. El naranja es el del hambre y la comida, el morado el del misterio y lo oscuro, con sus brujas y sus cuervos, el amarillo el del oro y las apariencias, el rojo el de la prisa. Así cada refrán encuentra el color que mejor lo cuenta, y dentro de cada uno mezclamos duotonos, collage y tipografía a gran escala para llevarlo a su propio terreno visual.</p>" },

        {
        t: "mosaico", imgs: [
          "media/proyectos/dicho-y-hecho/web-refran-01.jpg",
          "media/proyectos/dicho-y-hecho/web-refran-02.jpg",
          "media/proyectos/dicho-y-hecho/web-refran-03.jpg",
          "media/proyectos/dicho-y-hecho/web-refran-04.jpg",
          "media/proyectos/dicho-y-hecho/web-refran-05.jpg",
          "media/proyectos/dicho-y-hecho/web-refran-06.jpg",
          "media/proyectos/dicho-y-hecho/web-refran-07.jpg"
        ]
      },

      { t: "texto", html: "<p>El azul, en cambio, es el color de la propia revista. Tiene su sección propia, un espacio de juegos, pasatiempos y sopa de letras donde descubrir refranes nuevos o recordar los de siempre.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/dicho-y-hecho/portada en plastico.png",
          "media/proyectos/dicho-y-hecho/web-portada.jpg"
        ]
      }
    ]
  },

  {
    id: 12, slug: "los-americanos", nombre: "Los Americanos", anio: "2025", disc: "Editorial, Dirección de arte",
    cat: "editorial", img: "media/proyectos/los-americanos/web-ticket-02.jpg", destacado: true,
    intro: "Identidad para <em>Ojos de una Nación</em>, la exposición que trae a la fundación MOP el mítico fotolibro de Robert Frank. Una nación entera contada a través de una mirada extranjera.",
    bloques: [
      // -- PROBLEMA --
      { t: "texto", html: "<p>Robert Frank no fotografiaba lo que se ve, sino lo que se siente. Su primer fotolibro, <em>Los Americanos</em>, retrató en los años cincuenta una América de contrastes, soledades y sueños rotos, muy lejos de la postal perfecta. El reto era montar una exposición a la altura de esa mirada y construir toda su identidad, del cartel al catálogo, sin traicionar el tono crudo y poético de sus imágenes.</p>" },

      // -- CONCEPTO --
      { t: "texto", html: "<p>La muestra se titula <em>Ojos de una Nación</em> y se plantea para la MOP, una fundación dedicada a la fotografía. El nombre resume la idea de fondo, ver un país entero a través de los ojos de alguien que llegó de fuera. Todo el recorrido se ordena en cinco capítulos que funcionan casi como versos, cada uno con su propio título.</p>" },

      { t: "texto", html: "<p>Carreteras que no llevan a casa. Ciudades que laten en blanco y negro. Bailando sobre las sombras. Los días que nos definen. Espacios de silencio.</p>" },

      // -- INSPIRACIÓN + MOODBOARD --
      { t: "texto", html: "<p>Antes de diseñar nada reuní un imaginario de portadas y editoriales donde la tipografía manda y la fotografía se trata sin miedo. De ahí salió el tono de todo el proyecto, sobrio, directo y muy tipográfico, uno que deja respirar a las imágenes de Frank en lugar de competir con ellas.</p>" },

      { t: "full", img: "media/proyectos/los-americanos/web-moodboard.jpg" },

      // -- SISTEMA VISUAL / PROCESO --
      { t: "texto", html: "<p>El sistema se apoya en dos tipografías que conviven bien, una gruesa y rotunda para los titulares y otra más neutra y legible para los textos largos, siempre sobre una retícula sencilla que ordena imagen y palabra.</p>" },

      { t: "texto", html: "<p>Los colores no son un blanco y negro puros, sino los mismos tonos apagados de las copias originales. A eso sumé un azul deslavado que aporta un punto de color sin salirse del concepto, acompañado de un gris muy claro y un negro cálido.</p>" },

      // -- RESULTADO CON MOCKUPS --
      { t: "texto", html: "<p>El cartel es la cara pública de la exposición, en vertical para las marquesinas y en horizontal para el metro. La misma fotografía, la familia asomada al tranvía, se convierte en el símbolo que sostiene toda la campaña.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/los-americanos/web-cartel-vertical.jpg",
          "media/proyectos/los-americanos/web-cartel-horizontal.jpg"
        ]
      },

      { t: "texto", html: "<p>El catálogo recoge la serie en formato cuadrado. Abre con el índice de los cinco capítulos y va presentando las fotografías más icónicas de Frank, cada una con su contexto, como la <em>Funda de coche</em> de Long Beach o el <em>Funeral</em> de Carolina del Sur.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/los-americanos/web-catalogo-01.jpg",
          "media/proyectos/los-americanos/web-catalogo-02.jpg",
          "media/proyectos/los-americanos/web-catalogo-03.jpg",
          "media/proyectos/los-americanos/web-catalogo-04.jpg",
          "media/proyectos/los-americanos/web-catalogo-05.jpg"
        ]
      },

      { t: "texto", html: "<p>El tríptico funciona como puerta de entrada a la muestra, con los datos, una cita del propio Frank y el recorrido completo por los cinco capítulos. La entrada repite el gesto de la portada y lleva el sello de la fundación, para que el recuerdo de la visita mantenga la misma imagen.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/los-americanos/web-triptico-01.jpg",
          "media/proyectos/los-americanos/web-triptico-02.jpg",
          "media/proyectos/los-americanos/web-ticket-01.jpg",
          "media/proyectos/los-americanos/web-ticket-02.jpg"
        ]
      },

      { t: "texto", html: "<p>Dentro, la señalética guía por los cinco recorridos y las fotografías saltan a gran formato en las salas. Fuera, la banderola y la propia fachada de la MOP anuncian la exposición desde la calle.</p>" },

      {
        t: "mosaico", imgs: [
          "media/proyectos/los-americanos/web-sala-01.jpg",
          "media/proyectos/los-americanos/web-sala-02.jpg",
          "media/proyectos/los-americanos/web-banderola.jpg",
          "media/proyectos/los-americanos/web-fachada.jpg"
        ]
      }
    ]
  }

];

const CAT_NOMBRES = {
  seleccionados: "SELECCIONADOS",
  uxui: "UX/UI",
  packaging: "PACKAGING",
  editorial: "EDITORIAL",
  ilustracion: "ILUSTRACIÓN",
  fotografia: "FOTOGRAFÍA"
};

// FICHA — construye la lista del apartado del que vienes, con el actual en negrita
document.addEventListener("DOMContentLoaded", () => {
  const list = document.querySelector(".ficha-list");
  if (!list) return;

  const params = new URLSearchParams(window.location.search);
  const origen = params.get("volver") === "index" ? "index" : "project";
  const categoriaOrigen = CAT_NOMBRES[params.get("cat")] ? params.get("cat") : "seleccionados";
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
      <a href="proyecto.html?p=${x.slug}&cat=${cat}&volver=${origen}">
        <div><h5>${x.nombre}</h5><p>${x.disc}</p></div>
        <span class="ficha-year">(${x.anio})</span>
      </a>
    </li>`).join("");

  const catEl = document.querySelector(".ficha-cat");
  if (catEl) catEl.textContent = "(" + CAT_NOMBRES[cat] + ")";
  const volver = document.querySelector(".ficha-volver");
  if (volver) volver.href = origen === "index"
    ? "index.html"
    : `project.html?cat=${encodeURIComponent(categoriaOrigen)}`;

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

        } else if (b.t === "contacto") {
          // HOJA DE CONTACTOS — todas las fotos en una rejilla uniforme (mismo
          // tamaño), tipo fotolibro. 4 columnas en escritorio (fotos grandes).
          // La rejilla carga MINIATURAS ligeras (web-NN-thumb.jpg, ~640px) para
          // que cargue rápido; la LUPA usa la foto grande (data-full).
          const fotos = (b.imgs || []).map(src => {
            const thumb = src.replace(/\.jpe?g$/i, "-thumb.jpg");
            return `<figure><img src="${thumb}" data-full="${src}" alt="${currentProj.nombre}" loading="lazy" decoding="async"></figure>`;
          }).join("");
          html += `<div class="fb-contacto reveal">${fotos}</div>`;

        } else if (b.t === "video") {
          // VÍDEO a todo el ancho (demo de movimiento). Se reproduce solo, en
          // silencio y en bucle cuando entra en pantalla, como un GIF. No carga
          // hasta que hace falta (preload none + el observador de más abajo).
          const poster = b.poster ? ` poster="${b.poster}"` : "";
          html += `<div class="fb-video reveal"><video src="${b.src}"${poster} muted loop playsinline preload="none"></video></div>`;
        }
      });
      body.innerHTML = html;
      if (window.initReveals) window.initReveals(body);
      if (window.ajustarMosaicos) window.ajustarMosaicos(body);

      // Los vídeos se reproducen solos (en silencio) cuando están a la vista y
      // se pausan al salir, para no descargar ni decodificar todos a la vez.
      const vids = body.querySelectorAll(".fb-video video");
      if (vids.length && "IntersectionObserver" in window) {
        const vObs = new IntersectionObserver((ents) => {
          ents.forEach(e => {
            const v = e.target;
            if (e.isIntersecting) { v.preload = "auto"; const pr = v.play(); if (pr) pr.catch(() => {}); }
            else v.pause();
          });
        }, { threshold: 0.25 });
        vids.forEach(v => vObs.observe(v));
      }
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
        // si la imagen es una miniatura (hoja de contactos), la lupa usa la
        // grande de data-full y deja que mida su tamaño real al cargar (w/h 0).
        src: im.dataset.full || im.getAttribute("src"),
        alt: im.alt || "",
        w: im.dataset.full ? 0 : (im.naturalWidth || 0),
        h: im.dataset.full ? 0 : (im.naturalHeight || 0)
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
    ".proy-head", ".proy-title", ".proy-desc", ".proy-filter", ".proy-card", // proyectos
    ".contacto-list a"                       // contacto
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


// ARCHIVO (landing) — lienzo tipo "cosmos": una pared de trabajos dispersos que
// se EXPLORA con zoom (rueda del ratón, hacia el cursor) y arrastre (con inercia,
// se mueve por la pantalla). Las fotos van apareciendo poco a poco. Si te quedas
// quieto unos segundos, la propia web empieza a hacer zoom sola. Sin textos.
document.addEventListener("DOMContentLoaded", () => {
  const vp = document.querySelector(".archivo-viewport");
  const canvas = document.querySelector(".archivo-canvas");
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
  const CUANTAS = 54;

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
  const fotosPendientes = barajar(porProyecto.flat());
  const fotosPorImagen = new Map([...data, ...fotosPendientes].map(foto => [foto.img, foto]));
  const CLAVE_ESTADO_ARCHIVO = "loreArchivoEstado";
  let disponibles = fotosPendientes.slice();
  let recicladas = [];

  if (!data.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ====== ESPACIO 3D POR CAPAS =============================================
     Las fotos se reparten en varias CAPAS a distinta profundidad (eje Z). Al
     hacer zoom "vuelas" hacia dentro: cada capa crece, la cruzas, se queda atrás
     y otra aparece al fondo, en BUCLE infinito. Es CSS 3D real (perspectiva en el
     viewport + translateZ por capa) movido por un bucle de requestAnimationFrame
     con suavizado.  NÚMEROS QUE PUEDES TOCAR: */
  const NUM_CAPAS   = 4;       // cuántas capas de profundidad hay
  const PERSPECTIVA = 1200;    // px de perspectiva (menos = efecto más exagerado)
  const Z_FONDO     = -3200;   // lo más lejos donde nace/renace una capa
  const Z_FRENTE    = 640;     // lo más cerca antes de reciclarse al fondo
  const SPAN        = Z_FRENTE - Z_FONDO;   // separación total entre capas (algo menos lejos)
  const FADE_IN     = 0.14;    // fundido solo al entrar desde el fondo
  const FADE_OUT    = 0.84;    // fundido solo para las fotos que se acercan de frente
  const SUAVIDAD    = 0.10;    // suavizado del viaje (zoom)
  const SENS_RUEDA  = 1.0;     // sensibilidad del zoom con la rueda
  const INERCIA     = 0.90;    // frenado del arrastre al soltar (0–1)
  const ESPERA      = 9000;    // ms quieto antes de que arranque el auto-zoom
  const AUTO_VIAJE  = 3.5;     // velocidad del auto-zoom (unidades de Z/fotograma)
  const PAN_TOPE_X  = 0.90;    // cuánto se puede desplazar en horizontal (fracción)
  const PAN_TOPE_Y  = 1.10;    // y en vertical (recorrido amplio: espacio de exploración)
  const CLIC_OP     = 0.20;    // opacidad mínima para que una foto se pueda pinchar
                               // (baja = se pinchan también las más lejanas)

  let capas = [], viajeBase = [], maxCicloCapa = [], listoLayers = false, bucleOn = false;
  let viaje = 0, tViaje = 0;               // profundidad de viaje (real / objetivo)
  let panX = 0, panY = 0, tPanX = 0, tPanY = 0;
  let vpanX = 0, vpanY = 0;                // inercia del desplazamiento
  let dragging = false, movidos = 0, reposoDesde = 0, sobreFoto = false, saliendo = false;
  let pox = 0, poy = 0, tPox = 0, tPoy = 0;   // parallax de ratón (perspective-origin)
  const ahora = () => performance.now();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const paso01 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // Envuelve una Z al rango [Z_FONDO, Z_FRENTE): eso hace el bucle infinito.
  const envZ = (z) => Z_FONDO + (((z - Z_FONDO) % SPAN) + SPAN) % SPAN;

  let estadoGuardado = null;
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE_ESTADO_ARCHIVO) || "null");
    const staging = document.createElement("div");
    if (guardado && typeof guardado.canvasHTML === "string") staging.innerHTML = guardado.canvasHTML;
    const capasGuardadas = Array.from(staging.children);
    const coincideViewport = guardado
      && Math.abs(guardado.width - vp.clientWidth) <= 2
      && Math.abs(guardado.height - vp.clientHeight) <= 2;
    const fuentesValidas = capasGuardadas.length === NUM_CAPAS
      && capasGuardadas.every(c => Array.from(c.querySelectorAll(".archivo-item img"))
        .every(img => fotosPorImagen.has(img.getAttribute("src"))));
    if (guardado?.version === 1 && coincideViewport && fuentesValidas
      && guardado.viajeBase?.length === NUM_CAPAS && guardado.maxCicloCapa?.length === NUM_CAPAS) {
      estadoGuardado = guardado;
    } else {
      sessionStorage.removeItem(CLAVE_ESTADO_ARCHIVO);
    }
  } catch (_) {
    try { sessionStorage.removeItem(CLAVE_ESTADO_ARCHIVO); } catch (_) {}
  }

  vp.style.perspective = PERSPECTIVA + "px";   // por si el CSS no la trae

  function limitarPan() {
    const vw = vp.clientWidth, vh = vp.clientHeight;
    tPanX = clamp(tPanX, -vw * PAN_TOPE_X, vw * PAN_TOPE_X);
    tPanY = clamp(tPanY, -vh * PAN_TOPE_Y, vh * PAN_TOPE_Y);
  }

  function ponerFoto(item, foto) {
    item._foto = foto;
    item.setAttribute("draggable", "false");
    delete item.dataset.ladoDeriva;
    item.href = "proyecto.html?p=" + foto.slug + "&cat=" + (foto.cat || "seleccionados") + "&volver=index";
    item.dataset.nombre = foto.nombre;
    const img = document.createElement("img");
    img.src = foto.img;
    img.alt = foto.nombre;
    img.setAttribute("draggable", "false");
    img.addEventListener("error", () => { if (item.querySelector("img") === img) item.remove(); });
    const anterior = item.querySelector("img");
    if (anterior) anterior.replaceWith(img);
    else item.appendChild(img);
  }

  function renovarCapa(capa) {
    const items = Array.from(capa.children);
    const anteriores = items.map(item => item._foto).filter(Boolean);
    const nuevas = [];
    while (nuevas.length < items.length) {
      if (!disponibles.length && recicladas.length) {
        disponibles.push(...barajar(recicladas.splice(0)));
      }
      if (disponibles.length) nuevas.push(disponibles.shift());
      else nuevas.push(anteriores[nuevas.length]);
    }
    const usadas = new Set(nuevas);
    recicladas.push(...anteriores.filter(foto => !usadas.has(foto)));
    items.forEach((item, i) => ponerFoto(item, nuevas[i]));
  }

  function restaurarEstado() {
    const estado = estadoGuardado;
    if (!estado) return false;
    canvas.innerHTML = estado.canvasHTML;
    capas = Array.from(canvas.children);
    capas.forEach(capa => capa.querySelectorAll(".archivo-item").forEach(item => {
      const img = item.querySelector("img");
      item._foto = fotosPorImagen.get(img.getAttribute("src"));
      img.addEventListener("error", () => { if (item.querySelector("img") === img) item.remove(); });
    }));
    viajeBase = estado.viajeBase;
    maxCicloCapa = estado.maxCicloCapa;
    disponibles = estado.disponibles.map(src => fotosPorImagen.get(src)).filter(Boolean);
    recicladas = estado.recicladas.map(src => fotosPorImagen.get(src)).filter(Boolean);
    viaje = estado.viaje; tViaje = estado.tViaje;
    panX = estado.panX; panY = estado.panY; tPanX = estado.tPanX; tPanY = estado.tPanY;
    vpanX = estado.vpanX; vpanY = estado.vpanY;
    pox = estado.pox; poy = estado.poy; tPox = estado.tPox; tPoy = estado.tPoy;
    poxEsc = estado.poxEsc; poyEsc = estado.poyEsc;
    canvas.style.transform = estado.canvasTransform;
    vp.style.perspectiveOrigin = estado.perspectiveOrigin;
    dragging = false; sobreFoto = false; saliendo = false; reposoDesde = ahora();
    listoLayers = true; construido = true; precargado = true; revelado = true;
    if (loader && loader.parentNode) loader.remove();
    estadoGuardado = null;
    try { sessionStorage.removeItem(CLAVE_ESTADO_ARCHIVO); } catch (_) {}
    if (!bucleOn) { bucleOn = true; requestAnimationFrame(frame); }
    return true;
  }

  function guardarEstado() {
    const estado = {
      version: 1,
      width: vp.clientWidth,
      height: vp.clientHeight,
      canvasHTML: canvas.innerHTML,
      canvasTransform: canvas.style.transform,
      perspectiveOrigin: vp.style.perspectiveOrigin,
      viaje, tViaje, panX, panY, tPanX, tPanY, vpanX, vpanY,
      pox, poy, tPox, tPoy, poxEsc, poyEsc,
      viajeBase, maxCicloCapa,
      disponibles: disponibles.map(foto => foto.img),
      recicladas: recicladas.map(foto => foto.img)
    };
    try { sessionStorage.setItem(CLAVE_ESTADO_ARCHIVO, JSON.stringify(estado)); } catch (_) {}
  }

  // Al pasar el ratón por una foto (aunque esté lejos) el movimiento automático
  // se PARA, para que puedas pincharla sin que se te escape.
  canvas.addEventListener("mouseover", e => { if (e.target.closest(".archivo-item")) sobreFoto = true; });
  canvas.addEventListener("mouseout", e => {
    const it = e.target.closest(".archivo-item");
    if (it && !it.contains(e.relatedTarget)) { sobreFoto = false; reposoDesde = ahora(); }
  });

  // RUEDA = viajar en profundidad (arriba = hacia dentro, abajo = hacia fuera)
  vp.addEventListener("wheel", e => {
    e.preventDefault();
    tViaje += -e.deltaY * SENS_RUEDA;
    reposoDesde = ahora();
  }, { passive: false });

  // ARRASTRE = desplazar el espacio (con parallax por profundidad e inercia). El
  // puntero se captura SOLO cuando ya es arrastre (>6px), para que un clic simple
  // siga abriendo el proyecto.
  let lastX = 0, lastY = 0, pid = null, cap = false;
  vp.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true; movidos = 0; cap = false; lastX = e.clientX; lastY = e.clientY; vpanX = vpanY = 0; pid = e.pointerId;
  });
  vp.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    movidos += Math.abs(dx) + Math.abs(dy);
    if (!cap && movidos > 6) { cap = true; matarCue(); canvas.classList.add("is-grabbing"); try { vp.setPointerCapture(pid); } catch (_) {} }
    if (cap) {
      tPanX += dx; tPanY += dy; limitarPan();
      panX = tPanX; panY = tPanY;
      canvas.style.transform = `translate3d(${panX.toFixed(2)}px,${panY.toFixed(2)}px,0)`;  // 1:1 inmediato
      vpanX = dx; vpanY = dy; reposoDesde = ahora();
    }
  });
  const finArrastre = () => { dragging = false; cap = false; canvas.classList.remove("is-grabbing"); reposoDesde = ahora(); };
  vp.addEventListener("pointerup", e => {
    const eraClic = dragging && movidos <= 6;   // soltó SIN arrastrar = clic
    finArrastre();
    if (eraClic && !saliendo) {
      const foto = fotoEn(e.clientX, e.clientY);   // detección TOLERANTE (no hace falta acertar el píxel)
      if (foto) seleccionar(foto);
    }
  });
  vp.addEventListener("pointercancel", finArrastre);
  // El enlace de la foto NO navega directo: lo hace la animación (seleccionar()).
  canvas.addEventListener("click", e => { e.preventDefault(); }, true);

  // Encuentra la foto en (x,y): la de DELANTE si el punto cae dentro de alguna, y
  // si no aciertas dentro, la MÁS CERCANA en un radio — así se pinchan fácil hasta
  // las lejanas (ya no hay que estar pegado a la imagen).
  const TOL = 42;   // px de margen alrededor de cada foto en los que también cuenta el clic
  function fotoEn(x, y) {
    let best = null, bestScore = -Infinity;   // el punto cae DENTRO de alguna foto
    let cerca = null, cercaD = TOL * TOL;      // si no, la foto cuyo BORDE está más cerca
    for (let i = 0; i < capas.length; i++) {
      const op = parseFloat(getComputedStyle(capas[i]).opacity) || 0;   // opacidad REAL
      if (op <= CLIC_OP) continue;
      const its = capas[i].children;
      for (let j = 0; j < its.length; j++) {
        const r = its[j].getBoundingClientRect();
        if (!r.width) continue;
        const ddx = Math.max(r.left - x, 0, x - r.right);   // distancia al rectángulo
        const ddy = Math.max(r.top - y, 0, y - r.bottom);
        if (ddx === 0 && ddy === 0) {
          const score = r.width * op;          // dentro: gana la de delante (más grande y opaca)
          if (score > bestScore) { bestScore = score; best = its[j]; }
        } else {
          const d = ddx * ddx + ddy * ddy;
          if (d < cercaD) { cercaD = d; cerca = its[j]; }
        }
      }
    }
    return best || cerca;
  }

  // ANIMACIÓN al pinchar: TODAS las fotos se abren hacia los lados (cada una hacia
  // su lado) y se desvanecen. Al vaciarse la pantalla (queda el papel) se navega,
  // así el cambio de página cae sobre pantalla vacía —sin parón— y la ficha entra
  // con sus propias apariciones. Rápido.
  function seleccionar(item) {
    if (saliendo) return;
    const href = item.getAttribute("href");
    if (!href) return;
    try {
      if (new URL(href, window.location.href).searchParams.get("volver") === "index") guardarEstado();
    } catch (_) {}
    saliendo = true;   // congela el bucle: las fotos ya solo hacen esta salida
    matarCue();
    document.body.classList.remove("show-vercue");
    const irProyecto = (() => { let ido = false; return () => { if (ido) return; ido = true; window.location.href = href; }; })();

    if (reduce || !window.gsap) return irProyecto();

    const vw = vp.clientWidth;
    const cx = vw / 2;
    // Cada foto sale por SU lado (según dónde esté) y se va del todo, acelerando.
    canvas.querySelectorAll(".archivo-item").forEach(a => {
      const rr = a.getBoundingClientRect();
      const c = rr.left + rr.width / 2;
      const dir = c < cx ? -1 : 1;
      const dist = vw * 0.75 + Math.abs(c - cx);   // lo suficiente para salir por el borde
      gsap.set(a, { xPercent: -50, yPercent: -50 });   // mantiene el centrado del CSS
      gsap.to(a, { x: dir * dist, autoAlpha: 0, duration: 0.42, ease: "power2.in" });
    });

    // Cuando la pantalla ya está vacía, se navega (la ficha entra con sus reveals).
    gsap.delayedCall(0.4, irProyecto);
    setTimeout(irProyecto, 650);   // red de seguridad
  }

  // ---- Aviso "ARRASTRA" bajo el cursor (mismo efecto de seguimiento que la bola,
  // lo mueve cursor.js). Aparece al mover el ratón y desaparece en cuanto arrastras
  // la primera vez. Se recuerda con sessionStorage: NO vuelve a salir en esta visita,
  // pero sí reaparece en una visita nueva (así siempre orienta al que llega).
  const YA_VISTO = "loreArrastraVisto";
  let cuePuesto = false, cueMuerto = false;
  try { cueMuerto = sessionStorage.getItem(YA_VISTO) === "1"; } catch (_) {}
  function ponerCue() {
    if (cueMuerto || cuePuesto || !window.matchMedia("(pointer: fine)").matches) return;
    cuePuesto = true;
    document.body.classList.add("show-scrollcue");
    window.removeEventListener("mousemove", ponerCue);
  }
  function matarCue() {
    window.removeEventListener("mousemove", ponerCue);
    if (cueMuerto) return;
    cueMuerto = true;
    document.body.classList.remove("show-scrollcue");
    try { sessionStorage.setItem(YA_VISTO, "1"); } catch (_) {}
  }
  if (!cueMuerto) window.addEventListener("mousemove", ponerCue);

  // PARALLAX DE RATÓN (sutil): al mover el ratón, el punto de fuga se desplaza un
  // poco y las capas se mueven distinto según su profundidad. Da sensación de 3D
  // y de que hay algo que explorar, sin tener que arrastrar. PARALLAX = cuánto.
  const PARALLAX = 5;   // % (sube para exagerar el 3D, 0 para quitarlo)
  window.addEventListener("mousemove", e => {
    if (saliendo) return;
    tPox = (e.clientX / vp.clientWidth - 0.5) * -2 * PARALLAX;
    tPoy = (e.clientY / vp.clientHeight - 0.5) * -2 * PARALLAX;
  }, { passive: true });

  // Bucle: suaviza viaje y desplazamiento, aplica inercia y auto-zoom, y coloca
  // cada capa en su Z manteniendo las fotos siempre opacas.
  let poxEsc = 999, poyEsc = 999;
  function frame() {
    if (listoLayers && !saliendo) {
      // Inercia al soltar: el objetivo sigue avanzando y frenando poco a poco.
      if (!dragging && (Math.abs(vpanX) > 0.1 || Math.abs(vpanY) > 0.1)) {
        tPanX += vpanX; tPanY += vpanY; vpanX *= INERCIA; vpanY *= INERCIA; limitarPan();
      }
      if (!dragging && !reduce && !sobreFoto && ahora() > reposoDesde + ESPERA) tViaje += AUTO_VIAJE;

      viaje += (tViaje - viaje) * SUAVIDAD;   // el ZOOM sí se suaviza
      panX = tPanX; panY = tPanY;             // el DESPLAZAMIENTO va directo (sin lag ni rebote)
      canvas.style.transform = `translate3d(${panX.toFixed(2)}px,${panY.toFixed(2)}px,0)`;

      // Parallax de ratón: mover el punto de fuga (suave, y solo si cambia algo).
      pox += (tPox - pox) * 0.08; poy += (tPoy - poy) * 0.08;
      if (Math.abs(pox - poxEsc) > 0.05 || Math.abs(poy - poyEsc) > 0.05) {
        vp.style.perspectiveOrigin = `${(50 + pox).toFixed(1)}% ${(50 + poy).toFixed(1)}%`;
        poxEsc = pox; poyEsc = poy;
      }

      const area = vp.getBoundingClientRect();
      const estados = [];
      for (let i = 0; i < capas.length; i++) {
        const zSinEnvolver = viajeBase[i] + viaje;
        const ciclo = Math.floor((zSinEnvolver - Z_FONDO) / SPAN);
        if (ciclo > maxCicloCapa[i]) {
          renovarCapa(capas[i]);
          maxCicloCapa[i] = ciclo;
        }
        const z = envZ(zSinEnvolver);
        const t = (z - Z_FONDO) / SPAN;
        const op = paso01(0, FADE_IN, t);
        const c = capas[i];
        c.style.transform = `translateZ(${z.toFixed(1)}px)`;
        c.style.opacity = op.toFixed(3);
        const deriva = paso01(0.58, 0.98, t);
        for (const item of c.children) {
          if (deriva > 0) {
            const r = item.getBoundingClientRect();
            const deltaCentro = (r.left + r.right) / 2 - (area.left + area.right) / 2;
            if (Math.abs(deltaCentro) > 8 || !item.dataset.ladoDeriva) {
              item.dataset.ladoDeriva = String(Math.abs(deltaCentro) > 8
                ? Math.sign(deltaCentro)
                : parseFloat(item.dataset.ladoInicial) || 1);
            }
          }
          const direccion = parseFloat(item.dataset.ladoDeriva) || 0;
          const lateral = (parseFloat(item.dataset.deriva) || 0) * direccion * deriva;
          item.style.translate = `${lateral.toFixed(1)}px 0`;
        }
        estados.push({ capa: c, op, t, deriva });
      }
      for (const { capa, op, t, deriva } of estados) {
        for (const item of capa.children) {
          const r = item.getBoundingClientRect();
          const fuera = r.right <= area.left || r.left >= area.right
            || r.bottom <= area.top || r.top >= area.bottom;
          const desplazamientoLateral = Math.abs((parseFloat(item.dataset.deriva) || 0) * deriva);
          let opItem = desplazamientoLateral >= area.width * 0.08
            ? 1
            : 1 - paso01(FADE_OUT, 1, t);
          if (t >= 0.96 && !fuera) opItem = Math.min(opItem, 1 - paso01(0.96, 1, t));
          if (revelado) item.style.opacity = opItem.toFixed(3);
          const visibility = fuera ? "hidden" : "";
          if (item.style.visibility !== visibility) item.style.visibility = visibility;
        }
        // Clic incluso en capas lejanas. Solo se toca pointer-events cuando CAMBIA
        // (escribirlo cada fotograma provocaba recálculos y el arrastre se "petaba").
        const pe = op > CLIC_OP ? "auto" : "none";
        if (capa.dataset.pe !== pe) { capa.style.pointerEvents = pe; capa.dataset.pe = pe; }
      }
    }
    requestAnimationFrame(frame);
  }

  function build() {
    const vw = vp.clientWidth, vh = vp.clientHeight;
    if (vw < 10 || vh < 10) return;
    if (restaurarEstado()) return;
    canvas.innerHTML = ""; capas = []; viajeBase = []; maxCicloCapa = []; listoLayers = false;
    disponibles = barajar(fotosPendientes.slice()); recicladas = [];

    // Tamaño de las fotos y radio de dispersión dentro de cada capa. El campo es
    // MÁS ANCHO que la pantalla (y algo más alto), para que arrastres hacia donde
    // arrastres siempre haya fotos y con hueco entre ellas (como la referencia).
    // El campo cubre de sobra el recorrido del arrastre (PAN_TOPE) en cada eje.
    const anchoMin = Math.round(clamp(vw * 0.15, 140, 300));
    const anchoMax = Math.round(clamp(vw * 0.23, 190, 440));
    const RX = vw * 1.45, RY = vh * 1.70;

    // Se reparten las fotos por capas EN RONDA, para que cada capa mezcle
    // proyectos distintos (y no salgan todas las de uno en la misma profundidad).
    const porCapa = Array.from({ length: NUM_CAPAS }, () => []);
    data.forEach((p, i) => porCapa[i % NUM_CAPAS].push(p));

    for (let ci = 0; ci < NUM_CAPAS; ci++) {
      const capa = document.createElement("div");
      capa.className = "archivo-capa";
      const puestas = [];
      porCapa[ci].forEach(p => {
        const w = Math.round(gsap.utils.random(anchoMin, anchoMax));
        // Mejor de varias posiciones: la más separada de las ya puestas EN ESA capa
        let mejor = { ox: 0, oy: 0 }, mejorNota = -Infinity;
        for (let k = 0; k < 140; k++) {
          const ox = gsap.utils.random(-RX, RX);
          const oy = gsap.utils.random(-RY, RY);
          let nota = puestas.length ? Infinity : 9999;
          for (const b of puestas) nota = Math.min(nota, Math.hypot(ox - b.ox, oy - b.oy));
          if (nota > mejorNota) { mejorNota = nota; mejor = { ox, oy }; }
        }
        const a = document.createElement("a");
        a.className = "archivo-item";
        a.style.width = w + "px";
        a.style.left = Math.round(vw / 2 + mejor.ox) + "px";
        a.style.top  = Math.round(vh / 2 + mejor.oy) + "px";
        const centralidad = clamp(1 - Math.abs(mejor.ox) / (vw * 0.45), 0, 1);
        const lado = mejor.ox < 0 ? -1 : 1;
        a.dataset.ladoInicial = String(lado);
        a.dataset.deriva = (vw * 0.6 * centralidad).toFixed(1);
        ponerFoto(a, p);
        capa.appendChild(a);
        puestas.push(mejor);
      });
      canvas.appendChild(capa);
      capas.push(capa);
      viajeBase.push(ci / NUM_CAPAS * SPAN);   // repartidas por toda la profundidad
      maxCicloCapa.push(Math.floor((viajeBase[ci] - Z_FONDO) / SPAN));
    }

    // Arranca quieto y centrado. El bucle (que hace el zoom/parallax) se lanza 1 vez.
    viaje = tViaje = 0;
    panX = panY = tPanX = tPanY = 0;
    reposoDesde = ahora();
    listoLayers = true;
    if (!bucleOn) { bucleOn = true; requestAnimationFrame(frame); }

    // Las fotos empiezan invisibles: aparecerán POCO A POCO al quitar la pantalla
    // de carga (lo hace revelar()). Si ya se reveló antes (p. ej. al cambiar el
    // tamaño y reconstruir), salen visibles directamente.
    canvas.querySelectorAll(".archivo-item").forEach(a => { a.style.opacity = revelado ? "1" : "0"; });
    construido = true;
    revelar();
  }

  /* ---- PANTALLA DE CARGA REAL + APARICIÓN POCO A POCO ----------------------
     Se precargan DE VERDAD todas las fotos antes de enseñar nada. Mientras, la
     pantalla de carga tapa la portada con el porcentaje real. Cuando ya están
     todas (o salta la red de seguridad) se retira la pantalla y las fotos van
     apareciendo poco a poco. Así la portada entra fluida y no "petada". */
  const loader    = document.querySelector(".archivo-loader");
  const loaderNum = loader && loader.querySelector(".loader-num");
  let construido = false, precargado = false, revelado = false;

  if (!estadoGuardado) (function precargar() {
    // Tiempo MÍNIMO que se ve la carga: ni un parpadeo (si va rapidísimo) ni lenta.
    const MIN_CARGA = 850;
    const t0 = performance.now();
    const urls = [...new Set(data.map(d => d.img))];
    const total = urls.length || 1;
    let hechas = 0, realProg = urls.length ? 0 : 1;
    urls.forEach(src => {
      const im = new Image();
      const ok = () => { hechas++; realProg = hechas / total; };
      im.onload = ok; im.onerror = ok; im.src = src;
    });

    // El número SUBE hacia el menor de (carga real, tiempo mínimo): si la carga es
    // instantánea igual sube 0→100 en MIN_CARGA (se ve bien); si es lenta, va con
    // la carga real y no la adelanta.
    const li = setInterval(() => {
      const elapsed = performance.now() - t0;
      const mostrado = Math.min(realProg, elapsed / MIN_CARGA);
      if (loaderNum) loaderNum.textContent = Math.round(mostrado * 100) + "%";
      if (realProg >= 1 && elapsed >= MIN_CARGA) {
        clearInterval(li);
        if (loaderNum) loaderNum.textContent = "100%";
        precargaFin();
      }
    }, 30);
    setTimeout(() => { clearInterval(li); precargaFin(); }, 6000);   // red de seguridad
  })();

  function precargaFin() { if (precargado) return; precargado = true; revelar(); }

  // Solo revela cuando están AMBAS: fotos precargadas Y capas construidas.
  function revelar() {
    if (revelado || !precargado || !construido) return;
    revelado = true;
    reposoDesde = ahora();            // la cuenta del auto-zoom empieza al aparecer
    if (loader) { loader.classList.add("oculto"); setTimeout(() => { if (loader.parentNode) loader.remove(); }, 700); }
    const fotos = [...canvas.querySelectorAll(".archivo-item")];
    if (reduce) { fotos.forEach(f => { f.style.transition = "none"; f.style.opacity = "1"; }); return; }
    // Aparecen DE DELANTE A ATRÁS (para que se note la profundidad 3D): primero la
    // capa más cercana y luego las de detrás; dentro de cada capa, un pequeño escalón.
    const orden = capas
      .map((c, i) => ({ c, z: envZ(viajeBase[i]) }))
      .sort((a, b) => b.z - a.z);   // z mayor = más cerca = primero
    let d = 0;
    orden.forEach(({ c }) => {
      [...c.querySelectorAll(".archivo-item")].forEach(f => {
        f.style.transitionDelay = d.toFixed(2) + "s"; f.style.opacity = "1"; d += 0.04;
      });
      d += 0.18;   // respiro entre una capa y la siguiente
    });
    setTimeout(() => fotos.forEach(f => { f.style.transitionDelay = ""; }), 3200);
  }

  // Red de seguridad: a los 4,5 s las fotos se ven SÍ o SÍ (sin transición, por si
  // la pestaña estuvo en segundo plano y el fundido no llegó a correr) y la
  // pantalla de carga desaparece. Con la pestaña en primer plano el fundido ya
  // habrá terminado mucho antes, así que esto no se nota.
  if (!estadoGuardado) setTimeout(() => {
    precargado = true;
    if (construido) revelar();
    if (loader && loader.parentNode) { loader.classList.add("oculto"); setTimeout(() => { if (loader.parentNode) loader.remove(); }, 700); }
    canvas.querySelectorAll(".archivo-item").forEach(a => { a.style.transition = "none"; a.style.opacity = "1"; });
  }, 4500);

  // Esperar a que la ventana tenga tamaño real antes de repartir las piezas.
  // Se intenta por varios caminos a propósito: requestAnimationFrame NO corre
  // si la pestaña está en segundo plano, y entonces la pared no se montaba
  // hasta que volvías a ella. Con el temporizador y el evento de carga, se
  // monta igual.
  const listo    = () => vp.clientWidth > 10 && vp.clientHeight > 10;
  const intentar = () => { if (!listoLayers && listo()) build(); };

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

  /* ------------------------------------------------------------------------
     DESLIZAMIENTO SOLO Y LENTO. La columna de obras baja despacio ella sola, y
     dentro de una obra la tira horizontal avanza despacio. Se para al pasar el
     ratón por encima o al arrastrar/usar la rueda, y sigue un momento después.
     · VEL_COLUMNA / VEL_TIRA = píxeles por fotograma (más alto = más rápido).
     ------------------------------------------------------------------------ */
  if (!reduce) {
    const VEL_COLUMNA = 0.3;
    const VEL_TIRA = 0.45;
    let sobreGrid = false, sobreStrip = false, ruedaHasta = 0;

    // La columna se para SOLO cuando el ratón está sobre una obra (no al entrar en
    // la franja vacía de la columna). Al pasar entre trozos de la misma obra no
    // parpadea (se comprueba que el ratón salga de verdad de la obra).
    grid.addEventListener("mouseover", e => { if (e.target.closest(".lienzo-item")) sobreGrid = true; });
    grid.addEventListener("mouseout", e => {
      const it = e.target.closest(".lienzo-item");
      if (it && !it.contains(e.relatedTarget)) sobreGrid = false;
    });
    strip.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") sobreStrip = true; });
    strip.addEventListener("pointerleave", () => { sobreStrip = false; });
    const marcarRueda = () => { ruedaHasta = performance.now() + 1600; };
    grid.addEventListener("wheel", marcarRueda, { passive: true });
    strip.addEventListener("wheel", marcarRueda, { passive: true });

    function auto() {
      const ahora = performance.now();
      const libre = ahora > ruedaHasta;
      if (abierta) {
        if (unSet && libre && !sobreStrip && !drag) strip.scrollLeft += VEL_TIRA;
      } else if (bucleVertical) {
        if (periodo && libre && !sobreGrid && !gDrag) grid.scrollTop += VEL_COLUMNA;
      }
      requestAnimationFrame(auto);
    }
    requestAnimationFrame(auto);
  }
});


// SOBRE MÍ e HISTORIA — auto-scroll al estar quieta. Si la persona deja la página
// parada unos segundos, empieza a bajar sola y despacio. En cuanto vuelve a tocar
// (rueda, dedo, teclado o clic) se detiene y se reinicia la cuenta. En Sobre mí el
// texto está en bucle, así que baja sin fin; en Historia se para al llegar al pie.
// · VEL_AUTO = píxeles por fotograma · ESPERA = ms quieta antes de arrancar.
document.addEventListener("DOMContentLoaded", () => {
  const esSobre = document.body.classList.contains("page-sobremi");
  const esHist = document.body.classList.contains("page-historia");
  if (!esSobre && !esHist) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const VEL_AUTO = 0.6;
  const ESPERA = 3500;
  let activaHasta = performance.now() + ESPERA;   // no arranca hasta pasar la espera
  let acumulado = 0;

  const actividad = () => { activaHasta = performance.now() + ESPERA; acumulado = 0; };
  ["wheel", "touchstart", "touchmove", "keydown", "pointerdown"].forEach(ev =>
    window.addEventListener(ev, actividad, { passive: true }));

  const alFinal = () => {
    const doc = document.documentElement;
    return window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
  };

  function tick() {
    if (performance.now() >= activaHasta && !alFinal()) {
      acumulado += VEL_AUTO;
      const paso = Math.floor(acumulado);
      // behavior "auto" fuerza el paso instantáneo (el CSS pone scroll suave, que
      // aquí entrecortaría el goteo pixel a pixel).
      if (paso >= 1) { window.scrollBy({ top: paso, left: 0, behavior: "auto" }); acumulado -= paso; }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});
