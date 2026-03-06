# Atualização do Sistema pela Tela

Este documento descreve a arquitetura e a lógica para implementar e manter a funcionalidade de **atualização do sistema por meio da interface web**. A implementação foi feita no **SEJA** e replicada no **Hub**.

---

## Visão Geral

O sistema permite que usuários com permissão (admin) verifiquem se há nova versão disponível no GitHub, visualizem o histórico de alterações (CHANGELOG) e disparem a atualização. A atualização é executada por um script batch/PowerShell que baixa o release, extrai, copia arquivos, roda migrações e reinicia o PM2.

---

## Componentes Principais

### Hub

| Componente | Localização | Função |
|------------|-------------|--------|
| **Backend** | `backend/src/domains/app-version/` | APIs de versão, busca GitHub, disparo do bat |
| **Frontend** | `frontend/src/components/ChangelogModal/`, `contexts/AtualizacaoContext.tsx` | ChangelogModal, overlay "em atualização" |
| **Infra** | `infra/` | Scripts deploy-atualizar.bat e deploy-atualizar.ps1 |
| **Banco** | Tabela `companies` | Flags de atualização (empVer, empAttIs, empAttDisp, empAttDtaHorIni, empAttDtaHorFim) |

### SEJA

| Componente | Localização | Função |
|------------|-------------|--------|
| **Backend** | `backend/src/empresa/` | APIs de versão, busca GitHub, disparo do bat |
| **Frontend** | `frontend/src/` | Dashboard, ChangelogModal, tela "em atualização" |
| **Infra** | `infra/` | Scripts deploy-atualizar.bat e deploy-atualizar.ps1 |
| **Banco** | Tabela `Empresa` | Flags de atualização (EmpAttIs, EmpAttDisp, EmpAttDtaHorIni, EmpAttDtaHorFim) |

---

## 1. Listagem das Alterações (CHANGELOG)

### Onde está
- **Frontend:** `ChangelogModal` (`frontend/src/components/ChangelogModal/ChangelogModal.tsx`)
- **Fonte:** Arquivo estático `CHANGELOG.md` na raiz do frontend (servido pelo build)
- **Acesso:** Botão "Versão atual" no Dashboard → modal com histórico em Markdown

### Lógica
- O modal carrega `CHANGELOG.md` via `fetch(changelogUrl)` onde `changelogUrl = BASE_URL + '/CHANGELOG.md'`
- O conteúdo é renderizado com `ReactMarkdown`
- O CHANGELOG é um arquivo estático versionado no repositório; não vem do banco nem da API

---

## 2. Pesquisa de Versão

### Onde está
- **Frontend:** `ChangelogModal` — botão "Pesquisar versão"
- **Backend:** `POST /empresa/buscar-atualizacoes`

### Lógica
1. Usuário clica em "Pesquisar versão"
2. Frontend chama `buscarAtualizacoes(empCod)`
3. Backend consulta `https://api.github.com/repos/{GITHUB_REPO}/releases/latest`
4. Compara `tag_name` da release com `EmpVer` da empresa (versão atual)
5. Se houver versão mais nova:
   - Atualiza `Empresa`: `EmpAttIs = true`, `EmpAttDisp = tag_name`
6. Retorna: `{ temNova, versaoAtual, versaoDisponivel, mensagem }`

### Variáveis de ambiente (backend `.env`)
- `GITHUB_REPO` — ex: `jaspisistemas/seja`
- `GITHUB_TOKEN` — obrigatório se o repositório for privado

---

## 3. Permissão de Atualização

### Regras
- **Perfil:** Apenas `SUPORTE_USUARIOS` (2) ou `SUPORTE_SISTEMA` (3) podem buscar e executar atualização
- **Empresa:** A empresa ativa deve estar na lista `EMPRESA_ATUALIZACAO_EMPCOD`

### Onde está
- **Backend:** `empresa.service.ts` → `empresaPodeAtualizarPublic(empCod, prfTip)`
- **Controller:** `empresa.controller.ts` — valida perfil e empresa antes de `buscar-atualizacoes` e `executar-atualizacao`

### Lógica
```typescript
// prfTip: 2 = SUPORTE_USUARIOS, 3 = SUPORTE_SISTEMA
if (prfTip !== 2 && prfTip !== 3) return false;
const permitidos = EMPRESA_ATUALIZACAO_EMPCOD ? split(EMPRESA_ATUALIZACAO_EMPCOD) : [1];
return permitidos.includes(empCod);
```

---

## 4. Empresas que Têm Permissão para Atualizar

