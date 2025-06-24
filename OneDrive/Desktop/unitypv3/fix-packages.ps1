# Fix Missing Packages Script
Write-Host "Fixing Unity Package Dependencies..." -ForegroundColor Green

$projectPath = ".\BoatAttack\BoatAttack"
$packagesPath = "$projectPath\Packages"
$manifestPath = "$packagesPath\manifest.json"

# Navigate to project directory
Push-Location $projectPath

try {
    # Backup existing manifest
    if (Test-Path $manifestPath) {
        Copy-Item $manifestPath "$manifestPath.backup" -Force
        Write-Host "✓ Backed up existing manifest.json" -ForegroundColor Yellow
    }

    # Copy our new manifest
    Copy-Item "..\..\install-required-packages.json" $manifestPath -Force
    Write-Host "✓ Updated manifest.json with required packages" -ForegroundColor Green

    Write-Host "`nPackages that will be installed:" -ForegroundColor Cyan
    Write-Host "• Cinemachine (camera system)" -ForegroundColor White
    Write-Host "• Unity Mathematics (math operations)" -ForegroundColor White
    Write-Host "• TextMeshPro (UI text)" -ForegroundColor White
    Write-Host "• Universal Render Pipeline (rendering)" -ForegroundColor White
    Write-Host "• Gameplay Ingredients (utility framework)" -ForegroundColor White
    Write-Host "• Input System (modern input handling)" -ForegroundColor White
    Write-Host "• Addressables (asset management)" -ForegroundColor White
    Write-Host "• And many more supporting packages..." -ForegroundColor White

    Write-Host "`n✅ Package manifest updated successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Close Unity if it's open" -ForegroundColor White
    Write-Host "2. Reopen Unity - it will automatically install the missing packages" -ForegroundColor White
    Write-Host "3. Wait for the import process to complete" -ForegroundColor White
    Write-Host "4. All compilation errors should be resolved" -ForegroundColor White

} 
catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
} 
finally {
    Pop-Location
}

Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 