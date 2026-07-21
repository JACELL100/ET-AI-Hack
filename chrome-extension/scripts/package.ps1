$ErrorActionPreference = "Stop"

$extensionRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$manifest = Get-Content -LiteralPath (Join-Path $extensionRoot "manifest.json") -Raw | ConvertFrom-Json
$outputDirectory = Join-Path $extensionRoot "dist"
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archive = Join-Path $outputDirectory ("RAKSHA-AI-Companion-{0}-{1}.zip" -f $manifest.version, $stamp)
$packageFiles = @(
  "manifest.json", "background.js", "popup.html", "popup.js", "popup.css",
  "options.html", "options.js", "options.css", "content.js", "icons"
) | ForEach-Object { Join-Path $extensionRoot $_ }

Compress-Archive -Path $packageFiles -DestinationPath $archive -CompressionLevel Optimal
Write-Output "Created $archive"
