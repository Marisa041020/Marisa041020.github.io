@echo off
chcp 65001 >nul
setlocal
title Compress photos for blog

set "SRC=%~1"
if "%SRC%"=="" (
  echo.
  echo   Drag the folder containing your photos onto this .bat file.
  echo   If you double-clicked it, paste the folder path below.
  echo.
  set /p "SRC=Folder path: "
)

set "SRC=%SRC:"=%"
if not exist "%SRC%\" (
  echo.
  echo [ERROR] Folder not found: %SRC%
  echo.
  pause
  exit /b 1
)

set "PYEXE="
where python >nul 2>nul
if not errorlevel 1 set "PYEXE=python"
if not defined PYEXE (
  where py >nul 2>nul
  if not errorlevel 1 set "PYEXE=py"
)
if not defined PYEXE (
  if exist "C:\Users\%USERNAME%\.workbuddy\binaries\python\versions\3.13.12\python.exe" (
    set "PYEXE=C:\Users\%USERNAME%\.workbuddy\binaries\python\versions\3.13.12\python.exe"
  )
)
if not defined PYEXE (
  echo.
  echo [ERROR] Python not found. Install it from https://www.python.org/downloads/
  echo         Remember to tick "Add python.exe to PATH" during setup.
  echo.
  pause
  exit /b 1
)

%PYEXE% -c "import PIL" >nul 2>nul
if errorlevel 1 (
  echo.
  echo Pillow not installed, installing now...
  %PYEXE% -m pip install pillow -i https://mirrors.aliyun.com/pypi/simple/ --disable-pip-version-check
  if errorlevel 1 (
    echo.
    echo [ERROR] Could not install Pillow. Check your network and try again.
    pause
    exit /b 1
  )
)

set "PYTHONIOENCODING=utf-8"
%PYEXE% "%~dp0compress_photos.py" "%SRC%" %2 %3 %4 %5 %6

echo.
pause
