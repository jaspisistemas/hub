# Suporte para Múltiplas Lojas Mercado Livre

## Visão Geral

Este sistema permite que um usuário/empresa do hub conecte múltiplas contas do Mercado Livre, mantendo os tokens isolados e seguros.

## Fluxo de Autenticação OAuth

### 1. Conectar Nova Loja (Frontend)

```
Usuario clica em "Conecte sua loja"
    ↓
Frontend limpa cookies do ML
    ↓
Frontend redireciona para `/marketplace/mercadolivre/auth?userId={userId}&t={timestamp}`
    ↓
Backend retorna URL de autorização do ML com `display=popup`
    ↓
Usuario é levado para tela de login do ML (novo contexto)
    ↓
Usuario aprova permissões
    ↓
ML retorna code para `/marketplace/mercadolivre/callback?code={code}&state={userId}`
```

### 2. Processar Autorização (Backend)

```
Backend recebe code + state (userId)
    ↓
Backend troca code por access_token/refresh_token via API do ML
    ↓
Backend busca informações do usuário em GET /users/me
    ↓
Backend chama findOrCreateMercadoLivreStore():
    - Verifica se mlUserId já existe
    - Se outro usuário tem: rejeita com erro
    - Se mesmo usuário tem: atualiza tokens
    - Se novo: cria novo registro
    ↓
Backend salva tokens isolados neste registro
    ↓
Backend redireciona para `/lojas?ml_auth=success&store_id={storeId}`
```

## Modelo de Dados

### Tabela: stores

```
id (UUID) - Identificador único
name (varchar) - Ex: "MinhaLojaTop - 2615459691"
marketplace (varchar) - "MercadoLivre"
status (varchar) - "active", "inactive", "disconnected"
userId (UUID FK) - Usuário do hub que conectou
mlUserId (varchar) - ID da conta ML
mlNickname (varchar) - Nome da loja no ML (Ex: "MinhaLojaTop")
mlAccessToken (varchar) - Token de acesso (renovado quando expira)
mlRefreshToken (varchar) - Token para renovação
mlTokenExpiresAt (bigint) - Timestamp de expiração
mlLastSyncAt (bigint) - Timestamp da última sincronização
status (varchar) - Estado da conexão
createdAt (timestamp) - Quando foi conectado
updatedAt (timestamp) - Última atualização
```

### Relacionamentos

- **Um usuário do hub** → **Múltiplas lojas ML**
- Cada loja tem seu próprio `mlUserId` (único na tabela)
- Cada loja tem seus próprios tokens isolados

## Operações Principais

### ✅ Conectar Nova Loja

**Endpoint**: `GET /marketplace/mercadolivre/auth?userId={userId}&t={timestamp}`

- Valida userId
- Retorna URL OAuth com `display=popup` para forçar novo contexto
- Adiciona `nonce` e `t` para evitar cache

**Callback**: `GET /marketplace/mercadolivre/callback?code={code}&state={userId}`

- Troca code por tokens
- Busca mlNickname via API do ML
- Chama `findOrCreateMercadoLivreStore(mlUserId, userId, tokens, nickname)`
- **Garante que cada conta ML é um registro separado**

### ✅ Listar Lojas Conectadas

**Endpoint**: `GET /stores/marketplace/mercadolivre`

- Retorna todas as lojas ML do usuário autenticado
- Ordenado por data de criação (mais recente primeiro)
- Inclui status de conexão

### ✅ Desconectar Loja

**Endpoint**: `POST /stores/{storeId}/disconnect`

- Valida que o usuário é dono da loja
- Marca como "disconnected"
- Limpa tokens (`mlAccessToken`, `mlRefreshToken`, `mlTokenExpiresAt` → null)
- **Não deleta o registro** (permite histórico)
- Usuario pode reconectar a mesma conta depois

### ❌ Não Fazer

- Sobrescrever tokens de loja existente quando conectar nova conta
- Compartilhar token entre múltiplas lojas
- Usar token expirado sem renovar
- Deletar registro quando desconectar (marcar como desconectado)