### Configuração
- **Variável:** `EMPRESA_ATUALIZACAO_EMPCOD` no `backend/.env`
- **Formato:** Lista de `empCod` separados por vírgula
- **Exemplos:**
  - `EMPRESA_ATUALIZACAO_EMPCOD=1` — apenas empresa 1
  - `EMPRESA_ATUALIZACAO_EMPCOD=1,2,3` — empresas 1, 2 e 3
- **Padrão:** Se não definido, usa `[1]`

### Onde configurar
- `backend/.env` (não versionar)
- `.env.example` documenta a variável

---

## 5. Disparo do BAT

### Onde está
- **Backend:** `empresa.service.ts` → `executarAtualizacao(payload, empCod)`
- **Infra:** `infra/deploy-atualizar.bat` → chama `deploy-atualizar.ps1`

### Fluxo
1. Usuário clica em "Atualizar agora" (Dashboard ou ChangelogModal)
2. Frontend chama `POST /empresa/executar-atualizacao`
3. Backend:
   - Grava `EmpAttDtaHorIni = now()`, `EmpAttDtaHorFim = null` na empresa
   - Resolve `INFRA_PATH` do `.env`
   - Verifica se existe `deploy-atualizar.bat` em `INFRA_PATH`
   - Executa o bat com parâmetro `/AUTO` em processo separado (detached)
4. O bat chama o PowerShell que:
   - Baixa o zip do GitHub (ou usa zip local)
   - Para PM2 (backend, importador)
   - Extrai, copia arquivos, roda `npm install`, migrações Prisma
   - Reinicia PM2
   - Ao final, o backend (ao subir) detecta fim da atualização e preenche `EmpAttDtaHorFim`

### Variáveis de ambiente (backend `.env`)
- `INFRA_PATH` — caminho absoluto da pasta `infra` no servidor  
  Ex: `D:\IMPLANTACAO\SEJA\infra`

### Detalhes técnicos
- O script é executado com `spawn` em modo `detached` e `stdio: 'ignore'`
- Em Windows: `cmd.exe /c start "" /MIN "path\to\deploy-atualizar.bat" /AUTO`
- O parâmetro `/AUTO` faz o PowerShell rodar em modo não interativo (baixa do GitHub automaticamente)

---

## 6. Tela de "Em Processo de Atualização"

### Onde está
- **Context:** `AtualizacaoContext` (`frontend/src/contexts/AtualizacaoContext.tsx`)
- **Provider:** Envolve o app em `DashboardLayout`
- **Overlay:** Modal fullscreen com spinner e barra de progresso

### Lógica
1. **Ao montar o app:** Chama `GET /empresa/status-atualizacao` (endpoint público)
2. **Resposta:** `{ concluida: boolean }`
   - `concluida: false` → existe empresa com `EmpAttDtaHorIni` preenchido e `EmpAttDtaHorFim` nulo
   - `concluida: true` → não há atualização em andamento
3. Se `concluida: false`:
   - Exibe overlay "Atualização em andamento"
   - Inicia polling a cada 15 segundos em `GET /empresa/status-atualizacao`
   - Barra de progresso animada (apenas visual, não reflete progresso real do script)
4. Quando `concluida: true`:
   - Para o polling
   - Esconde o overlay
   - Faz `window.location.reload()` para recarregar o app atualizado

### Quando o backend marca como concluída
- No `onModuleInit` do `EmpresaService`, ao subir o backend:
  - Busca empresas com `EmpAttDtaHorIni` preenchido e `EmpAttDtaHorFim` nulo
  - Para cada uma: preenche `EmpAttDtaHorFim = now()`, `EmpVer = EmpAttDisp`, `EmpAttIs = false`, `EmpAttDisp = null`
  - Assim, na próxima chamada de `status-atualizacao`, retorna `concluida: true`

---

## Diagrama de Fluxo (Resumido)

```
[Usuário] → Dashboard/ChangelogModal
    ↓
[Pesquisar versão] → POST /empresa/buscar-atualizacoes
    ↓ (GitHub API)
[temNova?] → Sim: exibe "Atualizar agora"
    ↓
[Atualizar agora] → POST /empresa/executar-atualizacao
    ↓
[Backend] → spawn(deploy-atualizar.bat /AUTO)
    ↓
[Script] → Baixa zip, extrai, copia, migra, reinicia PM2
    ↓
[Backend sobe] → onModuleInit marca EmpAttDtaHorFim
    ↓
[Frontend polling] → GET /empresa/status-atualizacao
    ↓ (concluida: true)
[Reload] → App atualizado
```

