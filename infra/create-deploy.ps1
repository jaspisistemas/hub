<#
.SYNOPSIS
    Cria pacote de PRODUCAO do HUB (ZIP para deploy)
.DESCRIPTION
    Le a versao de infra/VERSION, gera o proximo patch, monta o pacote
    e opcionalmente faz upload para o GitHub.
#>

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InfraDir = $ScriptDir
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot

$VersionFile = Join-Path $InfraDir "VERSION"
if (-not (Test-Path $VersionFile)) {
    Write-Host "[ERRO] Arquivo VERSION nao encontrado: $VersionFile"
    Write-Host "Crie o arquivo com a versao atual (ex: v0.2.0)"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Le versao e gera proximo patch (v0.2.0 -> v0.2.1)
$currentVersion = (Get-Content $VersionFile -Raw).Trim()
$m = [regex]::Match($currentVersion, '^v?(\d+)\.(\d+)\.(\d+)$')
if (-not $m.Success) {
    Write-Host "[ERRO] Versao invalida no VERSION: $currentVersion"
    Write-Host "Use formato semver: v0.2.0 ou 0.2.0"
    Read-Host "Pressione Enter para sair"
    exit 1
}
$patch = [int]$m.Groups[3].Value + 1
$newVersion = "v$($m.Groups[1]).$($m.Groups[2]).$patch"

$deployFile = Join-Path $InfraDir "hub-deploy-$newVersion.zip"
$tempDir = Join-Path $InfraDir "deploy_temp_$newVersion"

# Remove zip existente se ja existir
if (Test-Path $deployFile) {
    Write-Host "Removendo arquivo existente: $deployFile"
    Remove-Item $deployFile -Force
}

Write-Host ""
Write-Host "========================================"
Write-Host "  HUB - Pacote de PRODUCAO"
Write-Host "========================================"
Write-Host ""
Write-Host "Versao atual: $currentVersion -> Nova versao: $newVersion"
Write-Host ""

# Build opcional
$jaFezBuild = Read-Host "Ja realizou o build do projeto? (S/N)"
if ($jaFezBuild -eq 'n' -or $jaFezBuild -eq 'N') {
    $querFazer = Read-Host "Deseja realizar o build agora? (S/N)"
    if ($querFazer -eq 's' -or $querFazer -eq 'S') {
        Write-Host ""
        Write-Host "[BUILD] Executando build completo... (VITE_API_URL=/api para acesso por IP)"
        $env:VITE_BASE_PATH = "/"
        $env:VITE_API_URL = "/api"
        if (Test-Path "packages\shared") {
            npm run build -w packages/shared
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[ERRO] Falha no build packages/shared!"
                Read-Host "Pressione Enter para sair"
                exit 1
            }
        }
        npm run build -w backend
        if ($LASTEXITCODE -ne 0) { Write-Host "[ERRO] Falha no build backend!"; Read-Host "Pressione Enter"; exit 1 }
        npm run build -w frontend
        if ($LASTEXITCODE -ne 0) { Write-Host "[ERRO] Falha no build frontend!"; Read-Host "Pressione Enter"; exit 1 }
        Write-Host ""
        Write-Host "[OK] Build concluido com sucesso!"
        Write-Host ""
    }
}

# Verifica builds
Write-Host "[PASSO 1/4] Verificando se os builds existem..."
Write-Host "IMPORTANTE: O build do frontend deve usar VITE_API_URL=/api para acesso por IP."
Write-Host ""

