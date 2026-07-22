param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [string]$GeneratorName = 'cao-audio-generator.exe'
)

$ErrorActionPreference = 'Stop'
$generator = Join-Path $Root $GeneratorName
$jsonPath = Join-Path $Root 'audio-manifest.json'
$jsPath = Join-Path $Root 'audio-manifest.js'
$builder = Join-Path $PSScriptRoot 'build-audio-manifest.ps1'

if (-not (Test-Path $generator)) {
  throw "Audio generator was not found: $generator`nCopy cao-audio-generator.exe from the previous version into this folder."
}

& $builder -Root $Root
$fullJson = Get-Content $jsonPath -Raw -Encoding UTF8
$fullManifest = $fullJson | ConvertFrom-Json
$allProperties = @($fullManifest.texts.PSObject.Properties)
$missingTexts = [ordered]@{}

foreach ($property in $allProperties) {
  $text = [string]$property.Name
  $key = [string]$property.Value
  $femalePath = Join-Path $Root ("assets\audio\gabrijela\{0}.mp3" -f $key)
  $malePath = Join-Path $Root ("assets\audio\srecko\{0}.mp3" -f $key)

  $femaleOk = (Test-Path $femalePath) -and ((Get-Item $femalePath).Length -gt 256)
  $maleOk = (Test-Path $malePath) -and ((Get-Item $malePath).Length -gt 256)
  if (-not ($femaleOk -and $maleOk)) {
    $missingTexts[$text] = $key
  }
}

if ($missingTexts.Count -eq 0) {
  Write-Host 'All recordings already exist. Nothing will be regenerated.' -ForegroundColor Green
  exit 0
}

Write-Host ("Existing recordings are preserved. Missing entries: {0} of {1}." -f $missingTexts.Count, $allProperties.Count) -ForegroundColor Cyan

$tempManifest = [ordered]@{
  version = 4
  language = [string]$fullManifest.language
  voices = [ordered]@{
    gabrijela = [string]$fullManifest.voices.gabrijela
    srecko = [string]$fullManifest.voices.srecko
  }
  texts = $missingTexts
}

$backupJsonPath = Join-Path $Root 'audio-manifest.full.backup.json'
$backupJsPath = Join-Path $Root 'audio-manifest.full.backup.js'
Copy-Item $jsonPath $backupJsonPath -Force
if (Test-Path $jsPath) { Copy-Item $jsPath $backupJsPath -Force }

try {
  $tempManifest | ConvertTo-Json -Depth 12 | Set-Content $jsonPath -Encoding UTF8
  $tempJs = $missingTexts | ConvertTo-Json -Compress -Depth 12
  "window.CAO_AUDIO_MANIFEST = $tempJs;" | Set-Content $jsPath -Encoding UTF8

  Push-Location $Root
  try {
    & $generator
    if ($LASTEXITCODE -ne 0) {
      throw "The audio generator finished with code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }
} finally {
  $fullJson | Set-Content $jsonPath -Encoding UTF8
  $fullJs = $fullManifest.texts | ConvertTo-Json -Compress -Depth 12
  "window.CAO_AUDIO_MANIFEST = $fullJs;" | Set-Content $jsPath -Encoding UTF8
  Remove-Item $backupJsonPath -Force -ErrorAction SilentlyContinue
  Remove-Item $backupJsPath -Force -ErrorAction SilentlyContinue
}

$stillMissing = 0
foreach ($property in $allProperties) {
  $key = [string]$property.Value
  $femalePath = Join-Path $Root ("assets\audio\gabrijela\{0}.mp3" -f $key)
  $malePath = Join-Path $Root ("assets\audio\srecko\{0}.mp3" -f $key)
  if (-not ((Test-Path $femalePath) -and (Test-Path $malePath))) { $stillMissing++ }
}

if ($stillMissing -eq 0) {
  Write-Host 'Done. Both voice packs now cover the complete A1 course.' -ForegroundColor Green
} else {
  Write-Warning "$stillMissing entries still do not have both voice files. Run this script again; completed files will be skipped."
}
