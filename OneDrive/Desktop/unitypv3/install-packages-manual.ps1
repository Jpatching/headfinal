# Manual Package Installation Script
Write-Host "Manual Unity Package Installation" -ForegroundColor Green

$unityPath = "C:\Program Files\Unity\Hub\Editor\2020.3.23f1\Editor\Unity.exe"
$projectPath = "C:\Users\patch\OneDrive\Desktop\unitypv3\BoatAttack\BoatAttack"

Write-Host "Installing packages manually via Unity command line..." -ForegroundColor Yellow

# Install each package individually
$packages = @(
    "com.unity.cinemachine@2.6.11",
    "com.unity.mathematics@1.2.1", 
    "com.unity.textmeshpro@3.0.6",
    "com.unity.render-pipelines.universal@10.8.1",
    "com.unity.inputsystem@1.0.2"
)

foreach ($package in $packages) {
    Write-Host "Installing $package..." -ForegroundColor Cyan
    
    $arguments = @(
        "-batchmode",
        "-quit", 
        "-projectPath", "`"$projectPath`"",
        "-executeMethod", "UnityEditor.PackageManager.Client.Add",
        "-packageName", $package
    )
    
    Start-Process -FilePath $unityPath -ArgumentList $arguments -Wait -NoNewWindow
    Write-Host "✓ $package installed" -ForegroundColor Green
}

Write-Host "`nAll packages installed manually!" -ForegroundColor Green
Write-Host "Opening Unity normally..." -ForegroundColor Cyan

# Open Unity normally
Start-Process -FilePath $unityPath -ArgumentList @("-projectPath", "`"$projectPath`"")

Write-Host "Done! Unity should now have all packages." -ForegroundColor Green 