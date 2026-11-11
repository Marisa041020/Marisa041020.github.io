@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "NODE_DIR=C:\Users\xing\.workbuddy\binaries\node\versions\22.22.2-3"
if exist "%NODE_DIR%\node.exe" set "PATH=%NODE_DIR%;%PATH%"

if not exist "node_modules" (
  echo [1/2] Installing dependencies, this may take a few minutes...
  call npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
  if errorlevel 1 (
    echo Install failed. Check your network and try again.
    pause
    exit /b 1
  )
)

echo [2/2] Starting local preview at http://localhost:4000
start "" http://localhost:4000
node "node_modules\hexo\bin\hexo" server
pause
