param(
  [string]$SourcePath = "C:\Users\ymehm\secrets\data.json",
  [string]$EnvFile = ".env.local"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Load-EnvFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  $lines = Get-Content -LiteralPath $Path
  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $eq = $trimmed.IndexOf("=")
    if ($eq -lt 1) { continue }
    $key = $trimmed.Substring(0, $eq).Trim()
    $value = $trimmed.Substring($eq + 1).Trim().Trim("'`"")
    if (-not [string]::IsNullOrWhiteSpace($key) -and -not (Test-Path "Env:$key")) {
      Set-Item -Path "Env:$key" -Value $value
    }
  }
}

Load-EnvFile -Path $EnvFile

if (-not (Test-Path -LiteralPath $SourcePath)) {
  throw "Dataset file not found: $SourcePath"
}

$raw = Get-Content -LiteralPath $SourcePath -Raw
$dataset = $raw | ConvertFrom-Json

$seedDir = Join-Path $PSScriptRoot "local-seed"
$seedPath = Join-Path $seedDir "golday_data.seed.json"
New-Item -ItemType Directory -Path $seedDir -Force | Out-Null

$payloadObject = @(
  @{
    id = 1
    data = $dataset
    updated_at = (Get-Date).ToString("o")
  }
)

$payloadJson = $payloadObject | ConvertTo-Json -Depth 100
Set-Content -LiteralPath $seedPath -Value $payloadJson -Encoding UTF8

$supabaseUrl = $env:SUPABASE_URL
$serviceKey = $env:SUPABASE_SERVICE_KEY

if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($serviceKey)) {
  throw "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Set them in .env.local or session env vars."
}

$supabaseUrl = $supabaseUrl.TrimEnd("/")
$endpoint = "$supabaseUrl/rest/v1/golday_data?on_conflict=id"
$headers = @{
  "apikey" = $serviceKey
  "Authorization" = "Bearer $serviceKey"
  "Prefer" = "resolution=merge-duplicates,return=representation"
  "Content-Type" = "application/json"
}

$response = Invoke-WebRequest -Uri $endpoint -Method POST -Headers $headers -Body $payloadJson -UseBasicParsing

if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
  throw "Supabase import failed with HTTP $($response.StatusCode)"
}

$importedRows = 0
try {
  $parsed = $response.Content | ConvertFrom-Json
  if ($parsed -is [System.Array]) {
    $importedRows = $parsed.Count
  }
} catch {
  $importedRows = 0
}

Write-Host "Supabase import successful."
Write-Host "Source file: $SourcePath"
Write-Host "Seed payload file (gitignored): $seedPath"
Write-Host "Imported rows: $importedRows"