$builds = @(
    @{ Path = "backend\dist"; Cmd = "npm run build -w backend" },
    @{ Path = "frontend\dist"; Cmd = "npm run build -w frontend" }
)
if (Test-Path "packages\shared") {
    $builds += @{ Path = "packages\shared\dist"; Cmd = "npm run build -w packages/shared" }
}
foreach ($b in $builds) {
    if (-not (Test-Path $b.Path)) {
        Write-Host "[ERRO] $($b.Path) nao encontrado!"
        Write-Host "Execute: $($b.Cmd)"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}
Write-Host "[OK] Todos os builds encontrados!"
Write-Host ""

# Atualiza VERSION e backend/package.json ANTES de copiar (para o ZIP conter a versao correta)
[System.IO.File]::WriteAllText($VersionFile, $newVersion, [System.Text.UTF8Encoding]::new($false))
$versionForPkg = $newVersion.TrimStart('v')
$backendPkg = Join-Path $ProjectRoot "backend\package.json"
$pkgContent = Get-Content $backendPkg -Raw
$pkgContent = $pkgContent -replace '("version"\s*:\s*")[^"]*(")', "`${1}$versionForPkg`${2}"
[System.IO.File]::WriteAllText($backendPkg, $pkgContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] VERSION e backend/package.json atualizados para $newVersion"
Write-Host ""

# Cria diretorio temporario
Write-Host "[PASSO 2/4] Criando diretorio temporario..."
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
$null = New-Item -ItemType Directory -Path $tempDir
$null = New-Item -ItemType Directory -Path (Join-Path $tempDir "backend")
$null = New-Item -ItemType Directory -Path (Join-Path $tempDir "frontend")
if (Test-Path "packages\shared") {
    $null = New-Item -ItemType Directory -Path (Join-Path $tempDir "packages\shared")
}
Write-Host ""

# Copia arquivos
Write-Host "[PASSO 3/4] Copiando arquivos..."
Copy-Item "package.json" $tempDir
if (Test-Path "package-lock.json") { Copy-Item "package-lock.json" $tempDir }
@{ version = $newVersion } | ConvertTo-Json | Set-Content (Join-Path $tempDir "version.json")

# Backend (exclui .map - evita bloqueio quando backend esta rodando)
$backendDist = Join-Path $tempDir "backend\dist"
$backendSrc = (Resolve-Path "backend\dist").Path
Get-ChildItem $backendSrc -Recurse -File | Where-Object { $_.Extension -ne ".map" } | ForEach-Object {
    $relative = $_.FullName.Substring($backendSrc.Length).TrimStart("\")
    $dest = Join-Path $backendDist $relative
    $destDir = Split-Path $dest
    if (-not (Test-Path $destDir)) { New-Item $destDir -ItemType Directory -Force | Out-Null }
    Copy-Item $_.FullName $dest -Force
}
# backend/src nao necessario em prod - app usa dist/ compilado
Copy-Item "backend\package.json" (Join-Path $tempDir "backend")

Copy-Item "frontend\dist" (Join-Path $tempDir "frontend") -Recurse
Copy-Item "frontend\package.json" (Join-Path $tempDir "frontend")

if (Test-Path "packages\shared") {
    Copy-Item "packages\shared\dist" (Join-Path $tempDir "packages\shared") -Recurse
    Copy-Item "packages\shared\package.json" (Join-Path $tempDir "packages\shared")
}
Write-Host ""

# Compacta
Write-Host "[PASSO 4/4] Compactando..."
$ProgressPreference = "SilentlyContinue"
Compress-Archive -Path "$tempDir\*" -DestinationPath $deployFile -CompressionLevel Optimal -Force

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================"
Write-Host "  PACOTE CRIADO COM SUCESSO!"
Write-Host "========================================"
Write-Host ""
Write-Host "Arquivo: $deployFile"
$sizeMB = [math]::Round((Get-Item $deployFile).Length / 1MB, 2)
Write-Host "Tamanho: $sizeMB MB"
Write-Host ""

# Upload GitHub
$upload = Read-Host "Deseja fazer upload do artefato para o GitHub? (S/N)"
if ($upload -eq 's' -or $upload -eq 'S') {
    $gh = Get-Command gh -ErrorAction SilentlyContinue
    if (-not $gh) {
        Write-Host "[AVISO] GitHub CLI (gh) nao encontrado."
        Write-Host "Instale em: https://cli.github.com/"
    } else {
        Write-Host "[UPLOAD] Criando release $newVersion e enviando artefato..."
        & gh release create $newVersion $deployFile --title $newVersion --notes "Pacote de producao gerado em $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Artefato enviado ao GitHub!"
        } else {
            Write-Host "[AVISO] Falha no upload. Verifique se esta autenticado: gh auth login"
        }
    }
    Write-Host ""
}

Write-Host "========================================"
Write-Host "  PROXIMO PASSO"
Write-Host "========================================"
Write-Host ""
Write-Host "Use o deploy-atualizar.bat para instalar:"
Write-Host "  infra\deploy-atualizar.bat `"$deployFile`""
Write-Host ""
Write-Host "Ou extraia manualmente em BASE_PATH e execute:"
Write-Host "  npm install --omit=dev"
Write-Host "  npm run migration:run -w backend"
Write-Host ""
Read-Host "Pressione Enter para sair"
