# Pintura — cómo están organizadas las imágenes

Los nombres de archivo (`web-NN-TAMAÑO.webp`) **no** indican de qué obra es cada foto.
La única fuente de verdad es **`web-obras.json`**, en esta misma carpeta. No hay que deducir nada del nombre.

## Estructura de `web-obras.json`

Es un array de obras (17). Cada obra:

```json
{
  "slug": "girasoles",             // id único, útil para URLs / anclas
  "titulo": "Girasoles",           // provisional, se puede cambiar
  "publicar": true,                // false = no mostrar en la web (hoy: solo el velero)
  "tecnica": "Pastel",             // etiqueta que sale junto a la obra (óleo, acuarela, pastel…)
  "descripcion": "…",              // texto corto que se ve al abrir la obra en la Galería
  "principal": { ...imagen },      // la foto de la obra terminada (portada)
  "detalles":  [ ...imagen ],      // primeros planos de la misma obra
  "proceso":   [ ...imagen ],      // fotos en el caballete / a medio pintar
  "nota": ""                       // aclaración humana, no la muestra la web
}
```

Cada `imagen`:

```json
{
  "n": 38,                                   // número web-NN
  "src": "media/proyectos/pintura/web-38-1600.webp",   // tamaño por defecto
  "srcset": "…-800.webp 800w, …-1600.webp 1600w, …-2560.webp 2560w",
  "w": 1197, "h": 1600,                     // medidas del src (para width/height)
  "original": "IMG_2026….jpg"                // nombre de la foto original, solo referencia
}
```

## Reglas para usarlo

- Mostrar solo obras con `publicar: true`.
- En listados / galería: usar solo `principal` como portada.
- En la ficha de una obra: `principal` primero, luego `detalles`, luego `proceso` (sección aparte, p. ej. "Proceso").
- `detalles` y `proceso` pueden venir vacíos.
- Todas las `<img>`: `srcset`, `sizes`, `width`/`height` (evita saltos de maquetación) y `loading="lazy"` salvo la primera visible (`fetchpriority="high"`).
- Todas las rutas son relativas a la raíz del sitio.

## Ejemplo mínimo

```js
fetch('media/proyectos/pintura/web-obras.json')
  .then(r => r.json())
  .then(obras => {
    const img = (i, lazy = true) =>
      `<img src="${i.src}" srcset="${i.srcset}" sizes="(max-width: 900px) 100vw, 70vw"
            width="${i.w}" height="${i.h}" alt="" ${lazy ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"'}>`;
    obras.filter(o => o.publicar).forEach((o, k) => {
      // portada: img(o.principal, k > 0)
      // ficha: [o.principal, ...o.detalles].map(i => img(i)); proceso: o.proceso.map(i => img(i))
    });
  });
```
