@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

rem Read the Windows system proxy, git needs it to reach GitHub here.
for /f "delims=" %%P in ('powershell -NoProfile -Command "try { (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings').ProxyServer } catch { '' }"') do set "PROXY=%%P"
if defined PROXY (
  if not "%PROXY:http=%"=="%PROXY%" (
    set "PROXYURL=%PROXY%"
  ) else (
    set "PROXYURL=http://%PROXY%"
  )
  set "HTTP_PROXY=%PROXYURL%"
  set "HTTPS_PROXY=%PROXYURL%"
  echo Using proxy %PROXYURL%
)

git add -A
git commit -m "update %DATE% %TIME%"

echo.
echo Pushing to GitHub...
git push origin main
if errorlevel 1 (
  echo.
  echo ------------------------------------------------------------
  echo Push failed.
  echo If it says authentication failed, run this once:
  echo     git credential-manager github login
  echo Then double-click this file again.
  echo If it says it cannot connect, check your proxy software.
  echo ------------------------------------------------------------
  pause
  exit /b 1
)

echo.
echo Done. GitHub is building now, the site updates in about a minute:
echo     https://notedown.top
pause
