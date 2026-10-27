@echo off
setlocal
cd /d "%~dp0"
title Kalen - Servidor local
if not exist "runtime\node.exe" (
  echo Falta el runtime. Descomprimi el paquete completo antes de iniciar.
  pause
  exit /b 1
)
"runtime\node.exe" "scripts\start-local.mjs"
echo.
echo El servidor se detuvo. Podes cerrar esta ventana.
pause
