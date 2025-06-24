@echo off
echo ========================================
echo BoatAttack Multiplayer Deployment
echo ========================================
echo.

REM Check if WebGL-Build folder exists
if not exist "WebGL-Build" (
    echo ERROR: WebGL-Build folder not found!
    echo Please build the project for WebGL first.
    echo.
    echo Steps:
    echo 1. Open Unity project
    echo 2. Go to File ^> Build Settings
    echo 3. Select WebGL platform
    echo 4. Click Build and choose WebGL-Build folder
    echo.
    pause
    exit /b 1
)

echo WebGL build found! ✓
echo.

REM Check if Vercel is installed
where vercel >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing Vercel CLI...
    npm install -g vercel
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install Vercel CLI
        echo Please run: npm install -g vercel
        pause
        exit /b 1
    )
)

echo Vercel CLI found! ✓
echo.

REM Deploy to Vercel
echo Deploying to Vercel...
echo.
vercel deploy --prod

if %ERRORLEVEL% eq 0 (
    echo.
    echo ========================================
    echo Deployment successful! 🎉
    echo ========================================
    echo.
    echo Your multiplayer boat racing game is now live!
    echo Check the URL provided above to play online.
    echo.
) else (
    echo.
    echo ========================================
    echo Deployment failed! ❌
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo Common issues:
    echo - Network connection
    echo - Vercel account not linked
    echo - Build files missing
    echo.
)

pause 