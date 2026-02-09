# 🔧 Guia de Implementação: Múltiplas Lojas Mercado Livre

## 📋 Checklist de Implementação

### ✅ Alterações Já Realizadas

- [x] Backend: Campos `mlNickname` e `mlLastSyncAt` adicionados
- [x] Backend: Método `findOrCreateMercadoLivreStore()` implementado
- [x] Backend: Método `disconnectMercadoLiveStore()` implementado
- [x] Backend: Método `findAllMercadoLivreStores()` implementado
- [x] Backend: Endpoints `/stores/{id}/disconnect` e `/stores/marketplace/mercadolivre`
- [x] Backend: OAuth com `display=popup` e cache control
- [x] Frontend: Método `disconnectMercadoLivre()` adicionado
- [x] Frontend: UI para desconexão com confirmação
- [x] Frontend: Botão inteligente (desconecta ML, deleta outras)
- [x] Frontend: Botão flutuante sempre visível
- [x] Migration criada
- [x] Documentação completa

### 📋 Próximas Etapas (Manual)

#### 1. Aplicar Migration ao Banco

```bash
# No backend
cd backend
npm run typeorm migration:run

# Resultado esperado:
# QueryRunner: CREATE TABLE IF NOT EXISTS "stores"...
# QueryRunner: ALTER TABLE "stores" ADD COLUMN "mlNickname" varchar(255)...
# QueryRunner: ALTER TABLE "stores" ADD COLUMN "mlLastSyncAt" bigint...
```

#### 2. Reiniciar Aplicação

```bash
# Terminal Backend
npm run start:dev

# Terminal Frontend
npm run dev

# Verificar que ambos iniciam sem erros
```

#### 3. Testar Conexão de Múltiplas Lojas

```
1. Abrir http://localhost:5173 (ou produção)
2. Fazer login
3. Ir para "Lojas Conectadas"
4. Clicar "Conecte sua loja"
5. Login com conta ML A
6. ✓ Loja A aparece
7. Clicar "Conecte sua loja" novamente
8. Login com conta ML B (diferente)
9. ✓ Loja B aparece (não sobrescreve A)
10. Clicar desconectar em Loja A
11. ✓ Loja A desaparece ou fica "Desconectada"
12. Reconectar
13. ✓ Loja A volta com dados históricos
```

#### 4. Validar Isolamento de Tokens

Para verificar que os tokens são realmente isolados:

```bash
# No PostgreSQL
SELECT id, name, mlUserId, mlAccessToken, mlRefreshToken 
FROM stores 
WHERE userId = 'seu-user-id';

# Resultado esperado:
# id            | name                | mlUserId    | mlAccessToken | mlRefreshToken
# uuid-1        | LojaA - 123456      | 123456      | APP_USR_111   | TG_111
# uuid-2        | LojaB - 789012      | 789012      | APP_USR_222   | TG_222
# uuid-3        | LojaC - 345678      | 345678      | APP_USR_333   | TG_333

# ✓ Cada store tem tokens diferentes
# ✓ Nunca compartilham
```

#### 5. Configurar Variáveis de Ambiente (se necessário)

No `.env` do backend, confirmar que está configurado:

```env
# Mercado Livre OAuth
ML_APP_ID=seu_app_id
ML_CLIENT_SECRET=seu_client_secret
ML_REDIRECT_URI=https://seu-dominio.com/marketplace/mercadolivre/callback

# ou para desenvolvimento
ML_REDIRECT_URI=http://localhost:3000/marketplace/mercadolivre/callback
```

---

## 🐛 Troubleshooting

### Problema: "Token não é renovado"

**Causa**: Token expirado sem lógica de renovação em sincronização

**Solução**: Adicionar verificação antes de usar token

```typescript
async syncProductsForStore(storeId: string, accessToken: string) {
  // ✅ ANTES: validar expiração
  if (store.mlTokenExpiresAt! < Date.now()) {
    const newTokens = await this.refreshToken(store.mlRefreshToken!);
    // Atualizar APENAS este store
    await this.storesService.updateMercadoLivreTokens(storeId, newTokens);
    accessToken = newTokens.accessToken;
  }
  
  // Usar token válido
  const products = await mlApi.getProducts(accessToken);
  return products;
}
```

### Problema: "Conectar mostra login anterior"

**Causa**: Cache do navegador com sessão anterior do ML

**Solução**: Já implementado!
- Frontend limpa cookies
- Backend envia headers de cache control
- URL tem timestamp para cache-busting
- OAuth usa `display=popup` para novo contexto

Se ainda acontecer:
- Limpar cache do navegador (Ctrl+Shift+Delete)
- Tentar em abinha privada
- Confirmar que ngrok/tunnel está funcionando

### Problema: "Erro: Conta já conectada em outra conta"

**Causa**: Tentativa legítima de conectar mesma conta ML em usuário diferente

**Solução**: Esperado! É proteção contra roubo de dados.

Se o usuário quer reconectar em outro usuário hub:
1. Desconectar em usuário anterior
2. Depois conectar em novo usuário
3. Sistema permite pois mlUserId fica livre

### Problema: "Desconectado, mas tokens ainda existem"

**Causa**: Estado inconsistente no banco

