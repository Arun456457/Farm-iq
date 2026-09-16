Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\DELL\.gemini\antigravity-ide\brain\f3ce9d63-3af9-4ac2-9ea4-bfe40da3d644\farmiq_app_logo_1789536874389.jpg"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source file not found: $sourcePath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($sourcePath)
Write-Output "Source image loaded: $($srcImg.Width) x $($srcImg.Height)"

function Save-Resized-Png($image, $targetWidth, $targetHeight, $destPath) {
    $destBitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $rect = New-Object System.Drawing.Rectangle(0, 0, $targetWidth, $targetHeight)
    $graphics.DrawImage($image, $rect)
    $graphics.Dispose()

    $destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Output "Saved PNG: $destPath ($targetWidth x $targetHeight)"
}

# 1. Full-res PNG
Save-Resized-Png $srcImg 1024 1024 "public\farmiq-logo.png"

# 2. PWA 512x512
Save-Resized-Png $srcImg 512 512 "public\pwa-512x512.png"

# 3. PWA 192x192
Save-Resized-Png $srcImg 192 192 "public\pwa-192x192.png"

# 4. Apple Touch Icon 180x180
Save-Resized-Png $srcImg 180 180 "public\apple-touch-icon.png"

# 5. Favicons
Save-Resized-Png $srcImg 32 32 "public\favicon-32x32.png"
Save-Resized-Png $srcImg 16 16 "public\favicon-16x16.png"

# 6. Favicon.ico
$icoBitmap = New-Object System.Drawing.Bitmap(64, 64)
$icoG = [System.Drawing.Graphics]::FromImage($icoBitmap)
$icoG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$icoG.DrawImage($srcImg, 0, 0, 64, 64)
$icoG.Dispose()
$icoHandle = $icoBitmap.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($icoHandle)
$stream = New-Object System.IO.FileStream("public\favicon.ico", [System.IO.FileMode]::Create)
$ico.Save($stream)
$stream.Close()
$icoBitmap.Dispose()
Write-Output "Saved ICO: public\favicon.ico"

$srcImg.Dispose()
Write-Output "All icons successfully generated!"
