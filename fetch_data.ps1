# fetch_data.ps1 - Fetch data from Google Sheets and compress images
Add-Type -AssemblyName System.Drawing

$configs = @(
    @{
        lang = "hr"
        api_url = "https://script.google.com/macros/s/AKfycbwMEPP0lEtFFxZQ2IX1ol6A55hDg1c7ZePRlxDXcaS_L29NVW1plyZByNhIudHF59Tt/exec"
        blog_api_url = "https://script.google.com/macros/s/AKfycbzOuswFBVU_XC75E13zxEzF2rVQXahC0khrVt6ewjgnnUWQvx11fBwn1sTyj8Ria2x4/exec"
        output_file_json = "api_response.json"
        output_file_js = "api_response.js"
        token = $env:HR_DATA_TOKEN
    },
    @{
        lang = "en"
        api_url = "https://script.google.com/macros/s/AKfycbzMp540q3I00e_QDtTnHnDkKeDsDI26KTyr2gFnzvdGm6-0or-SWrDm_9e2LTswvfxfQQ/exec"
        blog_api_url = "https://script.google.com/macros/s/AKfycbw0HQvXjQaOKWjOou9t5nWRt8tRN2dqY6jXCfxTuUDYOuFXUUrH-LaiQDOiQVh9_hC5/exec"
        output_file_json = "api_response_en.json"
        output_file_js = "api_response_en.js"
        token = $env:EN_DATA_TOKEN
    }
)

$SIGNING_SECRET = $env:SIGNING_SECRET

# --- Security: Generate SHA-256 signature ---
# payload = token + "|" + ts + "|" + signingSecret  ->  SHA-256  ->  Base64
function Get-ApiSignature($token, $ts, $secret) {
    $payload = "$token|$ts|$secret"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha256.ComputeHash($bytes)
    $sha256.Dispose()
    return [Convert]::ToBase64String($hashBytes)
}

$image_dir = "images/tools"
$blog_dir = "images/blogs"

if (!(Test-Path $image_dir)) {
    New-Item -ItemType Directory -Path $image_dir -Force | Out-Null
}
if (!(Test-Path $blog_dir)) {
    New-Item -ItemType Directory -Path $blog_dir -Force | Out-Null
}

function Save-And-Compress-Image($url, $id, $target_dir) {
    if (!$url -or $url -notlike "http*") { return $url }
    
    $extension = "jpg"
    $filename = "$id.$extension"
    $local_path = "$target_dir/$filename"
    $relative_path = "$target_dir/$filename"
    
    try {
        if (!(Test-Path $local_path)) {
            Write-Host "Processing image: $url"
            $temp_file = New-TemporaryFile
            Invoke-WebRequest -Uri $url -OutFile $temp_file.FullName -TimeoutSec 10
            
            # Open image for processing
            $img = [System.Drawing.Image]::FromFile($temp_file.FullName)
            
            # Calculate new dimensions (max width 400px)
            $maxWidth = 400
            if ($img.Width -gt $maxWidth) {
                $ratio = $maxWidth / $img.Width
                $newWidth = $maxWidth
                $newHeight = [int]($img.Height * $ratio)
            } else {
                $newWidth = $img.Width
                $newHeight = $img.Height
            }
            
            $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
            $graph = [System.Drawing.Graphics]::FromImage($newImg)
            $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
            
            # Set JPEG compression quality (85%)
            $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 85)
            $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
            
            $newImg.Save($local_path, $jpegCodec, $encoderParams)
            
            $graph.Dispose()
            $newImg.Dispose()
            $img.Dispose()
            $temp_file | Remove-Item
        }
        return $relative_path
    } catch {
        Write-Warning "Failed to process image ${url}: $_"
        return $url
    }
}

# Handle both flat and nested JSON forms with multiple language keys
function Get-Val($prop) {
    if ($null -eq $prop) { return "" }
    if ($prop -is [string] -or $prop -is [int] -or $prop -is [double] -or $prop -is [array]) { return $prop }
    
    # Check for various language keys (Case-insensitive)
    $keys_to_check = @("HR", "hr", "ENGL", "engl", "EN", "en")
    foreach ($key in $keys_to_check) {
        if ($prop.PSObject.Properties[$key]) {
            return $prop.$key
        }
    }
    
    # If no direct match, return empty string
    return ""
}

# Function to get header value even if column name varies slightly
function Get-Header-Val($obj, $primary, $secondary) {
    $val = Get-Val $obj.$primary
    if ($val -eq "" -and $secondary) {
        $val = Get-Val $obj.$secondary
    }
    return $val
}

