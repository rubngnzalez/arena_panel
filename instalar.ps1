# ============================================================
#  PANEL ARENA13 - INSTALADOR PARA NUEVO PC
#  Clona el repositorio, instala dependencias y genera .env.local
#
#  Uso:
#    powershell -ExecutionPolicy Bypass -File instalar.ps1
#
#  Opciones:
#    powershell -ExecutionPolicy Bypass -File instalar.ps1 -Destino "C:\arenatrece\panel"
#    powershell -ExecutionPolicy Bypass -File instalar.ps1 -ArchivoEnv "C:\ruta\env-local-export.txt"
# ============================================================

param(
    [string]$Destino = "C:\arenatrece\panel",
    [string]$RepoUrl = "https://github.com/rubngnzalez/arena_panel.git",
    [string]$ArchivoEnv = ""
)

$ErrorActionPreference = "Stop"

# ---------- Utilidades de consola ----------
function Escribir-Titulo([string]$Texto) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor DarkCyan
    Write-Host "  $Texto" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor DarkCyan
}

function Escribir-OK([string]$Texto)   { Write-Host "  [OK] $Texto" -ForegroundColor Green }
function Escribir-Paso([string]$Texto) { Write-Host "  ->  $Texto" -ForegroundColor Yellow }
function Escribir-Error([string]$Texto) { Write-Host "  [X]  $Texto" -ForegroundColor Red }

function Leer-ConDefault([string]$Mensaje, [string]$Default) {
    $v = Read-Host "$Mensaje [$Default]"
    if ([string]::IsNullOrWhiteSpace($v)) { return $Default } else { return $v.Trim() }
}

# ----------
Escribir-Titulo "PANEL ARENA13 - INSTALADOR"
Write-Host "  Repo destino : $RepoUrl"
Write-Host "  Carpeta      : $Destino"
Write-Host ""

# ---------- 1. Prerequisitos ----------
Escribir-Titulo "PASO 1/4 - Verificando prerequisitos"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Escribir-Error "Git no esta instalado. Descargalo de: https://git-scm.com/download/win"
    exit 1
}
Escribir-OK "Git $((git --version) -replace 'git version ','')"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Escribir-Error "Node.js no esta instalado. Descarga la LTS (18 o superior) de: https://nodejs.org"
    exit 1
}
$nodeMajor = [int]((node -v) -replace 'v','').Split('.')[0]
if ($nodeMajor -lt 18) {
    Escribir-Error "Node.js $nodeMajor es demasiado antiguo. Next.js 15 requiere 18.18+. Actualiza en https://nodejs.org"
    exit 1
}
Escribir-OK "Node.js $(node -v)"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Escribir-Error "npm no esta disponible. Reinstala Node.js desde https://nodejs.org"
    exit 1
}
Escribir-OK "npm $(npm -v)"

# ---------- 2. Clonar / actualizar repositorio ----------
Escribir-Titulo "PASO 2/4 - Descargando repositorio"

if (Test-Path (Join-Path $Destino ".git")) {
    Escribir-Paso "El repositorio ya existe en $Destino"
    $resp = Leer-ConDefault "Actualizar con git pull? (s/n)" "s"
    if ($resp -match '^[sS]') {
        Push-Location $Destino
        git pull --rebase origin main
        if ($LASTEXITCODE -ne 0) { Escribir-Error "git pull fallo. Revisa conflictos manuales."; Pop-Location; exit 1 }
        Pop-Location
        Escribir-OK "Repositorio actualizado"
    } else {
        Escribir-OK "Se mantiene la version actual"
    }
} else {
    if (Test-Path $Destino) {
        Escribir-Error "La carpeta $Destino existe pero no es un repositorio git. Muevela o borrala primero."
        exit 1
    }
    Escribir-Paso "Clonando $RepoUrl ..."
    git clone $RepoUrl $Destino
    if ($LASTEXITCODE -ne 0) { Escribir-Error "Clone fallo. Revisa tu conexion o permisos del repo."; exit 1 }
    Escribir-OK "Repositorio clonado en $Destino"
}

# ---------- 3. Dependencias ----------
Escribir-Titulo "PASO 3/4 - Instalando dependencias (puede tardar varios minutos)"

Push-Location $Destino
try {
    if (Test-Path "package-lock.json") {
        Escribir-Paso "npm ci (instalacion exacta segun package-lock.json) ..."
        npm ci
        if ($LASTEXITCODE -ne 0) {
            Escribir-Paso "npm ci fallo, reintentando con npm install ..."
            npm install
            if ($LASTEXITCODE -ne 0) { Escribir-Error "Fallo la instalacion de dependencias."; exit 1 }
        }
    } else {
        Escribir-Paso "npm install ..."
        npm install
        if ($LASTEXITCODE -ne 0) { Escribir-Error "Fallo la instalacion de dependencias."; exit 1 }
    }
    Escribir-OK "Dependencias instaladas"
} finally {
    Pop-Location
}

# ---------- 4. Configuracion .env.local ----------
Escribir-Titulo "PASO 4/4 - Configuracion local (.env.local)"

