@echo off
setlocal
cd /d "%~dp0"
title Kalen - Servidor local HTTPS
if exist "runtime\node.exe" (
  set "KALEN_LOCAL_DIST=%~dp0dist"
  "runtime\node.exe" "scripts\start-local-https.mjs"
) else (
  node "scripts\start-local-https.mjs"
)
echo.
echo El servidor se detuvo. Podes cerrar esta ventana.
pause
