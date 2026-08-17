# ============================================================
#  PANEL ARENA13 - APLICAR MIGRACIONES REMOTAS (vía API)
#  Aplica los .sql de supabase/migrations-arena al proyecto
#  PabloRecursos usando el token de la Management API.
#  NO requiere password de la base de datos.
#
#  Uso:
#    powershell -ExecutionPolicy Bypass -File supabase\aplicar-remoto.ps1
#    powershell -ExecutionPolicy Bypass -File supabase\aplicar-remoto.ps1 -Archivos 015_nueva.sql
#
#  Token: fichero de texto con el access token (por defecto
#  %TEMP%\kilo\sb-token.txt). NUNCA commitear el token.
# ============================================================

param(
    [string]$ProjectRef = "iqshrizfepjmckcpdljc",
    [string[]]$Archivos = @(),
    [string]$TokenFile = ""
)

$ErrorActionPreference = "Stop"

# Token: primero .supabase-token en la raiz del proyecto (viaja con la carpeta, gitignored),
# luego fallback al temporal del usuario.
if ([string]::IsNullOrWhiteSpace($TokenFile)) {
    $tokenProyecto = Join-Path (Split-Path $PSScriptRoot -Parent) ".supabase-token"
    if (Test-Path $tokenProyecto) {
        $TokenFile = $tokenProyecto
    } else {
        $TokenFile = "$env:USERPROFILE\AppData\Local\Temp\kilo\sb-token.txt"
    }
}

if (-not (Test-Path $TokenFile)) {
    Write-Host "[X] No se encontro el token en $TokenFile" -ForegroundColor Red
    exit 1
}
$token = (Get-Content $TokenFile -Raw).Trim()
$headers = @{ Authorization = "Bearer $token" }

$dir = Join-Path $PSScriptRoot "migrations-arena"
if ($Archivos.Count -eq 0) {
    $Archivos = @(Get-ChildItem $dir -Filter *.sql | Sort-Object Name | Select-Object -ExpandProperty Name)
}

Write-Host ""
Write-Host "=== APLICAR MIGRACIONES -> $ProjectRef ===" -ForegroundColor Cyan
Write-Host "Archivos: $($Archivos.Count)"
Write-Host ""

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$fallo = $false

foreach ($nombre in $Archivos) {
    $ruta = Join-Path $dir $nombre
    if (-not (Test-Path $ruta)) { Write-Host "[X] No existe: $nombre" -ForegroundColor Red; $fallo = $true; continue }
    $sql = [System.IO.File]::ReadAllText($ruta)
    try {
        $body = @{ query = $sql } | ConvertTo-Json -Depth 3
        Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
        Write-Host "[OK] $nombre" -ForegroundColor Green
    } catch {
        $fallo = $true
        Write-Host "[X] $nombre" -ForegroundColor Red
        $det = ""
        try { $det = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch {}
        if ($det) { Write-Host "    $det" -ForegroundColor DarkRed }
        Write-Host "    (corrije el SQL y reejecuta; lo ya aplicado es idempotente en su mayoria)" -ForegroundColor Yellow
        break
    }
}

Write-Host ""
if ($fallo) { Write-Host "=== COMPLETADO CON ERRORES ===" -ForegroundColor Red; exit 1 }
Write-Host "=== TODO APLICADO ===" -ForegroundColor Green