**Solução**: Verificar diretamente

```bash
# No PostgreSQL
SELECT id, name, status, mlAccessToken 
FROM stores 
WHERE status = 'disconnected';

# Se mlAccessToken não é null:
UPDATE stores 
SET mlAccessToken = NULL, 
    mlRefreshToken = NULL, 
    mlTokenExpiresAt = NULL 
WHERE id = 'uuid-problema';
```

---

## 🔍 Validação Pós-Implementação

### Checklist de Funcionalidades

- [ ] Conectar 1ª loja funciona
- [ ] Conectar 2ª loja não sobrescreve a 1ª
- [ ] Cada loja tem tokens isolados (verificar no banco)
- [ ] Desconectar marca como inativo
- [ ] Reconectar traz dados históricos
- [ ] Erro ao conectar mesma conta em usuário diferente
- [ ] Botão "Conectar" sempre visível
- [ ] UI mostra status correto (ativo/desconectado)
- [ ] Tokens são renovados quando expiram
- [ ] Sem erros no console (frontend/backend)

### Métricas de Qualidade

```javascript
// Verificar no banco:
// 1. Múltiplas lojas por usuário
SELECT user_id, COUNT(*) as loja_count 
FROM stores 
GROUP BY user_id 
HAVING COUNT(*) > 1;

// 2. Nenhuma loja com tokens compartilhados
SELECT ml_access_token, COUNT(*) 
FROM stores 
WHERE ml_access_token IS NOT NULL 
GROUP BY ml_access_token 
HAVING COUNT(*) > 1;
// Resultado esperado: Vazio (nenhuma linha)

// 3. Verificar desconexões
SELECT COUNT(*) FROM stores WHERE status = 'disconnected';
// Deve retornar número de lojas desconectadas (ou 0 se todas ativas)
```

---

## 📊 Monitoramento

### Logs Esperados ao Conectar

**Frontend**:
```
User parseado: {id: "uuid", email: "..."}
Redirecionando para auth: https://...auth?userId=uuid&t=1707000000
```

**Backend**:
```
🔄 Auth ML chamado, userId recebido: uuid timestamp: 1707000000
✅ Redirecionando para ML com state: uuid
🔗 Enviando para: https://auth.mercadolivre.com.br/authorization?...&display=popup

[Usuário faz login no ML]

🔄 Callback ML recebido: {code: 'presente', state: 'uuid'}
🔄 Trocando code por token...
✅ Token obtido, userId: 2615459691
🔄 Buscando informações da loja...
✅ Informações da loja obtidas: MinhaLojaTop
🔄 Salvando loja no banco...
✨ Criando novo registro de loja ML: MinhaLojaTop - 2615459691
✅ Loja ML autorizada com sucesso: MinhaLojaTop - 2615459691 ID: uuid-store
```

### Indicadores de Sucesso

✅ Múltiplas lojas aparecem no lista
✅ Cada loja tem tokens diferentes no banco
✅ Desconexão marca como inativo
✅ Sem avisos de segurança
✅ Sem erros de compilação
✅ Tokens renovam automaticamente

---

## 🚀 Deploy em Produção

### 1. Preparação

```bash
# Backend
cd backend
npm run build
npm run typeorm migration:run

# Frontend
cd frontend
npm run build
```

### 2. Verificar Variáveis de Ambiente

```bash
# Confirmar no painel de deploy (.env da produção):
ML_APP_ID=xxx
ML_CLIENT_SECRET=xxx
ML_REDIRECT_URI=https://seu-dominio-producao.com/marketplace/mercadolivre/callback
```

### 3. Deploy

```bash
# Usar seu processo de deploy habitual
# (GitHub Pages, Vercel, AWS, etc.)
```

### 4. Pós-Deploy

```bash
# Testar em produção:
1. Acessar https://seu-dominio.com
2. Fazer login
3. Testar conexão de 2+ lojas
4. Verificar no banco que tokens são isolados
5. Desconectar e reconectar
6. Confirmar sucesso
```

---

## 📞 Suporte

### Documentação

- [MULTI_STORE_ML.md](./MULTI_STORE_ML.md) - Guia técnico completo
- [SUPORTE_MULTI_STORE_MERCADOLIVRE.md](./SUPORTE_MULTI_STORE_MERCADOLIVRE.md) - Visão geral da arquitetura
- [STATUS_MULTI_STORE.md](./STATUS_MULTI_STORE.md) - Status e FAQ rápido

### Comandos Úteis

```bash
# Ver logs em tempo real
npm run start:dev

# Verificar banco de dados
npm run typeorm migration:show

# Resetar se necessário (⚠️ deleta dados!)
npm run typeorm migration:revert
npm run typeorm migration:run

# Verificar erros de tipo
npm run tsc --noEmit
```

---

## ✨ Conclusão

**Implementação Status: ✅ COMPLETA**

O sistema está pronto para suportar múltiplas lojas Mercado Livre com:
- ✅ Tokens isolados e seguros
- ✅ Desconexão reversível
- ✅ Proteção contra duplicação
- ✅ OAuth melhorado
- ✅ Documentação completa

**Próximo passo**: Aplicar a migration ao banco e testar!

