@echo off
setlocal EnableDelayedExpansion
:: =============================================================================
:: HUB - Configuracao IIS via linha de comando
:: Executar como ADMINISTRADOR (botao direito > Executar como administrador)
:: =============================================================================

set "SCRIPT_DIR=%~dp0"
set "CONFIG_FILE=%SCRIPT_DIR%config.env"

:: Carrega config.env (obrigatorio)
if not exist "%CONFIG_FILE%" (
    echo [ERRO] config.env nao encontrado em %SCRIPT_DIR%
    pause
    exit /b 1
)
for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%CONFIG_FILE%") do set "%%a=%%b"
if exist "%SCRIPT_DIR%config.secrets.env" (
    for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%SCRIPT_DIR%config.secrets.env") do set "%%a=%%b"
)
for /f "tokens=*" %%v in ("%BASE_PATH%") do set "BASE_PATH=%%v"
for /f "tokens=*" %%v in ("%APPJASPI_PATH%") do set "APPJASPI_PATH=%%v"

:: Derivar SITE_PORT, SITE_BINDING e BACKEND_URL a partir de FRONTEND_PORT e BACKEND_PORT
if not defined SITE_PORT if defined FRONTEND_PORT set "SITE_PORT=!FRONTEND_PORT!"
if not defined SITE_BINDING if defined FRONTEND_PORT set "SITE_BINDING=*:!FRONTEND_PORT!:"
if not defined BACKEND_URL if defined BACKEND_PORT set "BACKEND_URL=http://localhost:!BACKEND_PORT!"

:: Valida variaveis obrigatorias (sem valores padrao)
set "FALTANDO="
if not defined BASE_PATH set "FALTANDO=!FALTANDO! BASE_PATH"
if not defined APPJASPI_PATH set "FALTANDO=!FALTANDO! APPJASPI_PATH"
if not defined APPPOOL_NAME set "FALTANDO=!FALTANDO! APPPOOL_NAME"
if not defined SITE_NAME set "FALTANDO=!FALTANDO! SITE_NAME"
if not defined FRONTEND_PORT set "FALTANDO=!FALTANDO! FRONTEND_PORT"
if not defined BACKEND_PORT set "FALTANDO=!FALTANDO! BACKEND_PORT"
if not defined SITE_BINDING set "FALTANDO=!FALTANDO! SITE_BINDING"
if not defined SITE_PORT set "FALTANDO=!FALTANDO! SITE_PORT"
if not defined VDIR_NAME set "FALTANDO=!FALTANDO! VDIR_NAME"
if not defined BACKEND_URL set "FALTANDO=!FALTANDO! BACKEND_URL"
if defined FALTANDO (
    echo [ERRO] Variaveis obrigatorias nao definidas no config.env:!FALTANDO!
    echo Configure todas as variaveis em config.env
    pause
    exit /b 1
)

:: Variaveis derivadas (FRONTEND_PATH vem do config.env ou padrao)
if not defined FRONTEND_PATH set "FRONTEND_PATH=%BASE_PATH%\frontend\dist"
set "APP_NAME=%SITE_NAME%/"
set "APPCMD=%windir%\system32\inetsrv\appcmd.exe"

:: Verifica se esta rodando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Execute este script como Administrador.
    echo Botao direito no arquivo ^> Executar como administrador
    pause
    exit /b 1
)

:: Verifica se o AppCmd existe
if not exist "%APPCMD%" (
    echo [ERRO] AppCmd nao encontrado. Verifique se o IIS esta instalado.
    pause
    exit /b 1
)

echo.
echo === HUB - Configuracao IIS ===
echo.
echo Path base: %BASE_PATH%
echo Frontend:  %FRONTEND_PATH%
echo AppJaspi:  %APPJASPI_PATH%
echo.

:: 1. Application Pool (v4.0 = mesmo do site pai, evita 403.18 com pool dedicado)
echo [1/6] Application Pool "%APPPOOL_NAME%"...
"%APPCMD%" list apppool "%APPPOOL_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo       Pool existe.
    "%APPCMD%" set apppool "%APPPOOL_NAME%" /managedRuntimeVersion:"v4.0"
) else (
    "%APPCMD%" add apppool /name:"%APPPOOL_NAME%" /managedRuntimeVersion:"v4.0"
    if errorlevel 1 (
        echo [ERRO] Falha ao criar pool.
        pause
        exit /b 1
    )
    echo       Pool criado.
)

