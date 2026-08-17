# ============================================================
#  PANEL ARENA13 - EXPORTAR CONFIGURACION LOCAL
#  Empaqueta .env.local para transferirlo al otro PC.
#
#  Uso:
#    powershell -ExecutionPolicy Bypass -File exportar-config.ps1
#
#  Genera:  env-local-export.txt  (gitignored, NO subir a GitHub)
#  y lo copia al portapapeles para pegarlo en un medio seguro.
# ============================================================

$ErrorActionPreference = "Stop"

$rutaEnv    = Join-Path $PSScriptRoot ".env.local"
$rutaExport = Join-Path $PSScriptRoot "env-local-export.txt"

if (-not (Test-Path $rutaEnv)) {
    Write-Host "[X] No se encontro .env.local en $rutaEnv" -ForegroundColor Red
    exit 1
}

Copy-Item $rutaEnv $rutaExport -Force

$kb = [math]::Round((Get-Item $rutaExport).Length / 1KB, 1)
Write-Host ""
Write-Host "[OK] Configuracion exportada: $rutaExport ($kb KB)" -ForegroundColor Green

try {
    Get-Content $rutaExport -Raw | Set-Clipboard
    Write-Host "[OK] Contenido copiado al portapapeles." -ForegroundColor Green
} catch {
    Write-Host "[!] No se pudo usar el portapapeles. Copia el archivo manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Como llevarlo al otro PC (elige UNA):" -ForegroundColor White
Write-Host "  1. Pendrive / carpeta compartida: copia env-local-export.txt"
Write-Host "     y ponlo JUNTO a instalar.ps1 antes de ejecutarlo."
Write-Host "  2. Pegar el contenido del portapapeles en un archivo llamado"
Write-Host "     env-local-export.txt en el PC nuevo, junto a instalar.ps1."
Write-Host "  3. En el instalador, pegarlo a mano cuando pida la ANON KEY."
Write-Host ""
Write-Host "IMPORTANTE: este archivo contiene secretos (service role, BD)." -ForegroundColor Red
Write-Host "NO lo envies por canales inseguros ni lo subas al repo." -ForegroundColor Red
Write-Host "Esta excluido de git via .gitignore." -ForegroundColor Red
Write-Host ""
