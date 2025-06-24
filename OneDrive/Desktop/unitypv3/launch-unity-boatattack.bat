@echo off
echo Starting Unity BoatAttack Project...
echo.

REM Set the Unity path and project path
set UNITY_PATH="C:\Program Files\Unity\Hub\Editor\2020.3.23f1\Editor\Unity.exe"
set PROJECT_PATH="C:\Users\patch\OneDrive\Desktop\unitypv3\BoatAttack\BoatAttack"

REM Check if Unity exists
if not exist %UNITY_PATH% (
    echo Unity not found at %UNITY_PATH%
    echo Please verify Unity is installed or update the path
    pause
    exit /b 1
)

REM Check if project exists
if not exist %PROJECT_PATH% (
    echo Project not found at %PROJECT_PATH%
    echo Please verify the project path
    pause
    exit /b 1
)

echo Unity Path: %UNITY_PATH%
echo Project Path: %PROJECT_PATH%
echo.
echo Launching Unity...

REM Launch Unity with the project
start "Unity BoatAttack" /wait %UNITY_PATH% -projectPath %PROJECT_PATH%

echo Unity closed.
pause 