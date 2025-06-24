@echo off
echo Complete Unity BoatAttack Package Fix
echo ====================================

set UNITY_PATH="C:\Program Files\Unity\Hub\Editor\2020.3.23f1\Editor\Unity.exe"
set PROJECT_PATH="C:\Users\patch\OneDrive\Desktop\unitypv3\BoatAttack\BoatAttack"

echo Checking Unity and Project paths...
if not exist %UNITY_PATH% (
    echo ERROR: Unity not found at %UNITY_PATH%
    echo Please install Unity 2020.3.23f1 or update the path
    pause
    exit /b 1
)

if not exist %PROJECT_PATH% (
    echo ERROR: Project not found at %PROJECT_PATH%
    pause
    exit /b 1
)

echo ✓ Unity found: %UNITY_PATH%
echo ✓ Project found: %PROJECT_PATH%

echo.
echo Performing complete cleanup...
cd /d %PROJECT_PATH%

echo   Removing Library folder...
if exist "Library" rmdir /s /q "Library" >nul 2>&1

echo   Removing Temp folder...
if exist "Temp" rmdir /s /q "Temp" >nul 2>&1

echo   Removing Logs folder...
if exist "Logs" rmdir /s /q "Logs" >nul 2>&1

echo   Removing obj folder...
if exist "obj" rmdir /s /q "obj" >nul 2>&1

echo   Clearing Unity package cache...
if exist "%APPDATA%\Unity\Asset Store-5.x" (
    rmdir /s /q "%APPDATA%\Unity\Asset Store-5.x" >nul 2>&1
)

echo.
echo Updating package manifest...
copy "%~dp0working-manifest.json" "Packages\manifest.json" /y >nul 2>&1
echo ✓ Package manifest updated

echo.
echo Launching Unity in batch mode to resolve packages...
echo This may take several minutes...

%UNITY_PATH% -batchmode -quit -projectPath %PROJECT_PATH% -logFile "%PROJECT_PATH%\package-resolve.log"

echo.
echo Unity package resolution completed!

echo.
echo Launching Unity in normal mode...
start "Unity BoatAttack" %UNITY_PATH% -projectPath %PROJECT_PATH%

echo.
echo Unity fix completed!
echo Unity should now open with all packages properly resolved.
pause 