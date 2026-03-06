<#
.SYNOPSIS
    HUB - Atualizacao (deploy de nova versao)
.DESCRIPTION
    Baixa ou usa zip local, extrai, copia arquivos, roda migracoes, reinicia PM2.
    Uso: .\deploy-atualizar.ps1 [caminho-do-zip]
          .\deploy-atualizar.ps1 /AUTO  (baixa do GitHub, nao interativo)
#>

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigFile = Join-Path $ScriptDir "config.env"
$SecretsFile = Join-Path $ScriptDir "config.secrets.env"
# Log: usa TEMP para evitar falha por permissao na pasta infra (Creator Owner)
$LogFile = Join-Path $env:TEMP "hub-deploy-atualizar.log"

function Load-EnvFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return @{} }
    $vars = @{}
    Get-Content $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $idx = $line.IndexOf("=")
            if ($idx -gt 0) {
                $key = $line.Substring(0, $idx).Trim()
                $val = $line.Substring($idx + 1).Trim()
                $vars[$key] = $val
            }
        }
    }
    return $vars
}

function Apply-EnvVars {
    param([hashtable]$Vars)
    foreach ($k in $Vars.Keys) { [Environment]::SetEnvironmentVariable($k, $Vars[$k], "Process") }
}

# /AUTO: redireciona para log e roda em modo nao interativo
$argsList = @($args)
if ($argsList -contains "/AUTO") {
    $innerArgs = $argsList | Where-Object { $_ -ne "/AUTO" } | ForEach-Object { $_ }
    & $PSCommandPath "_AUTO" @innerArgs *> $LogFile
    exit $LASTEXITCODE
}
$ModeAuto = $argsList -contains "_AUTO"
$argsList = $argsList | Where-Object { $_ -ne "_AUTO" }

if ($ModeAuto) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Iniciando deploy..."
    Write-Host "ScriptDir: $ScriptDir | Config: $ConfigFile | Log: $LogFile"
}

# Carrega config
if (-not (Test-Path $ConfigFile)) {
    Write-Host "[ERRO] config.env nao encontrado."
    Read-Host "Pressione Enter para sair"
    exit 1
}
$config = Load-EnvFile $ConfigFile
if (Test-Path $SecretsFile) {
    $secrets = Load-EnvFile $SecretsFile
    foreach ($k in $secrets.Keys) { $config[$k] = $secrets[$k] }
}
Apply-EnvVars $config

$BasePath = $env:BASE_PATH
if (-not $BasePath) {
    Write-Host "[ERRO] BASE_PATH nao definido em config.env"
    Read-Host "Pressione Enter para sair"
    exit 1
}
if (-not $env:BACKEND_URL -and $env:BACKEND_PORT) {
    $env:BACKEND_URL = "http://localhost:$($env:BACKEND_PORT)"
}
if (-not $env:FRONTEND_PATH) { $env:FRONTEND_PATH = Join-Path $BasePath "frontend\dist" }
$BackendPath = Join-Path $BasePath "backend"
$FrontendPath = $env:FRONTEND_PATH.Trim()
if (-not $env:RELEASES_PATH) { $env:RELEASES_PATH = $ScriptDir }

$ZipFile = $argsList | Where-Object { $_ } | Select-Object -First 1

# Obter zip
if (-not $ZipFile) {
    if ($ModeAuto) {
        $ZipFile = $null
    } else {
        Write-Host ""
        Write-Host "Nenhum zip informado."
        Write-Host "[1] Baixar ultima versao do GitHub automaticamente"
        Write-Host "[2] Informar caminho do zip manualmente"
        Write-Host ""
        $opcao = Read-Host "Escolha (1 ou 2)"
        if ($opcao -eq "1") {
            $ZipFile = $null  # sera baixado
        } else {
            $ZipFile = (Read-Host "Caminho do zip").Trim('"')
        }
    }
}