## Isolamento de Tokens

### Garantias de Segurança

1. **Cada store tem seus próprios tokens**
   - Nunca compartilhar token entre stores
   - Cada sync usa tokens do store específico

2. **Validação de Propriedade**
   - Sempre verificar userId ao acessar store
   - Impedir acesso cruzado entre usuários

3. **Renovação de Token**
   - Se token expirado (mlTokenExpiresAt < Date.now())
   - Usar mlRefreshToken para renovar
   - Salvar novos tokens sem afetar outras lojas

4. **Revogação**
   - Se API retorna 401 Unauthorized
   - Marcar store como "disconnected"
   - Não tentar renovar (usuário reconectará se quiser)

## Fluxo de Sincronização

Ao sincronizar produtos ou pedidos:

```typescript
// Ao sincronizar SEMPRE especificar o storeId
async syncProductsForStore(storeId: string) {
  const store = await storesService.findOne(storeId);
  
  // Validar que tokens existem
  if (!store.mlAccessToken) {
    throw new Error('Loja não conectada');
  }
  
  // Validar que token não expirou
  if (store.mlTokenExpiresAt! < Date.now()) {
    // Renovar token
    const newTokens = await refreshToken(store.mlRefreshToken!);
    await storesService.updateMercadoLivreTokens(storeId, newTokens);
  }
  
  // Usar APENAS os tokens deste store
  const products = await mlApi.getProducts(store.mlAccessToken!);
  
  // Atualizar timestamp de sincronização
  await storesService.update(storeId, {
    mlLastSyncAt: Date.now(),
  });
}
```

## Tratamento de Erros

### Erro: "Conta ML já conectada em outro usuário"

```
Mensagem: "Esta conta do Mercado Livre já está conectada em outra conta do sistema"
Causa: mlUserId já existe com userId diferente
Solução: Usuário deve desconectar de outra conta primeiro ou usar conta diferente
```

### Erro: 401 Unauthorized da API do ML

```
Causa: Token expirou ou foi revogado
Ação: Tentar renovar com refresh token
Se falhar: Marcar store como "disconnected"
UI: Mostrar botão "Reconectar" para o usuário
```

### Erro: Token não disponível

```
Causa: Store desconectado (mlAccessToken = null)
UI: Mostrar aviso "Desconectado"
Ação: Mostrar botão "Conectar" para reconectar
```

## UI/UX

### Página de Lojas

- Listar todas as lojas conectadas
- Para cada loja mostrar:
  - Nome (nickname + ID)
  - Status (ativo/desconectado)
  - Última sincronização
  - Ações: Editar, Desconectar

### Botão "Conecte sua loja"

- Sempre visível (position: fixed)
- Redireciona para OAuth
- Funciona mesmo com lojas conectadas

### Desconexão

- Confirmar com usuário antes
- Não deleta dados históricos
- Usuário pode reconectar depois
- Se reconectar, traz dados históricos de volta

## Exemplo de Uso

### Conectar 3 contas diferentes

```
1. Usuario A clica "Conectar"
   → Login com conta ML: "LojaA"
   → Store criada: "LojaA - 123456"

2. Usuario A clica "Conectar" novamente
   → Login com conta ML: "LojaB"
   → Store criada: "LojaB - 789012"

3. Usuario A clica "Conectar" novamente
   → Login com conta ML: "LojaC"
   → Store criada: "LojaC - 345678"

Resultado: 3 stores na página, cada uma com seus próprios tokens
```

## Código Relevante

- **Backend**: `src/domains/stores/stores.service.ts` → `findOrCreateMercadoLivreStore()`
- **Backend**: `src/integrations/marketplace/marketplace.controller.ts` → OAuth endpoints
- **Frontend**: `src/features/stores/StoresPage.tsx` → UI das lojas
- **Frontend**: `src/services/storesService.ts` → Chamadas de API
