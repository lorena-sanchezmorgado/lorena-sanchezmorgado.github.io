// OFFCANVAS (menú móvil, si existe en la página)
(function () {
  const $offcanvas = $("#offcanvasNavbar");
  if (!$offcanvas.length) return;

  $offcanvas.on("show.bs.offcanvas", function () {
    $("body").addClass("offcanvas-open");
    $(window).trigger("scroll");
  });

  $offcanvas.on("hidden.bs.offcanvas", function () {
    $("body").removeClass("offcanvas-open");
    $(window).trigger("scroll");
  });
})();


// FOOTER + MARQUEE
$(function () {

  const $footer = $("footer");

  function setHeroHeight() {
    const footerHeight = $footer.outerHeight();
    document.documentElement.style.setProperty(
      "--footer-height",
      `${footerHeight}px`
    );
  }

  setHeroHeight();
  $(window).on("resize", setHeroHeight);


  const $loop = $("#heroLoop");
  if (!$loop.length) return;

  const loopWidth = $loop.outerWidth();

  gsap.set($loop, { x: 0 });

  gsap.to($loop, {
    x: -loopWidth / 2,
    duration: 60,
    ease: "none",
    repeat: -1
  });

});


// HOME - fisica de las letras
(() => {
  const letters = document.querySelectorAll("#heroLoop span span");
  if (!letters.length || !window.gsap) return;

  letters.forEach(letter => {
    let vx = 0, vy = 0;
    let x = 0, y = 0;
    let rotation = 0;
    let scale = 1;
    let rafId = null;
    let active = false;
    let returning = false;
    let lastTime = null;

    const origin = { x: 0, y: 0 };

    requestAnimationFrame(() => {
      origin.x = gsap.getProperty(letter, "x");
      origin.y = gsap.getProperty(letter, "y");
      x = origin.x;
      y = origin.y;
    });

    const bounds = { x: 80, yTop: -160 };

    function startPhysics() {
      if (active && !returning) return;

      active = true;
      returning = false;
      lastTime = null;

      vx = gsap.utils.random(-300, 300);
      vy = gsap.utils.random(-900, -600);

      if (!rafId) rafId = requestAnimationFrame(loop);
    }

    function loop(time) {
      if (!active) return;

      if (!lastTime) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (!returning) {
        vy += 2000 * dt;
        x += vx * dt;
        y += vy * dt;

        if (x > origin.x + bounds.x || x < origin.x - bounds.x) {
          vx *= -0.85;
          x = gsap.utils.clamp(origin.x - bounds.x, origin.x + bounds.x, x);
        }

        if (y > origin.y) {
          y = origin.y;
          vy *= -0.75;
          vx *= 0.96;
          if (Math.abs(vy) < 200) vy = gsap.utils.random(-700, -500);
        }

        if (y < origin.y + bounds.yTop) {
          y = origin.y + bounds.yTop;
          vy *= -0.8;
        }
      } else {
        vx += (origin.x - x) * 10 * dt;
        vy += (origin.y - y) * 10 * dt;
        vx *= 0.88;
        vy *= 0.88;
        x += vx * dt;
        y += vy * dt;

        if (
          Math.abs(x - origin.x) < 0.3 &&
          Math.abs(y - origin.y) < 0.3 &&
          Math.abs(vx) < 8 &&
          Math.abs(vy) < 8
        ) {
          active = false;
          cancelAnimationFrame(rafId);
          rafId = null;
          gsap.set(letter, { x: origin.x, y: origin.y, rotate: 0, scale: 1 });
          return;
        }
      }

      const speed = Math.sqrt(vx * vx + vy * vy);
      rotation += vx * 0.002;
      rotation *= returning ? 0.85 : 0.92;

      const targetScale = gsap.utils.clamp(0.95, 1.15, 1 + speed / 4000);
      scale += (targetScale - scale) * (returning ? 0.15 : 0.25);

      gsap.set(letter, { x, y, rotate: rotation, scale });
      rafId = requestAnimationFrame(loop);
    }

    letter.addEventListener("mouseenter", startPhysics);
    letter.addEventListener("mouseleave", () => (returning = true));
  });
})();


// WORK
$(function () {
  const $cards = $(".archive-card");

  $cards.on("mouseenter", function () {
    $cards.removeClass("is-active");
    $(this).addClass("is-active");
  });

  $cards.on("mouseleave", function () {
    $(this).removeClass("is-active");
  });

  $cards.on("click", function () {
    window.location.href = $(this).data("link");
  });
});


