Add-Type -AssemblyName System.Drawing
$source = ".\images\1000028266.jpg"
$dest = ".\images\favicon-rounded.png"

$img = [System.Drawing.Image]::FromFile($source)
$size = [Math]::Min($img.Width, $img.Height)

$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# Draw circle clipping path
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $size, $size)
$g.SetClip($path)

# Calculate source rectangle to crop to center square
$x = ($img.Width - $size) / 2
$y = ($img.Height - $size) / 2
$srcRect = New-Object System.Drawing.Rectangle($x, $y, $size, $size)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)

$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Host "Success"
