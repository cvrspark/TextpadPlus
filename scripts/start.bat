@echo off
setlocal enabledelayedexpansion

for %%I in ("%~dp0..") do set "ROOT_DIR=%%~fI"

set "BUILD_DIR=%ROOT_DIR%\core\build"
set "BIN_DIR=%ROOT_DIR%\app\src-tauri\binaries"
set "TARGET_BINARY=%BUILD_DIR%\textpad_core.exe"
set "SIDECAR_NAME=textpad_core"

set "ARCH=x86_64"
if "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "ARCH=aarch64"
set "FINAL_BINARY_NAME=%SIDECAR_NAME%-%ARCH%-pc-windows-msvc.exe"

if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"
cd core/

cmake -B build -G Ninja >nul

cd ../
cmake --build "%BUILD_DIR%" --config Release >nul 2>&1


copy /Y "%TARGET_BINARY%" "%BIN_DIR%\%FINAL_BINARY_NAME%" >nul

cd app/
bun run build && bun run tauri build

endlocal