<#
  optimizar-imagenes.ps1
  ----------------------
  Prepara imágenes para la web: las reduce de tamaño y las guarda como .jpg
  ligeros dentro de la carpeta del proyecto, con nombres ordenados
  (web-01.jpg, web-02.jpg, ...).

  POR QUÉ: las fotos originales pesan entre 2 y 40 MB. Así la web tarda
  siglos en cargar. Este script las deja en menos de 400 KB sin que se note.

  CÓMO SE USA (desde la carpeta del proyecto, en la terminal de VS Code):

  1) Convertir TODAS las imágenes de una carpeta, por orden alfabético:

     powershell -ExecutionPolicy Bypass -File scripts\optimizar-imagenes.ps1 `
       -Origen "media\proyectos\Hotel Thompson" -Destino "media\proyectos\thompson"

  2) Elegir las imágenes Y EL ORDEN a mano (lo más habitual):

     powershell -ExecutionPolicy Bypass -File scripts\optimizar-imagenes.ps1 `
       -Destino "media\proyectos\thompson" `
       -Archivos "media\proyectos\Hotel Thompson\camiseta montado.png",
                 "media\proyectos\Hotel Thompson\Lata barquillos montado.png"

     La primera será web-01.jpg, la segunda web-02.jpg, etc.

  OPCIONES:
    -Ancho 1600      ancho máximo en píxeles (por defecto 1600)
    -Calidad 82      calidad del jpg, de 1 a 100 (por defecto 82)
    -Prefijo web     nombre base de los archivos (por defecto "web")
    -Empezar 1       número por el que empieza a numerar (útil para añadir sin pisar)
#>

param(
  [string]   $Origen,
  [string[]] $Archivos,
  [Parameter(Mandatory=$true)][string] $Destino,
  [int]      $Ancho    = 1600,
  [int]      $Calidad  = 82,
  [string]   $Prefijo  = "web",
  [int]      $Empezar  = 1
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot

function Ruta($p) {
  if ([System.IO.Path]::IsPathRooted($p)) { return $p }
  return (Join-Path $raiz $p)
}

$destinoAbs = Ruta $Destino
if (-not (Test-Path $destinoAbs)) { New-Item -ItemType Directory -Force $destinoAbs | Out-Null }

# Lista de imágenes a procesar, en orden
if ($Archivos) {
  $lista = $Archivos | ForEach-Object { Ruta $_ }
} elseif ($Origen) {
  $origenAbs = Ruta $Origen
  $lista = Get-ChildItem -Path $origenAbs -File |
           Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' } |
           Sort-Object Name | ForEach-Object { $_.FullName }
} else {
  throw "Hay que pasar -Origen (una carpeta) o -Archivos (una lista de imágenes)."
}

# Codificador JPEG con la calidad pedida
$codec  = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Calidad

$n = $Empezar
foreach ($archivo in $lista) {
  if (-not (Test-Path $archivo)) { Write-Host "  (no existe, se salta) $archivo"; continue }

  $img = [System.Drawing.Image]::FromFile($archivo)
  try {
    $escala = [Math]::Min(1.0, $Ancho / [double]$img.Width)
    $w = [int][Math]::Round($img.Width  * $escala)
    $h = [int][Math]::Round($img.Height * $escala)

    $lienzo = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($lienzo)
    try {
      # Fondo color papel: si el PNG tiene transparencia, no sale negro
      $g.Clear([System.Drawing.Color]::FromArgb(255, 255, 251, 245))
      $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.DrawImage($img, 0, 0, $w, $h)
    } finally { $g.Dispose() }

    $nombre = "{0}-{1:D2}.jpg" -f $Prefijo, $n
    $salida = Join-Path $destinoAbs $nombre
    $lienzo.Save($salida, $codec, $params)
    $lienzo.Dispose()

    $kb = [int]((Get-Item $salida).Length / 1KB)
    Write-Host ("  {0}  ({1}x{2}, {3} KB)   <-  {4}" -f $nombre, $w, $h, $kb, (Split-Path $archivo -Leaf))
    $n++
  } finally { $img.Dispose() }
}

Write-Host ""
Write-Host ("Listo. {0} imagenes en {1}" -f ($n - $Empezar), $Destino)
