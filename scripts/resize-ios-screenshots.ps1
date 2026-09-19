<#
Resizes App Store screenshot PNGs from goldie's 1320x2868 (iphone-6.9) output
to an App Store Connect-accepted legacy size, using cover+crop (no stretch).

Usage:
  powershell -File scripts/resize-ios-screenshots.ps1 -InputDir "C:\path\to\ios-screenshots" -OutputDir "C:\path\to\out" -Width 1284 -Height 2778
#>
param(
    [Parameter(Mandatory = $true)][string]$InputDir,
    [Parameter(Mandatory = $true)][string]$OutputDir,
    [int]$Width = 1284,
    [int]$Height = 2778
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $InputDir)) { throw "InputDir not found: $InputDir" }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$files = Get-ChildItem -Path $InputDir -Recurse -Filter *.png
if ($files.Count -eq 0) { throw "No PNG files found under $InputDir" }

foreach ($file in $files) {
    $relative = $file.FullName.Substring((Resolve-Path $InputDir).Path.Length).TrimStart('\')
    $destPath = Join-Path $OutputDir $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $destPath) | Out-Null

    $src = [System.Drawing.Image]::FromFile($file.FullName)

    # cover: scale so the image fully covers the target box, then center-crop
    $scale = [Math]::Max($Width / $src.Width, $Height / $src.Height)
    [int]$scaledW = [Math]::Ceiling($src.Width * $scale)
    [int]$scaledH = [Math]::Ceiling($src.Height * $scale)

    $scaled = New-Object -TypeName System.Drawing.Bitmap -ArgumentList @([int]$scaledW, [int]$scaledH)
    $gScaled = [System.Drawing.Graphics]::FromImage($scaled)
    $gScaled.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gScaled.DrawImage($src, 0, 0, $scaledW, $scaledH)
    $gScaled.Dispose()
    $src.Dispose()

    [int]$cropX = [Math]::Floor(($scaledW - $Width) / 2)
    [int]$cropY = [Math]::Floor(($scaledH - $Height) / 2)

    # Format24bppRgb has no alpha channel - Apple rejects PNGs that carry one,
    # even if fully opaque.
    $final = New-Object -TypeName System.Drawing.Bitmap -ArgumentList @([int]$Width, [int]$Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $gFinal = [System.Drawing.Graphics]::FromImage($final)
    $gFinal.Clear([System.Drawing.Color]::Black)
    $srcRect = New-Object -TypeName System.Drawing.Rectangle -ArgumentList @([int]$cropX, [int]$cropY, [int]$Width, [int]$Height)
    $destRect = New-Object -TypeName System.Drawing.Rectangle -ArgumentList @(0, 0, [int]$Width, [int]$Height)
    $gFinal.DrawImage($scaled, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $gFinal.Dispose()
    $scaled.Dispose()

    $final.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $final.Dispose()

    Write-Host "Resized: $relative -> ${Width}x${Height}"
}

Write-Host "Done. Output in $OutputDir"
