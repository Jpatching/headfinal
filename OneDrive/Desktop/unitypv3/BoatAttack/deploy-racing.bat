@echo off
echo ========================================
echo  BoatAttack Racing - Vercel Deployment
echo ========================================

echo.
echo Step 1: Checking if WebGL build exists...
if not exist "BoatAttack\WebGL-Build\index.html" (
    echo ERROR: WebGL build not found!
    echo Please build the project first using Unity:
    echo 1. Open Unity with BoatAttack project
    echo 2. Go to BoatAttack menu ^> Build WebGL for Vercel
    echo 3. Wait for build to complete
    echo 4. Run this script again
    pause
    exit /b 1
)

echo ✓ WebGL build found!

echo.
echo Step 2: Checking Vercel CLI...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo Installing Vercel CLI...
    npm install -g vercel
    if errorlevel 1 (
        echo ERROR: Failed to install Vercel CLI
        echo Please install Node.js first: https://nodejs.org/
        pause
        exit /b 1
    )
)

echo ✓ Vercel CLI ready!

echo.
echo Step 3: Deploying to Vercel...
echo This will deploy your BoatAttack Racing game to the web!
echo.

vercel --prod
if errorlevel 1 (
    echo ERROR: Deployment failed!
    echo Please check your Vercel account and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  🎉 DEPLOYMENT SUCCESSFUL! 🎉
echo ========================================
echo.
echo Your BoatAttack Racing game is now live!
echo You can share the URL with others to play multiplayer races.
echo.
echo Controls:
echo - WASD or Arrow Keys: Steer boat
echo - F9: Quick restart race
echo - F10: Return to main menu
echo.
pause 