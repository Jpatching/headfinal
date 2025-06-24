@echo off
echo Forcing Unity to refresh and reimport all assets...
echo.

REM Go to the Unity project directory
cd "BoatAttack\BoatAttack"

REM Delete Assembly files to force recompilation  
echo Deleting Assembly cache files...
if exist "Library\ScriptAssemblies" (
    rmdir /s /q "Library\ScriptAssemblies"
    echo ✓ Deleted ScriptAssemblies folder
)

if exist "Library\StateCache" (
    rmdir /s /q "Library\StateCache" 
    echo ✓ Deleted StateCache folder
)

if exist "Library\PackageCache" (
    rmdir /s /q "Library\PackageCache"
    echo ✓ Deleted PackageCache folder  
)

echo.
echo Cache cleared! Unity will now reimport everything.
echo.

REM Return to original directory
cd ..\..

echo Launching Unity...
start "Unity BoatAttack" "C:\Program Files\Unity\Hub\Editor\2020.3.23f1\Editor\Unity.exe" -projectPath "%cd%\BoatAttack\BoatAttack"

echo Unity is starting...
pause 