# Download automatico
if (-not $ZipFile) {
    if (-not $env:GITHUB_REPO) {
        Write-Host "[ERRO] GITHUB_REPO nao definido em config.env"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    if (-not $env:GITHUB_TOKEN) {
        Write-Host "[ERRO] Repositorio privado: defina GITHUB_TOKEN no config.secrets.env"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    Write-Host ""
    Write-Host "Baixando ultima versao de https://github.com/$($env:GITHUB_REPO)/releases ..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $auth = @{ "User-Agent" = "Hub-Updater"; "Authorization" = "Bearer $($env:GITHUB_TOKEN)" }
    try {
        $r = Invoke-RestMethod -Uri "https://api.github.com/repos/$($env:GITHUB_REPO)/releases/latest" -Headers $auth
        $zip = $r.assets | Where-Object { $_.name -match '\.zip$' } | Select-Object -First 1
        if (-not $zip) { throw "Nenhum zip na release" }
        $ZipFile = Join-Path $env:RELEASES_PATH $zip.name
        $dlHeaders = @{ "User-Agent" = "Hub-Updater"; "Authorization" = "Bearer $($env:GITHUB_TOKEN)"; "Accept" = "application/octet-stream" }
        $assetUrl = "https://api.github.com/repos/$($env:GITHUB_REPO)/releases/assets/$($zip.id)"
        Invoke-WebRequest -Uri $assetUrl -OutFile $ZipFile -UseBasicParsing -Headers $dlHeaders
        Write-Host "Baixado: $ZipFile"
    } catch {
        Write-Host "[ERRO] Falha ao baixar: $_"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

if (-not (Test-Path $ZipFile)) {
    Write-Host "[ERRO] Arquivo nao encontrado: $ZipFile"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Pasta de extracao
$zipBasename = [System.IO.Path]::GetFileNameWithoutExtension($ZipFile)
$ExtractDir = Join-Path $ScriptDir ($zipBasename -replace "deploy", "update")

Write-Host ""
Write-Host "=== HUB - Atualizacao ==="
Write-Host ""
Write-Host "Zip: $ZipFile"
Write-Host "App (backend): $BasePath"
Write-Host "Frontend: $FrontendPath"
Write-Host ""

# 1. Parar backend
Write-Host "[1/5] Parando backend..."
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) {
    Write-Host "      PM2 nao encontrado. Pare os processos manualmente e pressione uma tecla..."
    Read-Host
} else {
    & pm2 stop hub-backend 2>$null
    Write-Host "      Parado."
}

# 2. Extrair
Write-Host "[2/5] Extraindo..."
if (Test-Path $ExtractDir) { Remove-Item $ExtractDir -Recurse -Force }
New-Item -ItemType Directory -Path $ExtractDir -Force | Out-Null
$sevenZip = "C:\Program Files\7-Zip\7z.exe"
$extracted = $false
if (Test-Path $sevenZip) {
    & $sevenZip x $ZipFile "-o$ExtractDir" -y | Out-Null
    if ($LASTEXITCODE -eq 0) { $extracted = $true }
}
if (-not $extracted) {
    $tar = Get-Command tar -ErrorAction SilentlyContinue
    if ($tar) {
        & tar -xf $ZipFile -C $ExtractDir 2>$null
        if ($LASTEXITCODE -eq 0) { $extracted = $true }
    }
}
if (-not $extracted) {
    Expand-Archive -LiteralPath $ZipFile -DestinationPath $ExtractDir -Force
    $extracted = $true
}
if (-not (Test-Path (Join-Path $ExtractDir "backend"))) {
    Write-Host "[ERRO] Falha ao extrair. Verifique se o zip esta integro."
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "      Extraido."

# 3. Copiar arquivos
Write-Host "[3/5] Atualizando arquivos..."
Copy-Item (Join-Path $ExtractDir "backend\*") $BackendPath -Recurse -Force
if (-not (Test-Path $FrontendPath)) { New-Item -ItemType Directory -Path $FrontendPath -Force | Out-Null }
Copy-Item (Join-Path $ExtractDir "frontend\dist\*") $FrontendPath -Recurse -Force
if ($FrontendPath -eq (Join-Path $BasePath "frontend\dist")) {
    if (-not (Test-Path (Join-Path $BasePath "frontend"))) { New-Item -ItemType Directory -Path (Join-Path $BasePath "frontend") -Force | Out-Null }
    if (Test-Path (Join-Path $ExtractDir "frontend\package.json")) {
        Copy-Item (Join-Path $ExtractDir "frontend\package.json") (Join-Path $BasePath "frontend\") -Force
    }
}
if (Test-Path (Join-Path $ExtractDir "packages")) {
    if (-not (Test-Path (Join-Path $BasePath "packages"))) { New-Item -ItemType Directory -Path (Join-Path $BasePath "packages") -Force | Out-Null }
    Copy-Item (Join-Path $ExtractDir "packages\*") (Join-Path $BasePath "packages") -Recurse -Force
}
foreach ($f in @("version.json", "package.json", "package-lock.json")) {
    $src = Join-Path $ExtractDir $f
    if (Test-Path $src) { Copy-Item $src $BasePath -Force }
}
$ecosystemSrc = Join-Path $ScriptDir "ecosystem.config.js"
if (-not (Test-Path (Join-Path $BasePath "ecosystem.config.js")) -and (Test-Path $ecosystemSrc)) {
    Copy-Item $ecosystemSrc $BasePath -Force
    Write-Host "      ecosystem.config.js copiado"
}
$envExample = Join-Path $ScriptDir ".env.example"
$backendEnv = Join-Path $BackendPath ".env"
if (-not (Test-Path $backendEnv) -and (Test-Path $envExample)) {
    $c = Get-Content $envExample -Raw
    $c = $c -replace 'PORT=\d+', "PORT=$($env:BACKEND_PORT)"
    $c = $c -replace 'CORS_ORIGINS=.*', "CORS_ORIGINS=http://localhost:$($env:FRONTEND_PORT)"
    $c = $c -replace 'BACKEND_URL=.*', "BACKEND_URL=http://localhost:$($env:BACKEND_PORT)"
    Set-Content $backendEnv $c -Encoding UTF8
    Write-Host "      .env criado"
}
Write-Host "      Instalando dependencias..."
Push-Location $BasePath
try {
    if ($FrontendPath -eq (Join-Path $BasePath "frontend\dist")) {
        & npm install --omit=dev --no-audit --no-fund
    } elseif (Test-Path (Join-Path $BasePath "packages\shared")) {
        & npm install -w backend -w packages/shared --omit=dev --no-audit --no-fund --ignore-scripts
    } else {
        & npm install -w backend --omit=dev --no-audit --no-fund --ignore-scripts
    }
    if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }
} finally { Pop-Location }
Write-Host "      Arquivos atualizados."

# 4. Migracoes e web.config
Write-Host "[4/5] Migracoes TypeORM e web.config..."
Push-Location $BasePath
try {
    & npm run migration:run -w backend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Migracao falhou. Verifique o banco de dados."
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} finally { Pop-Location }
if (-not $env:BACKEND_URL) {
    Write-Host "[ERRO] BACKEND_URL nao definido em config.env"
    Read-Host "Pressione Enter para sair"
    exit 1
}
$webConfig = Join-Path $FrontendPath "web.config"
$webConfigTemplate = Join-Path $ScriptDir "web.config.template"
if (-not (Test-Path $webConfig) -and (Test-Path $webConfigTemplate)) {
    $wc = (Get-Content $webConfigTemplate -Raw) -replace '{{BACKEND_URL}}', $env:BACKEND_URL
    Set-Content $webConfig $wc -Encoding UTF8
    Write-Host "      web.config criado"
} else {
    Write-Host "      web.config existente mantido"
}
Write-Host "      OK."

# 5. Reiniciar PM2
Write-Host "[5/5] Reiniciando..."
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) {
    Write-Host "      PM2 nao encontrado. Inicie manualmente: node $BackendPath\dist\main.js"
} else {
    & pm2 restart hub-backend 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      Iniciando hub-backend..."
        Push-Location $BasePath
        & pm2 start ecosystem.config.js --only hub-backend
        Pop-Location
    }
    & pm2 save --force 2>$null
    Write-Host "      OK."
}

# Limpar
Remove-Item $ExtractDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Atualizacao concluida ==="
Write-Host ""
if ($ModeAuto) {
    exit 0
} else {
    Read-Host "Pressione Enter para sair"
}
