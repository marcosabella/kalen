@echo off
setlocal
cd /d "%~dp0"
title Kalen - Servidor local HTTPS
if not exist ".local-https\server.pem" (
  echo Primero ejecuta npm run setup:local:https desde la carpeta del proyecto.
  pause
  exit /b 1
)
node scripts\start-local-https.mjs
pause