---

## Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/empresa/versao-sistema` | Não | Versão atual (EmpVer da 1ª empresa) |
| GET | `/empresa/status-atualizacao` | Não | `{ concluida }` — se há atualização em andamento |
| GET | `/empresa/versao-nova-status` | Sim | `{ hasNovaVersao, podeAtualizar }` |
| POST | `/empresa/buscar-atualizacoes` | Sim | Busca no GitHub, atualiza EmpAttIs/EmpAttDisp |
| POST | `/empresa/limpar-nova-versao` | Sim | Limpa aviso de nova versão |
| POST | `/empresa/executar-atualizacao` | Sim | Dispara deploy-atualizar.bat |

---

## Campos da Tabela Empresa (Atualização)

Os campos abaixo existem na tabela `Empresa` (SEJA) e na tabela `companies` (Hub):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| empVer | string | Versão atual instalada |
| empAttIs | boolean | Há nova versão disponível (aviso) |
| empAttDisp | string | Tag da versão disponível (ex: v2.0.39) |
| empAttDtaHorIni | datetime | Início da atualização (quando disparou o bat) |
| empAttDtaHorFim | datetime | Fim da atualização (preenchido quando backend sobe após deploy) |

No Hub, usa-se a primeira empresa (ordenada por `createdAt`) para armazenar o status da atualização.

---

## Processos Necessários para Implementar/Manter

### 1. Configuração no servidor
- [ ] Definir `INFRA_PATH` no `backend/.env` com o caminho da pasta `infra` no servidor
- [ ] Definir `GITHUB_REPO` e `GITHUB_TOKEN` (se repositório privado)
- [ ] Definir `EMPRESA_ATUALIZACAO_EMPCOD` com as empresas que podem atualizar (ex: `1` ou `1,2,3`)
- [ ] Garantir que a pasta `infra` exista no servidor com `deploy-atualizar.bat` e `deploy-atualizar.ps1`
- [ ] Verificar que o `config.env` e `config.secrets.env` da infra estão corretos (BASE_PATH, GITHUB_REPO, etc.)

### 2. Manutenção do CHANGELOG
- [ ] Atualizar `CHANGELOG.md` a cada release com as alterações
- [ ] O arquivo é servido estático pelo frontend; incluir no build

### 3. Releases no GitHub
- [ ] Criar release com tag (ex: `v2.0.39`) no repositório
- [ ] Anexar o ZIP do pacote de produção (gerado por `create-deploy.ps1`)

### 4. Testes
- [ ] Testar "Pesquisar versão" com perfil suporte e empresa permitida
- [ ] Testar "Atualizar agora" em ambiente de homologação
- [ ] Verificar que a tela "em atualização" aparece e some após o deploy
- [ ] Verificar que usuários sem permissão não veem o botão e recebem 403 ao chamar a API

### 5. Segurança
- [ ] Nunca expor `GITHUB_TOKEN` no frontend
- [ ] Manter `EMPRESA_ATUALIZACAO_EMPCOD` restrito às empresas de suporte/homologação
- [ ] Validar sempre perfil e empresa no backend antes de executar atualização

---

## Hub — Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/app-version/versao-sistema` | Não | Versão atual |
| GET | `/app-version/status-atualizacao` | Não | `{ concluida }` — se há atualização em andamento |
| GET | `/app-version/versao-nova-status` | Sim | `{ hasNovaVersao, versaoDisponivel, podeAtualizar }` |
| POST | `/app-version/buscar-atualizacoes` | Sim | Busca no GitHub, atualiza flags |
| POST | `/app-version/executar-atualizacao` | Sim | Dispara deploy-atualizar.bat |

### Hub — Permissão

- Apenas usuários com **role admin** na empresa podem buscar e executar atualização
- Opcional: `COMPANY_IDS_ATUALIZACAO` no `.env` — lista de IDs de empresas permitidas (separados por vírgula). Se não definido, qualquer admin pode atualizar

---

## Referências

- `backend/.env` — variáveis INFRA_PATH, GITHUB_REPO, GITHUB_TOKEN, COMPANY_IDS_ATUALIZACAO (Hub) ou EMPRESA_ATUALIZACAO_EMPCOD (SEJA)
- `infra/README.md` — documentação da infraestrutura de deploy
- `infra/deploy-atualizar.ps1` — script principal de atualização
- SEJA: `packages/shared` — enum `TipoPerfil` (SUPORTE_USUARIOS=2, SUPORTE_SISTEMA=3)
