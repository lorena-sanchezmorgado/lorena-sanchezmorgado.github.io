# Servidor estático simple para previsualizar el portfolio en local.
# No necesita instalar nada (usa PowerShell). Arráncalo con start-servidor.bat
# o con:  powershell -ExecutionPolicy Bypass -File scripts\serve.ps1
param([int]$Port = 8790)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot   # carpeta del proyecto (padre de /scripts)

$types = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8";
  ".js"="application/javascript; charset=utf-8"; ".json"="application/json";
  ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".png"="image/png"; ".gif"="image/gif";
  ".svg"="image/svg+xml"; ".webp"="image/webp"; ".ico"="image/x-icon";
  ".otf"="font/otf"; ".ttf"="font/ttf"; ".woff"="font/woff"; ".woff2"="font/woff2";
  ".pdf"="application/pdf"; ".mp4"="video/mp4"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Servidor en marcha  ->  http://localhost:$Port/index.html"
Write-Host "Sirviendo: $root"
Write-Host "Para parar: cierra esta ventana o pulsa Ctrl+C"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
    $path = Join-Path $root $rel
    if ((Test-Path $path) -and (Get-Item $path).PSIsContainer) { $path = Join-Path $path "index.html" }

    if (Test-Path $path -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $ctype = $types[$ext]; if (-not $ctype) { $ctype = "application/octet-stream" }
      $ctx.Response.ContentType = $ctype
      if ($ext -eq ".mp4") {
        $length = (Get-Item $path).Length
        $start = [long]0
        $end = $length - 1
        $range = $ctx.Request.Headers["Range"]
        $validRange = $true

        if ($range -match "^bytes=(\d*)-(\d*)$") {
          if ($Matches[1] -eq "" -and $Matches[2] -eq "") {
            $validRange = $false
          } elseif ($Matches[1] -eq "") {
            $suffix = [Math]::Min([long]$Matches[2], $length)
            $start = $length - $suffix
          } else {
            $start = [long]$Matches[1]
            if ($Matches[2] -ne "") { $end = [Math]::Min([long]$Matches[2], $end) }
          }
          if ($start -ge $length -or $start -gt $end) { $validRange = $false }
        }

        $ctx.Response.Headers["Accept-Ranges"] = "bytes"
        if (-not $validRange) {
          $ctx.Response.StatusCode = 416
          $ctx.Response.Headers["Content-Range"] = "bytes */$length"
        } else {
          if ($range -match "^bytes=(\d*)-(\d*)$") {
            $ctx.Response.StatusCode = 206
            $ctx.Response.Headers["Content-Range"] = "bytes $start-$end/$length"
          }
          $ctx.Response.ContentLength64 = $end - $start + 1
          if ($ctx.Request.HttpMethod -ne "HEAD") {
            $stream = [System.IO.File]::OpenRead($path)
            try {
              [void]$stream.Seek($start, [System.IO.SeekOrigin]::Begin)
              $buffer = New-Object byte[] 65536
              $remaining = $end - $start + 1
              while ($remaining -gt 0) {
                $read = $stream.Read($buffer, 0, [int][Math]::Min($buffer.Length, $remaining))
                if ($read -le 0) { break }
                $ctx.Response.OutputStream.Write($buffer, 0, $read)
                $remaining -= $read
              }
            } catch [System.Net.HttpListenerException] {
              # Browsers cancel range requests when they have enough video data.
            } catch [System.IO.IOException] {
              # A cancelled or closed media connection should not stop the server.
            } finally {
              $stream.Dispose()
            }
          }
        }
      } else {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $ctx.Response.ContentLength64 = $bytes.Length
        if ($ctx.Request.HttpMethod -ne "HEAD") {
          $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      }
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - no encontrado: $rel")
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop()
}
