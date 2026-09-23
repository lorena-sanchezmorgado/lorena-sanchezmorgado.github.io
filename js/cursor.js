document.addEventListener("DOMContentLoaded", () => {
  const ball = document.querySelector(".cursor-ball");
  if (!ball || !window.gsap) return;

  // El cursor personalizado solo tiene sentido si hay un puntero fino (ratón/trackpad)
  // capaz de "hover". Muchos portátiles Windows con pantalla táctil reportan
  // maxTouchPoints > 0 aunque se usen con ratón, así que NO nos fiamos de eso:
  // usamos media queries de puntero. Si no hay puntero fino, dejamos el cursor nativo.
  const finePointer = window.matchMedia("(pointer: fine)");

  const moveX = gsap.quickTo(ball, "x", { duration: 0.3, ease: "power3.out" });
  const moveY = gsap.quickTo(ball, "y", { duration: 0.3, ease: "power3.out" });

  // Etiqueta "SCROLL" (solo en Sobre mí): va FUERA de la bola para no heredar su
  // mix-blend-mode. Se mueve con left/top (no transform) para conservar el
  // translateX(-50%) que la centra bajo el cursor.
  const label = document.querySelector(".cursor-scroll");
  const labX = label ? gsap.quickTo(label, "left", { duration: 0.3, ease: "power3.out" }) : null;
  const labY = label ? gsap.quickTo(label, "top", { duration: 0.3, ease: "power3.out" }) : null;

  function onMove(e) {
    moveX(e.clientX);
    moveY(e.clientY);
    if (labX) { labX(e.clientX); labY(e.clientY); }
  }

  function enable() {
    if (document.body.classList.contains("cursor-custom")) return;
    document.body.classList.add("cursor-custom");     // activa la bola + oculta el cursor nativo (CSS)
    window.addEventListener("mousemove", onMove);
  }

  function disable() {
    document.body.classList.remove("cursor-custom");
    window.removeEventListener("mousemove", onMove);
  }

  // Estado inicial según el tipo de puntero
  if (finePointer.matches) enable(); else disable();

  // Si el equipo cambia de puntero (ej. tablet que conecta ratón), reaccionamos
  const onChange = (e) => (e.matches ? enable() : disable());
  if (finePointer.addEventListener) finePointer.addEventListener("change", onChange);
  else if (finePointer.addListener) finePointer.addListener(onChange);      // navegadores antiguos

  // Al tocar la pantalla en un híbrido, ocultamos la bola hasta el próximo movimiento de ratón
  window.addEventListener("touchstart", disable, { passive: true });

  // --- Indicador "SCROLL" bajo el cursor (solo en Sobre mí) ----------------
  // Aparece la palabra SCROLL debajo de la bola al mover el ratón (si estamos
  // arriba del todo) y desaparece PARA SIEMPRE en cuanto se baja unos píxeles.
  // En móvil/táctil no hay bola, así que no se muestra nada.
  if (document.body.classList.contains("page-sobremi")) {
    const THRESH = 48;                       // px de scroll que "apagan" el aviso
    let cueKilled = window.scrollY > THRESH;  // si se entra ya desplazado, ni aparece

    function killCue() {
      if (cueKilled) return;
      cueKilled = true;
      document.body.classList.remove("show-scrollcue");
      window.removeEventListener("scroll", onCueScroll);
      window.removeEventListener("mousemove", armCue);
    }
    function onCueScroll() {
      if (window.scrollY > THRESH) killCue();
    }
    function armCue() {
      window.removeEventListener("mousemove", armCue);
      if (cueKilled) return;
      if (finePointer.matches && window.scrollY <= THRESH) {
        document.body.classList.add("show-scrollcue");
      }
    }

    if (!cueKilled) {
      window.addEventListener("mousemove", armCue);
      window.addEventListener("scroll", onCueScroll, { passive: true });
    }
  }
});
