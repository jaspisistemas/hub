# HUB - Infraestrutura de implantação

Scripts e configurações para deploy do HUB em Windows com IIS.

## Estrutura recomendada no servidor

O frontend fica em **pasta separada** do backend. Configure `FRONTEND_PATH` no `config.env`:

```
c:\jaspi\infra      → pasta dos scripts de deploy (config.env, .bat, templates)
c:\jaspi\app        → backend e packages (sem frontend)
c:\jaspi\frontend   → frontend buildado (dist) – pasta separada
c:\jaspi\appjaspi   → diretório virtual appjaspi
```

O deploy copia o conteúdo de `frontend/dist` do zip para `FRONTEND_PATH`. O IIS aponta o site para `FRONTEND_PATH`.

**Alternativa:** Se o frontend estiver dentro do app, omita `FRONTEND_PATH` – o padrão será `BASE_PATH\frontend\dist`.

> **Importante:** A pasta `infra` **não pode ser apagada**. Ela é usada pelos scripts de deploy e atualização. Mantenha-a no servidor.

## config.env – variáveis de configuração

Edite `config.env` conforme o ambiente. Linhas com `#` são ignoradas.

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| **BASE_PATH** | Sim | Caminho base da aplicação (ex: `D:\IMPLANTACAO\hub\app`). Contém backend e packages. |
| **APPJASPI_PATH** | Sim | Caminho do diretório virtual appjaspi (ex: `D:\IMPLANTACAO\hub\appjaspi`). Pode estar fora do BASE_PATH. |
| **FRONTEND_PATH** | Sim* | Caminho do frontend buildado (destino do `frontend/dist` do zip). Ex: `D:\IMPLANTACAO\hub\frontend`. Se vazio, usa `BASE_PATH\frontend\dist`. |
| **FRONTEND_PORT** | Sim | Porta do frontend (ex: `10301`). Usada pelo IIS e pelo proxy. |
| **BACKEND_PORT** | Sim | Porta do backend (ex: `10302`). Usada pelo PM2 e pelo proxy. |
| **BACKEND_URL** | Não | URL do backend para o web.config (proxy `/api`). Se vazio, usa `http://localhost:BACKEND_PORT`. |
| **APPPOOL_NAME** | Sim | Nome do Application Pool do IIS (ex: `HubAppPool`). |
| **SITE_NAME** | Sim | Nome do site IIS dedicado (ex: `HUB`). Não usa Default Web Site. |
| **VDIR_NAME** | Sim | Nome do diretório virtual appjaspi sob o site (ex: `appjaspi`). |
| **RELEASES_PATH** | Não | Pasta onde baixar/guardar zips de update. Se vazio, usa a pasta `infra`. |
| **GITHUB_REPO** | Sim* | Repositório GitHub (owner/repo) para buscar releases (ex: `jaspisistemas/hub`). Obrigatório para download automático. |

\* `FRONTEND_PATH` é obrigatório quando o frontend está em pasta separada (configuração padrão do HUB). `GITHUB_REPO` é obrigatório apenas quando se usa o download automático de releases.

## config.secrets.env – secrets (não commitar)

Crie `config.secrets.env` a partir de `config.secrets.env.example` e preencha:

| Variável | Descrição |
|----------|-----------|
| **GITHUB_TOKEN** | Token de acesso ao GitHub (obrigatório para repositório privado). Escopo: `repo`. |

O arquivo `config.secrets.env` está no `.gitignore`. Não versionar.

## Publicar release (enviar para o Git)

Antes do fluxo de deploy no servidor, para gerar o pacote e publicar no GitHub:

1. Execute **`create-deploy.bat`** (ou `create-deploy.ps1`)
2. O script pergunta se já realizou o build; se não, pode executar o build na hora
3. Gera o ZIP de produção em `infra/hub-deploy-vX.Y.Z.zip`
4. Pergunta se deseja fazer upload para o GitHub (cria release e anexa o zip)

O pacote gerado é o que será baixado pelo `deploy-atualizar.bat` no servidor.

**Versão:** Controlada pelo arquivo `infra/VERSION` (ex: `v0.2.11`). O `create-deploy` sempre incrementa o último número (patch) e atualiza o `backend/package.json` com a nova versão. Para alterar major ou minor, edite o `VERSION` manualmente antes de rodar o script.

## Fluxo de implantação

### 1. Copiar a pasta infra para o servidor

Copie toda a pasta `infra` para o servidor (ex: `c:\jaspi\infra`). Mantenha a estrutura de arquivos.

### 2. Configurar o ambiente

1. Edite `config.env` – ajuste caminhos, portas e nomes do IIS.
2. Para repositório privado: crie `config.secrets.env` com `GITHUB_TOKEN`.

### 3. Pré-requisitos no servidor

