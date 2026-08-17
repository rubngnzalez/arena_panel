# ============================================================
#  PANEL ARENA13 - SINCRONIZAR (trabajo en 2 PCs)
#  Baja lo del otro PC y sube tus cambios. Ejecutar SIEMPRE
#  al empezar y al terminar cada sesion de trabajo.
#
#  Uso:
#    powershell -ExecutionPolicy Bypass -File sincronizar.ps1            # pull + push
#    powershell -ExecutionPolicy Bypass -File sincronizar.ps1 -SoloPull  # solo bajar
# ============================================================

param([switch]$SoloPull)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== PANEL ARENA13 - SINCRONIZACION ===" -ForegroundColor Cyan
Write-Host ""

# 1. Estado actual
$cambios = git status --porcelain
Write-Host "Rama: $(git branch --show-current)" -ForegroundColor White
if ($cambios) {
    Write-Host ""
    Write-Host "Cambios sin commit:" -ForegroundColor Yellow
    $cambios | ForEach-Object { Write-Host "  $_" }
    $resp = Read-Host "Hacer stash antes de sincronizar? (s/n) [s]"
    if ([string]::IsNullOrWhiteSpace($resp) -or $resp -match '^[sS]') {
        git stash push -m "auto-stash antes de sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        if ($LASTEXITCODE -ne 0) { Write-Host "[X] stash fallo" -ForegroundColor Red; exit 1 }
        Write-Host "[OK] Cambios guardados en stash" -ForegroundColor Green
    } else {
        Write-Host "[!] Si el pull da conflictos, revisa manualmente." -ForegroundColor Yellow
    }
}

# 2. Bajar cambios del remoto
Write-Host ""
Write-Host "-> git pull --rebase origin main" -ForegroundColor Yellow
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] El pull fallo (posibles conflictos)." -ForegroundColor Red
    Write-Host "    Revisa:   git status"
    Write-Host "    Resolver: editar archivos en conflicto"
    Write-Host "    Continuar: git rebase --continue"
    Write-Host "    Abortar:  git rebase --abort"
    exit 1
}
Write-Host "[OK] Al dia con el remoto" -ForegroundColor Green

# 3. Subir si hay commits locales
$porSubir = git rev-list origin/main..HEAD --count
if (-not $SoloPull -and [int]$porSubir -gt 0) {
    Write-Host ""
    Write-Host "-> git push origin main ($porSubir commits)" -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -ne 0) { Write-Host "[X] El push fallo. Revisa credenciales de GitHub." -ForegroundColor Red; exit 1 }
    Write-Host "[OK] Cambios subidos" -ForegroundColor Green
} elseif ($SoloPull) {
    Write-Host "(modo -SoloPull: no se sube nada)" -ForegroundColor DarkGray
} else {
    Write-Host "Nada que subir." -ForegroundColor DarkGray
}

# 4. Recuperar stash si se hizo
$stash = git stash list
if ($stash -and $stash.Count -gt 0) {
    $resp = Read-Host "Recuperar el stash? (s/n) [s]"
    if ([string]::IsNullOrWhiteSpace($resp) -or $resp -match '^[sS]') {
        git stash pop
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[X] stash pop con conflictos. Revisa: git status / git stash list" -ForegroundColor Red
            exit 1
        }
        Write-Host "[OK] Cambios locales recuperados" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== SINCRONIZADO ===" -ForegroundColor Cyan
Write-Host ""
