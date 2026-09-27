"""
optimizar-webp-proyectos.py
---------------------------
Genera versiones WebP en varios tamaños de las fotos de los PROYECTOS
(media/proyectos/<slug>/web-*.jpg|png) para servirlas con srcset + carga
diferida, igual que ya hace la galería (pintura).

Por qué este script y no optimizar-webp.py:
  - CONSERVA el nombre original: web-03.jpg -> web-03-400.webp, web-03-800.webp...
    (el otro renumeraba 01,02,03... y se desalineaba con los huecos y duplicados).
  - CONSERVA la transparencia (los PNG con fondo transparente siguen sin fondo;
    WebP soporta alfa). El otro los aplanaba a RGB y les ponía fondo negro.
  - Escribe UN solo mapa combinado: media/proyectos/webp-map.json, con las
    variantes de cada imagen (ruta, ancho, alto). El HTML lo lee para montar el
    srcset automáticamente. Se puede correr varias veces (va fusionando el mapa).

Requisitos:  pip install pillow

Uso (desde la raíz del repo):
  # Todos los proyectos de una vez (recomendado):
  python scripts/optimizar-webp-proyectos.py

  # O solo algunos:
  python scripts/optimizar-webp-proyectos.py thompson cata-la-lata

Opciones:
  --tamanos 400 800 1600 2560   lados largos a generar (por defecto)
  --calidad 82                  calidad WebP (0-100)
  --raiz media/proyectos        carpeta donde están los <slug>/
"""
import argparse, json, sys
from pathlib import Path
from PIL import Image, ImageOps

EXT = {".jpg", ".jpeg", ".png"}
# Carpetas que NO se tocan: la galería ya está en WebP y las de originales llevan acento.
EXCLUIR = {"pintura"}


def tiene_alfa(im: "Image.Image") -> bool:
    return im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)


def procesar_imagen(f: Path, tamanos, calidad):
    """Genera las variantes WebP de UNA imagen. Devuelve la lista de variantes."""
    im = ImageOps.exif_transpose(Image.open(f))
    icc = im.info.get("icc_profile")
    alfa = tiene_alfa(im)
    im = im.convert("RGBA") if alfa else im.convert("RGB")
    W, H = im.size
    largo = max(W, H)

    tams = [t for t in tamanos if t < largo] or []
    if largo not in tams:
        tams.append(largo)  # versión a tamaño nativo (nunca se amplía)
    variantes = []
    for t in sorted(set(tams)):
        k = t / largo
        w, h = max(1, round(W * k)), max(1, round(H * k))
        out = f.with_name(f"{f.stem}-{t}.webp")
        params = dict(quality=calidad, method=6)
        if icc:
            params["icc_profile"] = icc
        im.resize((w, h), Image.LANCZOS).save(out, "WEBP", **params)
        variantes.append({"src": out.as_posix(), "w": w, "h": h,
                          "kb": out.stat().st_size // 1024})
    return variantes, alfa


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*", help="carpetas de proyecto concretas (vacío = todas)")
    ap.add_argument("--raiz", default="media/proyectos")
    ap.add_argument("--tamanos", type=int, nargs="+", default=[400, 800, 1600, 2560])
    ap.add_argument("--calidad", type=int, default=82)
    a = ap.parse_args()

    raiz = Path(a.raiz)
    if not raiz.is_dir():
        sys.exit(f"No encuentro la carpeta {raiz} (córrelo desde la raíz del repo).")

    # Qué carpetas procesar
    if a.slugs:
        carpetas = [raiz / s for s in a.slugs]
    else:
        carpetas = [d for d in sorted(raiz.iterdir())
                    if d.is_dir() and d.name not in EXCLUIR
                    and (list(d.glob("web-*.jpg")) + list(d.glob("web-*.jpeg")) + list(d.glob("web-*.png")))]

    # Mapa combinado (se fusiona con lo que ya hubiera)
    mapa_path = raiz / "webp-map.json"
    mapa = {}
    if mapa_path.exists():
        try:
            mapa = json.loads(mapa_path.read_text("utf-8"))
        except Exception:
            mapa = {}

    total_kb, n_img = 0, 0
    for carpeta in carpetas:
        # fuentes = web-*.{jpg,jpeg,png} originales (las variantes .webp y las
        # miniaturas -thumb.jpg de las hojas de contactos se excluyen)
        fuentes = sorted(p for p in carpeta.iterdir()
                         if p.suffix.lower() in EXT and p.name.startswith("web-")
                         and not p.stem.endswith("-thumb"))
        if not fuentes:
            continue
        print(f"\n== {carpeta.name} ==")
        for f in fuentes:
            variantes, alfa = procesar_imagen(f, a.tamanos, a.calidad)
            clave = f.as_posix()
            mapa[clave] = {"variantes": variantes, "alfa": alfa}
            n_img += 1
            total_kb += sum(v["kb"] for v in variantes)
            etiqueta = " (transparente)" if alfa else ""
            print(f"  {f.name}{etiqueta}: " + "  ".join(f"{v['w']}x{v['h']}={v['kb']}KB" for v in variantes))

    mapa_path.write_text(json.dumps(mapa, indent=1, ensure_ascii=False), "utf-8")
    print(f"\nListo. {n_img} imágenes, {total_kb/1024:.1f} MB en variantes WebP.")
    print(f"Mapa escrito en {mapa_path}")


if __name__ == "__main__":
    sys.exit(main())
