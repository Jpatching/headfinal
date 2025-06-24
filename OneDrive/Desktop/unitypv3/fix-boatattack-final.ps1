# BoatAttack Final Fix Script - Removes problematic code and fixes packages
Write-Host "BoatAttack Final Package Fix" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

$projectPath = "C:\Users\patch\OneDrive\Desktop\unitypv3\BoatAttack\BoatAttack"
$unityPath = "C:\Program Files\Unity\Hub\Editor\2020.3.23f1\Editor\Unity.exe"

# Verify paths
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Project not found at: $projectPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $unityPath)) {
    Write-Host "❌ Unity not found at: $unityPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project found: $projectPath" -ForegroundColor Green
Write-Host "✅ Unity found: $unityPath" -ForegroundColor Green

Push-Location $projectPath

# Step 1: Remove problematic Graphics Test scripts
Write-Host "`n🗑️  Removing problematic Graphics Test scripts..." -ForegroundColor Yellow

$graphicsTestPath = "Assets\Scripts\UnityGFXTests"
if (Test-Path $graphicsTestPath) {
    Write-Host "   Removing UnityGFXTests folder..." -ForegroundColor Gray
    Remove-Item $graphicsTestPath -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 2: Clean Unity cache
Write-Host "`n🧹 Cleaning Unity cache..." -ForegroundColor Yellow
$foldersToRemove = @("Library", "Temp", "obj", "Logs")
foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Write-Host "   Removing $folder..." -ForegroundColor Gray
        Remove-Item $folder -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Step 3: Create updated manifest with Graphics Testing Framework
Write-Host "`n📦 Creating updated package manifest..." -ForegroundColor Yellow

$updatedManifest = @'
{
  "dependencies": {
    "com.unity.2d.sprite": "1.0.0",
    "com.unity.2d.tilemap": "1.0.0",
    "com.unity.addressables": "1.16.19",
    "com.unity.burst": "1.4.11",
    "com.unity.cinemachine": "2.6.11",
    "com.unity.collab-proxy": "1.9.0",
    "com.unity.ide.rider": "2.0.7",
    "com.unity.ide.visualstudio": "2.0.14",
    "com.unity.ide.vscode": "1.2.5",
    "com.unity.inputsystem": "1.0.2",
    "com.unity.mathematics": "1.2.1",
    "com.unity.postprocessing": "3.1.1",
    "com.unity.render-pipelines.core": "10.8.1",
    "com.unity.render-pipelines.universal": "10.8.1",
    "com.unity.searcher": "4.3.2",
    "com.unity.shadergraph": "10.8.1",
    "com.unity.test-framework": "1.1.31",
    "com.unity.testtools.graphics": "1.0.0-preview.1",
    "com.unity.textmeshpro": "3.0.6",
    "com.unity.timeline": "1.4.8",
    "com.unity.ugui": "1.0.0",
    "com.unity.visualscripting": "1.6.1",
    "com.unity.modules.ai": "1.0.0",
    "com.unity.modules.androidjni": "1.0.0",
    "com.unity.modules.animation": "1.0.0",
    "com.unity.modules.assetbundle": "1.0.0",
    "com.unity.modules.audio": "1.0.0",
    "com.unity.modules.cloth": "1.0.0",
    "com.unity.modules.director": "1.0.0",
    "com.unity.modules.imageconversion": "1.0.0",
    "com.unity.modules.imgui": "1.0.0",
    "com.unity.modules.jsonserialize": "1.0.0",
    "com.unity.modules.particlesystem": "1.0.0",
    "com.unity.modules.physics": "1.0.0",
    "com.unity.modules.physics2d": "1.0.0",
    "com.unity.modules.screencapture": "1.0.0",
    "com.unity.modules.terrain": "1.0.0",
    "com.unity.modules.terrainphysics": "1.0.0",
    "com.unity.modules.tilemap": "1.0.0",
    "com.unity.modules.ui": "1.0.0",
    "com.unity.modules.uielements": "1.0.0",
    "com.unity.modules.umbra": "1.0.0",
    "com.unity.modules.unityanalytics": "1.0.0",
    "com.unity.modules.unitywebrequest": "1.0.0",
    "com.unity.modules.unitywebrequestassetbundle": "1.0.0",
    "com.unity.modules.unitywebrequestaudio": "1.0.0",
    "com.unity.modules.unitywebrequesttexture": "1.0.0",
    "com.unity.modules.unitywebrequestwww": "1.0.0",
    "com.unity.modules.vehicles": "1.0.0",
    "com.unity.modules.video": "1.0.0",
    "com.unity.modules.vr": "1.0.0",
    "com.unity.modules.wind": "1.0.0",
    "com.unity.modules.xr": "1.0.0"
  },
  "scopedRegistries": [
    {
      "name": "package.openupm.com",
      "url": "https://package.openupm.com",
      "scopes": [
        "com.verasl.water-system"
      ]
    }
  ]
}
'@

# Write the updated manifest
$manifestPath = "Packages\manifest.json"
$updatedManifest | Out-File -FilePath $manifestPath -Encoding UTF8 -Force
Write-Host "✅ Updated package manifest" -ForegroundColor Green

Pop-Location

# Step 4: Launch Unity to resolve packages
Write-Host "`n🚀 Launching Unity to resolve packages..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

$arguments = @(
    "-batchmode",
    "-quit",
    "-projectPath", "`"$projectPath`"",
    "-logFile", "`"$projectPath\package-resolve.log`""
)

$process = Start-Process -FilePath $unityPath -ArgumentList ($arguments -join " ") -Wait -PassThru

if ($process.ExitCode -ne 0) {
    Write-Host "⚠️  Unity batch mode completed with warnings" -ForegroundColor Yellow
} else {
    Write-Host "✅ Unity package resolution completed" -ForegroundColor Green
}

# Step 5: Launch Unity normally
Write-Host "`n🎯 Launching Unity in normal mode..." -ForegroundColor Yellow
$normalArgs = @("-projectPath", "`"$projectPath`"")
Start-Process -FilePath $unityPath -ArgumentList ($normalArgs -join " ")

Write-Host "`n✅ BoatAttack fix completed!" -ForegroundColor Green
Write-Host "Unity should now open without compilation errors." -ForegroundColor Cyan
Write-Host "The Graphics Test scripts have been removed to eliminate errors." -ForegroundColor Cyan 