$rutaEnv = Join-Path $Destino ".env.local"

# 4a. Buscar archivo exportado desde el otro PC
$rutaExport = $ArchivoEnv
if ([string]::IsNullOrWhiteSpace($rutaExport)) {
    foreach ($candidato in @((Join-Path $PSScriptRoot "env-local-export.txt"), (Join-Path (Get-Location) "env-local-export.txt"))) {
        if (Test-Path $candidato) { $rutaExport = $candidato; break }
    }
}

if (Test-Path $rutaEnv) {
    Escribir-OK ".env.local ya existe, no se sobrescribe"
} elseif (-not [string]::IsNullOrWhiteSpace($rutaExport) -and (Test-Path $rutaExport)) {
    Escribir-Paso "Importando configuracion desde $rutaExport"
    Copy-Item $rutaExport $rutaEnv
    Escribir-OK ".env.local creado desde el archivo exportado"
} else {
    Escribir-Paso "No hay archivo exportado: se creara .env.local a mano"
    Write-Host ""
    Write-Host "  Necesitas la ANON KEY del proyecto Arena13 en Supabase:" -ForegroundColor White
    Write-Host "  https://supabase.com/dashboard/project/cvfelnyalkdjxzzelski/settings/api" -ForegroundColor DarkGray
    Write-Host ""

    do {
        $anonKey = (Read-Host "  Pega NEXT_PUBLIC_SUPABASE_ANON_KEY (obligatoria)").Trim()
        if ([string]::IsNullOrWhiteSpace($anonKey)) { Escribir-Error "La clave anon es obligatoria." }
    } while ([string]::IsNullOrWhiteSpace($anonKey))

    $serviceKey  = (Read-Host "  SUPABASE_SERVICE_ROLE_KEY (opcional, Enter para omitir)").Trim()
    $dbPassword  = (Read-Host "  SUPABASE_DB_PASSWORD (opcional, Enter para omitir)").Trim()
    $url         = Leer-ConDefault "  NEXT_PUBLIC_SUPABASE_URL" "https://cvfelnyalkdjxzzelski.supabase.co"
    $dominio     = Leer-ConDefault "  NEXT_PUBLIC_DOMAIN" "arenatrece.com"
    $subdominio  = Leer-ConDefault "  NEXT_PUBLIC_PANEL_SUBDOMAIN" "panel"

    $lineas = @(
        "# ",
        "# PANEL ARENA13 - CONFIGURACION SUPABASE",
        "# Proyecto: Arena13 (ref: cvfelnyalkdjxzzelski)",
        "# https://supabase.com/dashboard/project/cvfelnyalkdjxzzelski",
        "# RESTRICCION: estas claves son SOLO para Arena13.",
        "#              PROHIBIDO usarlas con el proyecto UMOFOUR.",
        "# ",
        "",
        "NEXT_PUBLIC_SUPABASE_URL=$url",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey"
    )
    if (-not [string]::IsNullOrWhiteSpace($serviceKey)) { $lineas += "SUPABASE_SERVICE_ROLE_KEY=$serviceKey" }
    $lineas += @(
        "",
        "# Entorno de ejecucion (local | produccion)",
        "NEXT_PUBLIC_ENVIRONMENT=local",
        "",
        "# Dominio para produccion",
        "NEXT_PUBLIC_DOMAIN=$dominio",
        "NEXT_PUBLIC_PANEL_SUBDOMAIN=$subdominio"
    )
    if (-not [string]::IsNullOrWhiteSpace($dbPassword)) {
        $lineas += @(
            "# Contrasena de BD (SOLO admin/CLI, no expuesta al cliente ni al repo)",
            "SUPABASE_DB_PASSWORD=$dbPassword"
        )
    }
    $lineas += ""

    # UTF-8 sin BOM (dotenv no siempre tolera BOM)
    [System.IO.File]::WriteAllText($rutaEnv, ($lineas -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))
    Escribir-OK ".env.local creado"
}

# ---------- Resumen final ----------
Escribir-Titulo "INSTALACION COMPLETADA"

Write-Host "  Carpeta del proyecto : $Destino" -ForegroundColor White
Write-Host ""
Write-Host "  Comandos habituales:" -ForegroundColor White
Write-Host "    cd $Destino"
Write-Host "    npm run dev        # desarrollo en http://localhost:3000"
Write-Host "    npm run build      # build + export estatico a ./out"
Write-Host ""
Write-Host "  Para sincronizar con el otro PC tras cada sesion:" -ForegroundColor White
Write-Host "    .\sincronizar.ps1"
Write-Host ""
Write-Host "  RECUERDA: el push a GitHub requiere tus credenciales configuradas"
Write-Host "  (git config user.name / user.email + credential manager)."
Write-Host ""

$arrancar = Leer-ConDefault "Arrancar el servidor de desarrollo ahora? (s/n)" "n"
if ($arrancar -match '^[sS]') {
    Push-Location $Destino
    try { npm run dev } finally { Pop-Location }
}
