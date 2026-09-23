@echo off
REM Doble clic aqui para previsualizar el portfolio en el navegador.
REM Arranca un servidor local (no instala nada) y abre la web.
start "" http://localhost:8790/index.html
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\serve.ps1"
