# Como Usar o Projeto Jaspi Hub

## Iniciar Tudo em Uma Linha

```powershell
powershell -ExecutionPolicy Bypass -File "C:\hub\start-all.ps1"
```

Ou simplesmente na pasta C:\hub:

```powershell
.\start-all.ps1
```

---

## O Que Inicia

1. **Redis** (se Docker estiver instalado)
   - Fila de jobs assíncronos
   - Porta: 6379

2. **Backend NestJS**
   - API REST
   - ngrok tunnel: https://uneducated-georgiann-personifiant.ngrok-free.dev

3. **Frontend React**
   - Vite dev server
   - http://localhost:5173

---

## Comandos Úteis

Depois de executar o script, você pode usar:

```powershell
# Ver status dos jobs
Get-Job

# Ver logs do backend
Get-Job -Name backend | Receive-Job -Keep

# Ver logs do frontend
Get-Job -Name frontend | Receive-Job -Keep

# Parar um job específico
Stop-Job -Name backend

# Parar tudo
Get-Job | Stop-Job

# Remover jobs finalizados
Remove-Job -State Completed
```

---

## URLs de Acesso

**Desenvolvimento Local:**
- **Frontend**: http://localhost:5173
- **Backend**: https://uneducated-georgiann-personifiant.ngrok-free.dev
- **Redis**: localhost:6379

**Compartilhado (via Tunnels):**
- **Frontend**: https://panel-joshua-norfolk-molecular.trycloudflare.com
- **Backend**: https://uneducated-georgiann-personifiant.ngrok-free.dev

---

## Compartilhar Frontend (Cloudflare Tunnel)

Para expor o frontend publicamente via Cloudflare (igual ao backend com ngrok):

1. **Instale Cloudflare CLI:**
   ```bash
   # Windows
   choco install cloudflare-cli
   # ou download direto em: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
   ```

2. **Execute cloudflared:**
   ```powershell
   cloudflared tunnel --url http://localhost:5173
   ```

3. **Copie a URL gerada** (algo como `https://panel-joshua-norfolk-molecular.trycloudflare.com`)

4. **Atualize CORS no backend** se necessário em `backend/src/main.ts`

---

## Testes

```powershell
cd C:\hub
node test-integration.js
```

Resultado esperado: 7/8 testes passando

---

## Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` com:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=seu_password
DB_NAME=jaspi_hub

REDIS_HOST=localhost
REDIS_PORT=6379

ML_APP_ID=seu_app_id
ML_CLIENT_SECRET=seu_client_secret
ML_REDIRECT_URI=https://seu_ngrok_url/marketplace/mercadolivre/callback

JWT_SECRET=sua_chave_secreta_super_segura
```

---

## Documentação

- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Status atual do projeto
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Resumo das implementações
- [readme.md](readme.md) - README principal

---

**Desenvolvido com ❤️ usando NestJS + React**

