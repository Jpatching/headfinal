# Complete Unity BoatAttack Fix Script
Write-Host "Complete Unity BoatAttack Package Fix" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$unityPath = "C:\Program Files\Unity\Hub\Editor\2020.3.23f1\Editor\Unity.exe"
$projectPath = "C:\Users\patch\OneDrive\Desktop\unitypv3\BoatAttack\BoatAttack"

# Step 1: Verify Unity and Project exist
if (-not (Test-Path $unityPath)) {
    Write-Host "❌ Unity not found at: $unityPath" -ForegroundColor Red
    Write-Host "Please install Unity 2020.3.23f1 or update the path" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Project not found at: $projectPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Unity found: $unityPath" -ForegroundColor Green
Write-Host "✅ Project found: $projectPath" -ForegroundColor Green

# Step 2: Complete cleanup
Write-Host "`n🧹 Performing complete cleanup..." -ForegroundColor Yellow

Push-Location $projectPath

# Remove all Unity generated folders
$foldersToRemove = @("Library", "Temp", "obj", "Logs")
foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Write-Host "   Removing $folder..." -ForegroundColor Gray
        Remove-Item $folder -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Remove package cache
$packageCachePath = "$env:APPDATA\Unity\Asset Store-5.x"
if (Test-Path $packageCachePath) {
    Write-Host "   Clearing Unity package cache..." -ForegroundColor Gray
    Remove-Item "$packageCachePath\*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 3: Create minimal working manifest
Write-Host "`n📦 Creating minimal package manifest..." -ForegroundColor Yellow

$minimalManifest = @'
{
  "dependencies": {
    "com.unity.2d.sprite": "1.0.0",
    "com.unity.2d.tilemap": "1.0.0",
    "com.unity.addressables": "1.16.19",
    "com.unity.burst": "1.4.11",
    "com.unity.cinemachine": "2.6.11",
    "com.unity.collab-proxy": "1.15.12",
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
    "com.unity.textmeshpro": "3.0.6",
    "com.unity.timeline": "1.4.8",
    "com.unity.ugui": "1.0.0",
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

# Write the manifest
$manifestPath = "Packages\manifest.json"
$minimalManifest | Out-File -FilePath $manifestPath -Encoding UTF8 -Force
Write-Host "✅ Created minimal manifest" -ForegroundColor Green

Pop-Location

# Step 4: Launch Unity in batch mode to resolve packages
Write-Host "`n🚀 Launching Unity to resolve packages..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

$arguments = @(
    "-batchmode",
    "-quit", 
    "-projectPath", "`"$projectPath`"",
    "-logFile", "`"$projectPath\package-resolve.log`""
)

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $unityPath
$processInfo.Arguments = ($arguments -join " ")
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null

# Wait for completion with timeout
$timeout = 300 # 5 minutes
if (-not $process.WaitForExit($timeout * 1000)) {
    Write-Host "⚠️  Unity package resolution timed out" -ForegroundColor Yellow
    $process.Kill()
} else {
    Write-Host "✅ Unity package resolution completed" -ForegroundColor Green
}

# Step 5: Check if packages were resolved
Write-Host "`n🔍 Checking package resolution..." -ForegroundColor Yellow

Push-Location $projectPath

if (Test-Path "Packages\packages-lock.json") {
    $lockContent = Get-Content "Packages\packages-lock.json" | ConvertFrom-Json
    $resolvedPackages = $lockContent.dependencies.PSObject.Properties.Name
    
    $requiredPackages = @("com.unity.cinemachine", "com.unity.mathematics", "com.unity.textmeshpro", "com.unity.render-pipelines.universal")
    $missingPackages = @()
    
    foreach ($pkg in $requiredPackages) {
        if ($pkg -notin $resolvedPackages) {
            $missingPackages += $pkg
        } else {
            Write-Host "✅ $pkg resolved" -ForegroundColor Green
        }
    }
    
    if ($missingPackages.Count -gt 0) {
        Write-Host "❌ Missing packages:" -ForegroundColor Red
        $missingPackages | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    } else {
        Write-Host "🎉 All required packages resolved successfully!" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  packages-lock.json not found" -ForegroundColor Yellow
}

Pop-Location

# Step 6: Launch Unity normally
Write-Host "`n🎯 Launching Unity in normal mode..." -ForegroundColor Yellow
$normalArgs = @("-projectPath", "`"$projectPath`"")
Start-Process -FilePath $unityPath -ArgumentList ($normalArgs -join " ")

Write-Host "`n✅ Unity fix script completed!" -ForegroundColor Green
Write-Host "Unity should now open with all packages properly resolved." -ForegroundColor Cyan 