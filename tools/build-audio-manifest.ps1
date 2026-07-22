param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$coursePath = Join-Path $Root 'course-a1.js'
$jsonPath = Join-Path $Root 'audio-manifest.json'
$jsPath = Join-Path $Root 'audio-manifest.js'

if (-not (Test-Path $coursePath)) {
  throw "course-a1.js was not found: $coursePath"
}

$source = Get-Content $coursePath -Raw -Encoding UTF8
$source = $source -replace '^\s*window\.CAO_A1_DATA\s*=\s*', ''
$source = $source -replace ';\s*$', ''
$course = $source | ConvertFrom-Json

$mergedTexts = [ordered]@{}
if (Test-Path $jsonPath) {
  try {
    $oldManifest = Get-Content $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($oldManifest.texts) {
      $oldManifest.texts.PSObject.Properties | ForEach-Object {
        $mergedTexts[$_.Name] = [string]$_.Value
      }
    }
  } catch {
    Write-Warning 'The old audio-manifest.json could not be read. A new manifest will be created.'
  }
}

function Add-TextIfMissing([string]$Text, [string]$Key) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return }
  if (-not $mergedTexts.Contains($Text)) {
    $mergedTexts[$Text] = $Key
  }
}

foreach ($unit in $course.units) {
  if ($unit.words) {
    foreach ($word in $unit.words) {
      $id = [string]$word[0]
      $text = [string]$word[1]
      Add-TextIfMissing $text ("a1w_" + $id)
    }
  }

  if ($unit.phrases) {
    $phraseIndex = 0
    foreach ($phrase in $unit.phrases) {
      $phraseIndex++
      $text = [string]$phrase[0]
      Add-TextIfMissing $text ("a1p_{0}_{1}" -f $unit.id, $phraseIndex)
    }
  }
}

foreach ($question in $course.placement.questions) {
  if ($question.audio) {
    Add-TextIfMissing ([string]$question.audio) ("a1t_" + [string]$question.id)
  }
}

$manifest = [ordered]@{
  version = 4
  language = 'sr-Latn-RS'
  voices = [ordered]@{
    gabrijela = 'hr-HR-GabrijelaNeural'
    srecko = 'hr-HR-SreckoNeural'
  }
  texts = $mergedTexts
}

$manifest | ConvertTo-Json -Depth 12 | Set-Content $jsonPath -Encoding UTF8
$jsTexts = $mergedTexts | ConvertTo-Json -Compress -Depth 12
"window.CAO_AUDIO_MANIFEST = $jsTexts;" | Set-Content $jsPath -Encoding UTF8

Write-Host ("Full manifest is ready: {0} unique Serbian recordings." -f $mergedTexts.Count) -ForegroundColor Green
