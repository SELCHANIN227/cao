@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo.
echo CAO A1 - generate only missing audio files
echo Existing MP3 files will be kept.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\generate-missing-audio.ps1" -Root "%~dp0"
set "RESULT=%ERRORLEVEL%"

echo.
if not "%RESULT%"=="0" (
  echo Audio update failed. Read the error above.
) else (
  echo Audio update finished.
)
echo.
pause
exit /b %RESULT%
