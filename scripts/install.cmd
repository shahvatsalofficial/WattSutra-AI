@echo off
if "%~1"=="" (echo Usage: install.cmd ^<target_project^> [ide] & exit /b 2)
set "IDE=%~2"
if "%IDE%"=="" set "IDE=all"
node "%~dp0..\packages\cli\index.mjs" install --target "%~1" --ide "%IDE%"
exit /b %ERRORLEVEL%
