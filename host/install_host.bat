@echo off
set "HOST_NAME=com.antigravity.bridge"
set "MANIFEST_PATH=%~dp0com.antigravity.bridge.json"

echo Registering %HOST_NAME%...
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\%HOST_NAME%" /VE /T REG_SZ /D "%MANIFEST_PATH%" /F

if %errorlevel% equ 0 (
    echo.
    echo Installation successful!
) else (
    echo.
    echo Installation failed. Please run as Administrator if necessary.
)
pause
