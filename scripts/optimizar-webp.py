"""
optimizar-webp.py
-----------------
Convierte en lote las fotos de una carpeta a WebP en 3 tamaños (lado largo
800 / 1600 / 2560 px) para usarlas con srcset + lazy loading en GitHub Pages.

- Corrige la rotación del móvil (EXIF) y luego BORRA los metadatos (GPS incluido).
- Nunca amplía: si la foto es más pequeña que un tamaño, ese tamaño se omite.
- Salta duplicados exactos (mismo contenido de archivo).
- Genera un manifest.json y un snippet.html con las etiquetas <img> listas.

Uso (desde la raíz del repo; requiere:  pip install pillow):

  python scripts/optimizar-webp.py "media/proyectos/Cuadros" "media/proyectos/cuadros" --prefijo cuadros

Opciones:
  --tamanos 800 1600 2560   lados largos a generar
  --calidad 80              calidad WebP (0-100)
  --prefijo web             nombre base (cuadros-01-1600.webp ...)
"""
import argparse, hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageOps

EXT = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}


def md5(p: Path) -> str:
    h = hashlib.md5()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("origen")
    ap.add_argument("destino")
    ap.add_argument("--prefijo", default="web")
    ap.add_argument("--tamanos", type=int, nargs="+", default=[800, 1600, 2560])
    ap.add_argument("--calidad", type=int, default=80)
    a = ap.parse_args()

    src, dst = Path(a.origen), Path(a.destino)
    dst.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in src.iterdir() if p.suffix.lower() in EXT)

    vistos, manifest, n = {}, [], 0
    for f in files:
        h = md5(f)
        if h in vistos:
            print(f"  (duplicado de {vistos[h]}, se salta) {f.name}")
            continue
        vistos[h] = f.name
        n += 1
        im = ImageOps.exif_transpose(Image.open(f))
        icc = im.info.get("icc_profile")
        im = im.convert("RGB")
        W, H = im.size
        largo = max(W, H)
        base = f"{a.prefijo}-{n:02d}"
        variantes = []
        tams = [t for t in a.tamanos if t < largo] or [largo]
        if largo < max(a.tamanos) and largo not in tams:
            tams.append(largo)  # versión nativa como la mayor
        for t in sorted(set(tams)):
            k = t / largo
            w, h = round(W * k), round(H * k)
            out = dst / f"{base}-{t}.webp"
            im.resize((w, h), Image.LANCZOS).save(
                out, "WEBP", quality=a.calidad, method=6, icc_profile=icc)
            variantes.append({"src": out.as_posix(), "w": w, "h": h,
                              "kb": out.stat().st_size // 1024})
        manifest.append({"n": n, "original": f.name, "base": base, "variantes": variantes})
        print(f"  {base}  " + "  ".join(f"{v['w']}x{v['h']}={v['kb']}KB" for v in variantes)
              + f"   <-  {f.name}")

    (dst / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), "utf-8")

    # Snippet HTML: srcset + sizes + lazy + width/height (evita saltos de layout / CLS)
    lines = []
    for i, m in enumerate(manifest):
        v = m["variantes"]
        mid = v[len(v) // 2] if len(v) > 1 else v[0]
        srcset = ", ".join(f"{x['src']} {x['w']}w" for x in v)
        lazy = 'fetchpriority="high"' if i == 0 else 'loading="lazy" decoding="async"'
        lines.append(f'<img src="{mid["src"]}" srcset="{srcset}" '
                     f'sizes="(max-width: 900px) 100vw, 70vw" width="{mid["w"]}" height="{mid["h"]}" '
                     f'alt="" {lazy}>')
    (dst / "snippet.html").write_text("\n".join(lines) + "\n", "utf-8")

    total = sum(v["kb"] for m in manifest for v in m["variantes"])
    print(f"\nListo. {n} imágenes, {total/1024:.1f} MB en total -> {dst}")


if __name__ == "__main__":
    sys.exit(main())