:: 2. Verificar/criar diretorio appjaspi
if not exist "%APPJASPI_PATH%" (
    echo [2/6] Criando diretorio %APPJASPI_PATH%...
    mkdir "%APPJASPI_PATH%"
    echo       Diretorio criado.
) else (
    echo [2/6] Diretorio appjaspi ja existe.
)

:: 3. Criar Site dedicado (nao usa Default Web Site)
echo [3/6] Criando site "%SITE_NAME%"...
"%APPCMD%" list site "%SITE_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo       Site ja existe. Atualizando...
    "%APPCMD%" set site "%SITE_NAME%" /physicalPath:"%FRONTEND_PATH%"
    "%APPCMD%" set app "%SITE_NAME%/" /applicationPool:"%APPPOOL_NAME%"
) else (
    "%APPCMD%" add site /name:"%SITE_NAME%" /bindings:http/%SITE_BINDING% /physicalPath:"%FRONTEND_PATH%"
    if errorlevel 1 (
        echo [ERRO] Falha ao criar site. Verifique se a porta em SITE_BINDING esta livre.
        pause
        exit /b 1
    )
    "%APPCMD%" set app "%SITE_NAME%/" /applicationPool:"%APPPOOL_NAME%"
    echo       Site criado.
)

:: 4. Adicionar Diretorio Virtual appjaspi
echo [4/6] Criando diretorio virtual /%VDIR_NAME%...
"%APPCMD%" list vdir "%APP_NAME%%VDIR_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo       Virtual directory ja existe.
) else (
"%APPCMD%" add vdir /app.name:"%APP_NAME%" /path:/%VDIR_NAME% /physicalPath:"%APPJASPI_PATH%"
if errorlevel 1 (
    echo [ERRO] Falha ao criar diretorio virtual.
    pause
    exit /b 1
)
echo       Diretorio virtual criado.
)

:: 5. Habilitar ARR Proxy (necessario para o proxy /api funcionar)
echo [5/6] Habilitando proxy ARR...
"%APPCMD%" set config -section:system.webServer/proxy /enabled:"True" /commit:apphost 2>nul
if errorlevel 1 (
    echo       [AVISO] Nao foi possivel habilitar via script. Habilite manualmente:
    echo       IIS Manager -^> Application Request Routing -^> Server Proxy Settings -^> Enable proxy
) else (
    echo       ARR Proxy habilitado.
)

:: 6. Gerar web.config com proxy para a API
echo [6/6] Configurando web.config no frontend...
set "TEMPLATE=%SCRIPT_DIR%web.config.template"
set "WEB_CONFIG=%FRONTEND_PATH%\web.config"
if not exist "%TEMPLATE%" (
    echo       [AVISO] web.config.template nao encontrado em %SCRIPT_DIR%
) else (
    powershell -NoProfile -Command "if (Test-Path -LiteralPath '%FRONTEND_PATH%') { (Get-Content '%TEMPLATE%') -replace '{{BACKEND_URL}}', '%BACKEND_URL%' | Set-Content -LiteralPath '%WEB_CONFIG%' -Encoding UTF8; exit 0 } else { Write-Host 'Pasta nao encontrada:' '%FRONTEND_PATH%'; exit 1 }"
    if errorlevel 1 (
        echo       [AVISO] Execute manualmente: copie web.config.template para %FRONTEND_PATH%\web.config
        echo       Substitua {{BACKEND_URL}} por %BACKEND_URL%
    ) else (
        echo       web.config gerado (proxy /api -^> %BACKEND_URL%)
    )
)

:: Reciclar o pool para aplicar alteracoes
echo.
echo Reciclando Application Pool...
"%APPCMD%" recycle apppool /apppool.name:"%APPPOOL_NAME%"

echo.
echo === Configuracao concluida ===
echo.
echo Acesso:  http://localhost:%SITE_PORT%/
echo AppJaspi: http://localhost:%SITE_PORT%/%VDIR_NAME%/
echo API (proxy): http://localhost:%SITE_PORT%/api -^> %BACKEND_URL%
echo.
echo IMPORTANTE: O backend (NestJS) e o importador rodam via Node.js.
echo O IIS faz proxy de /api para o backend.
echo.
pause