foreach ($cfg in $configs) {
    Write-Host "============= Processing Language: $($cfg.lang) ============="
    $api_url = $cfg.api_url
    $blog_api_url = $cfg.blog_api_url
    $token = $cfg.token

    # Build signed URLs for both API calls
    $ts_tools = [System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()
    $sig_tools = Get-ApiSignature $token $ts_tools $SIGNING_SECRET
    $encoded_token = [uri]::EscapeDataString($token)
    $encoded_sig_tools = [uri]::EscapeDataString($sig_tools)
    $signed_tools_url = "${api_url}?token=${encoded_token}&ts=${ts_tools}&sig=${encoded_sig_tools}"

    $ts_blog = [System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()
    $sig_blog = Get-ApiSignature $token $ts_blog $SIGNING_SECRET
    $encoded_sig_blog = [uri]::EscapeDataString($sig_blog)
    $signed_blog_url = "${blog_api_url}?token=${encoded_token}&ts=${ts_blog}&sig=${encoded_sig_blog}"

    $response = $null
    Write-Host "Fetching tools from: $api_url (signed)"
    try {
        $response = Invoke-RestMethod -Uri $signed_tools_url -Method Get
    } catch {
        Write-Error "Failed to fetch tools from API for $($cfg.lang): $_"
    }

    $blog_response = $null
    Write-Host "Fetching blogs from: $blog_api_url (signed)"
    try {
        $blog_response = Invoke-RestMethod -Uri $signed_blog_url -Method Get
    } catch {
        Write-Error "Failed to fetch blogs from API for $($cfg.lang): $_"
    }

    $all_tools = @()
    $trending_tools = @()
    if ($response -and $response.tools) {
        Write-Host "Processing $($response.tools.Count) tools for $($cfg.lang)..."
        $index = 0
        foreach ($tool in $response.tools) {
            if (!$tool.name) { continue }
            
            # Handle tags - check all common field name variants
            $raw_tags = $null
            foreach ($tagField in @("tags", "Tags", "Tagovi", "Tag", "TAGS")) {
                $val = Get-Val $tool.$tagField
                if ($val -ne $null -and $val -ne "") {
                    $raw_tags = $val
                    break
                }
            }

            if ($raw_tags -is [string] -and $raw_tags -ne "") {
                # Split comma-separated tags and trim whitespace
                $tool | Add-Member -NotePropertyName "tags" -NotePropertyValue ($raw_tags.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }) -Force
            } elseif ($raw_tags -is [array] -and $raw_tags.Count -gt 0) {
                $tool | Add-Member -NotePropertyName "tags" -NotePropertyValue ($raw_tags | ForEach-Object { "$_".Trim() } | Where-Object { $_ -ne "" }) -Force
            } else {
                $tool | Add-Member -NotePropertyName "tags" -NotePropertyValue @() -Force
            }

            $tool.logo = Save-And-Compress-Image $tool.logo "tool_$($cfg.lang)_$index" $image_dir
            $all_tools += $tool
            if ($tool.trending -eq $true) {
                $trending_tools += $tool
            }
            $index++
        }
    } else {
        Write-Warning "No tools found in API response for $($cfg.lang). Skipping update for this language to prevent data loss."
        continue
    }

    $all_blogs = @()
    if ($blog_response) {
        # Handle both flat array and wrapped { data: [...] } responses
        $blog_items = $null
        if ($blog_response -is [array]) {
            $blog_items = $blog_response
            Write-Host "Blog response is a flat array with $($blog_items.Count) items for $($cfg.lang)"
        } elseif ($blog_response.PSObject.Properties["data"] -and $blog_response.data -is [array]) {
            $blog_items = $blog_response.data
            Write-Host "Blog response is a wrapped object, using .data array with $($blog_items.Count) items for $($cfg.lang)"
        } elseif ($blog_response.PSObject.Properties["blogs"] -and $blog_response.blogs -is [array]) {
            $blog_items = $blog_response.blogs
            Write-Host "Blog response is a wrapped object, using .blogs array with $($blog_items.Count) items for $($cfg.lang)"
        } else {
            Write-Warning "Blog response for $($cfg.lang) is not a recognized format. Type: $($blog_response.GetType().Name). Skipping blogs."
            $blog_items = @()
        }

        Write-Host "Processing $($blog_items.Count) blogs for $($cfg.lang)..."
        $blog_index = 0
        foreach ($raw_blog in $blog_items) {
            
            if (!$raw_blog) { continue }
            
            $img_url = Get-Val $raw_blog.Photo
            
            $img_url = Get-Val $raw_blog.Photo
            
            $compressed_img = Save-And-Compress-Image $img_url "blog_$($cfg.lang)_$blog_index" $blog_dir
            
            $blog = @{
                Language = $cfg.lang
                Slug = Get-Header-Val $raw_blog "Slug" "Timestamp"
                Timestamp = Get-Val $raw_blog.Timestamp
                Heading = Get-Val $raw_blog.Heading
                Minutes = Get-Val $raw_blog.Minutes
                MainText = Get-Header-Val $raw_blog "Main Text" "MainText"
                Photo = $compressed_img
                Text1 = Get-Header-Val $raw_blog "Text 1" "Text1"
                Subheading = Get-Val $raw_blog.Subheading
                Text2 = Get-Header-Val $raw_blog "Text 2" "Text2"
                HighlitedText = Get-Header-Val $raw_blog "Highlited text" "HighlitedText"
                Subheading2 = Get-Header-Val $raw_blog "Subheading 2" "Subheading2"
                Text3 = Get-Header-Val $raw_blog "Text 3" "Text3"
                ButtonLink = Get-Header-Val $raw_blog "Button Link" "ButtonLink"
            }
            $all_blogs += $blog
            $blog_index++
        }
    }
    
    $final_data = @{
        tools = $all_tools
        trending = $trending_tools
        blogs = $all_blogs
    }

    $json = $final_data | ConvertTo-Json -Depth 10 -Compress
    $json | Out-File -FilePath $cfg.output_file_json -Encoding utf8

    $js_content = "window.WEBALATI_DATA = $json;"
    $js_content | Out-File -FilePath $cfg.output_file_js -Encoding utf8

    Write-Host "Success! Data saved to $($cfg.output_file_json) and $($cfg.output_file_js)"
}