// PROJECT - preview que sigue al cursor
$(function () {

  const preview = document.querySelector(".project-preview");
  if (!preview) return;

  const img = preview.querySelector("img");
  if (!img) return;

  const xTo = gsap.quickTo(preview, "x", { duration: 0.35, ease: "power3" });
  const yTo = gsap.quickTo(preview, "y", { duration: 0.35, ease: "power3" });

  // delegado: la lista de la ficha se construye por JS
  $(document).on("mouseenter", ".ficha-item, .project-menu li", function () {
    const src = $(this).data("img");
    if (!src) return;
    img.src = src;
    gsap.to(preview, { opacity: 1, duration: 0.2 });
  });

  $(document).on("mouseleave", ".ficha-item, .project-menu li", function () {
    gsap.to(preview, { opacity: 0, duration: 0.2 });
  });

  // Sigue al cursor, pero se mantiene SIEMPRE dentro de la pantalla
  // (así las imágenes verticales no se cortan aunque el ratón esté abajo).
  $(window).on("mousemove", e => {
    const pad = 16;
    const pw = preview.offsetWidth || 0;
    const ph = preview.offsetHeight || 0;
    let x = e.clientX + 20;
    let y = e.clientY + 20;
    x = Math.max(pad, Math.min(x, window.innerWidth - pw - pad));
    y = Math.max(pad, Math.min(y, window.innerHeight - ph - pad));
    xTo(x);
    yTo(y);
  });

});


// PROJECT - abrir directamente via ?project=project-01
$(function () {
  const params = new URLSearchParams(window.location.search);
  const project = params.get("project");

  if (!project) return;
  if (!/^[a-z0-9-]+$/i.test(project)) return;

  const $content = $(".project-content");
  if (!$content.length) return;

  if (window.innerWidth <= 767) $("body").addClass("project-open");

  $content.load(`projects/${project}.html`);
});


// PROJECT - abrir / cerrar
$(document).ready(function () {

  const isMobile = window.innerWidth <= 767;
  const $preview = $(".project-preview");

  function hidePreview() {
    if ($preview.length) gsap.to($preview[0], { opacity: 0, duration: 0.2 });
  }

  $(document).on("click", "[data-target], [data-project]", function () {
    const target =
      $(this).data("target") ||
      $(this).data("project");

    if (!target) return;

    hidePreview();

    if (isMobile) {
      $("body").addClass("project-open");

      $(".project-mobile-menu").hide();
      $(".project-content, .project-mobile-content")
        .empty()
        .load(target, function () {
          $(this).scrollTop(0);
        });

    } else {
      $(".project-content")
        .stop(true)
        .fadeOut(200, function () {
          $(this).load(target, function () {
            $(this).fadeIn(200);
          });
        });
    }
  });

  $(document).on("click", ".project-back", function () {
    $("body").removeClass("project-open");
    $(".project-mobile-menu").show();
    $(".project-content").empty();
    hidePreview();
  });

});


// ARCHIVE - cambio de vista
document.addEventListener("DOMContentLoaded", () => {
  const btnExp = document.querySelector(".btn-exp");
  const btnGrid = document.querySelector(".btn-view");
  const viewExp = document.getElementById("EXPERIENCE_VIEW");
  const viewGrid = document.getElementById("GRID_VIEW");

  if (!btnExp || !btnGrid || !viewExp || !viewGrid) return;

  function setView(view, setActive = true) {
    const showExperience = view === "experience";

    // Oculta / muestra sin romper el display original (bootstrap row etc.)
    viewExp.hidden = !showExperience;
    viewGrid.hidden = showExperience;

    if (!setActive) {
      btnExp.classList.remove("active");
      btnGrid.classList.remove("active");
      return;
    }

    btnExp.classList.toggle("active", showExperience);
    btnGrid.classList.toggle("active", !showExperience);
  }

  setView("experience");

  btnExp.addEventListener("click", (e) => {
    e.preventDefault();
    setView("experience");
  });

  btnGrid.addEventListener("click", (e) => {
    e.preventDefault();
    setView("grid");
  });
});


// ARCHIVE - imagenes arrastrables
document.addEventListener("DOMContentLoaded", () => {
  const stage = document.querySelector("#EXPERIENCE_VIEW .stage");
  if (!stage || !window.gsap || !window.Draggable) return;

  const imgs = gsap.utils.toArray("img.draggable", stage);
  if (!imgs.length) return;

  let z = 1;

  function placeRandom() {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    if (W < 10 || H < 10) return false;

    const GAP = 120;
    const placed = [];

    imgs.forEach(img => {
      const w = img.offsetWidth;
      const h = img.offsetHeight;

      let x = 0, y = 0, ok = false;

      for (let i = 0; i < 300 && !ok; i++) {
        x = Math.random() * Math.max(0, W - w);
        y = Math.random() * Math.max(0, H - h);

        ok = placed.every(p =>
          x + w + GAP < p.x ||
          p.x + p.w + GAP < x ||
          y + h + GAP < p.y ||
          p.y + p.h + GAP < y
        );
      }

      gsap.set(img, { x, y, position: "absolute" });
      placed.push({ x, y, w, h });
    });

    return true;
  }

  // Espera a que carguen las imagenes y a que la stage tenga tamano real
  Promise.all(
    imgs.map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve())
  ).then(() => {
    let tries = 0;
    const tick = () => {
      if (placeRandom() || tries++ > 40) return;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(() => requestAnimationFrame(tick));
  });

  imgs.forEach(img => {
    Draggable.create(img, {
      type: "x,y",
      bounds: stage,
      inertia: false,
      onPress() {
        this.target.style.zIndex = ++z;
      }
    });
  });

  window.addEventListener("resize", placeRandom);
});