- **Node.js 22** – [https://nodejs.org](https://nodejs.org)
- **IIS** com os módulos:
  - **URL Rewrite** – [https://www.iis.net/downloads/microsoft/url-rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
  - **Application Request Routing (ARR)** – [https://www.iis.net/downloads/microsoft/application-request-routing](https://www.iis.net/downloads/microsoft/application-request-routing)
  - Habilitar o proxy no ARR: IIS Manager → Application Request Routing → Server Proxy Settings → **Enable proxy**
- **PM2** (gerenciador de processos Node):

  ```bash
  npm install -g pm2
  ```

- **PostgreSQL** – banco configurado e acessível. O backend usa TypeORM; configure `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` no `backend\.env` (copiado de `infra\.env.example` na primeira execução do deploy).

### 4. Executar deploy

1. **deploy-atualizar.bat** – chama o script PowerShell (`deploy-atualizar.ps1`), mais estável (evita janela fechar durante download/npm):
   - Baixa o zip do release (ou use um zip local)
   - Extrai em pasta `hub-update-vX.Y.Z` (nome da versão) e copia backend, frontend, packages
   - Copia ou cria `.env`, `web.config` e `ecosystem.config.js` se não existirem
   - Roda migrações TypeORM
   - Reinicia o backend via PM2

   Uso: `deploy-atualizar.bat` ou `deploy-atualizar.bat caminho\do\zip` ou `deploy-atualizar.bat /AUTO` (modo não interativo, saída em `deploy-atualizar.log`)

2. **iis-configurar.bat** – execute como **Administrador**:
   - Cria site IIS, pool, diretório virtual
   - Gera o `web.config` no frontend com proxy para a API

### 5. Conferir

- Acesso: `http://localhost:PORT/` (PORT = FRONTEND_PORT do config.env)
- AppJaspi: `http://localhost:PORT/appjaspi/`
- API: `http://localhost:PORT/api/` → proxy para o backend

**Acesso por IP (rede):** Para acessar de outra máquina (ex: `http://192.168.1.110:10301`), ajuste o `CORS_ORIGINS` no `backend\.env` para incluir a origem: `http://192.168.1.110:10301` ou use múltiplos separados por vírgula.

---

## O que o deploy-atualizar copia e configura

| Arquivo | Quando | O que faz |
|---------|--------|-----------|
| **backend\.env** | Não existe | Copia de `infra\.env.example` com `PORT`, `CORS_ORIGINS` e `BACKEND_URL` preenchidos conforme config.env |
| **FRONTEND_PATH\web.config** | Não existe | Gera em `FRONTEND_PATH` a partir de `web.config.template` com `{{BACKEND_URL}}` substituído |
| **ecosystem.config.js** | Não existe | Copia de `infra\ecosystem.config.js` para o PM2 gerenciar o backend |

---

## Descrição dos arquivos da pasta infra

| Arquivo | Função |
|---------|--------|
| **config.env** | Configuração principal: caminhos (BASE_PATH, APPJASPI_PATH, FRONTEND_PATH), portas (FRONTEND_PORT, BACKEND_PORT), IIS (APPPOOL_NAME, SITE_NAME, VDIR_NAME), GitHub (GITHUB_REPO, RELEASES_PATH). Usada por todos os scripts. |
| **config.secrets.env** | Secrets (GITHUB_TOKEN). Opcional; não versionar. |
| **config.secrets.env.example** | Modelo do config.secrets.env. |
| **deploy-atualizar.bat** | Chama o deploy-atualizar.ps1. Aceita caminho do zip ou baixa do GitHub. Use `/AUTO` para modo não interativo (API). |
| **deploy-atualizar.ps1** | Deploy principal: extrai zip em pasta com nome da versão, copia arquivos, cria `.env`/`web.config`/`ecosystem.config.js` se necessário, aplica migrações TypeORM, reinicia PM2. |
| **iis-configurar.bat** | Configura o IIS: pool, site, diretório virtual appjaspi, ARR proxy, gera web.config. Rodar como Administrador. |
| **web.config.template** | Modelo do web.config do frontend: regras de rewrite (proxy /api, fallback SPA). O script substitui `{{BACKEND_URL}}`. |
| **.env.example** | Modelo do `.env` do backend (PostgreSQL, JWT, etc.). Copiado com `PORT`, `CORS_ORIGINS` e `BACKEND_URL` preenchidos conforme config.env. |
| **ecosystem.config.js** | Configuração do PM2 (backend hub-backend). Copiado para BASE_PATH se não existir. |
| **create-deploy.ps1** / **create-deploy.bat** | Gera o pacote de produção (ZIP) para publicar. Solicita se já fez build, executa build se necessário, gera o zip e pergunta se deseja fazer upload para o GitHub. |
| **VERSION** | Versão atual do pacote (ex: v0.2.11). Usada pelo create-deploy. O script incrementa apenas o patch; major e minor devem ser alterados manualmente. |
| **setup-hub-user.sql** | Script SQL para criar usuário `hub_user` e permissões no PostgreSQL. |
| **fix-hub-user-permissions.sql** | Corrige permissões e cria extensão uuid-ossp no banco. |
| **reset-migrations.sql** | Remove a tabela migrations para rodar todas as migrações do zero (uso em cenários de reset). |
