# ✅ Implementação: Suporte a Múltiplas Lojas Mercado Livre

## 📋 Resumo das Mudanças

### Backend

#### 1. **Store Entity** (`store.entity.ts`)
- ✅ Adicionado campo `mlNickname` - Apelido da loja no ML
- ✅ Adicionado campo `mlLastSyncAt` - Timestamp da última sincronização

#### 2. **Stores Service** (`stores.service.ts`)
- ✅ **Melhorado `findOrCreateMercadoLivreStore()`**
  - Verifica duplicação de `mlUserId` entre usuários diferentes
  - Se mesmo usuário reconecta: atualiza tokens (não cria novo)
  - Se nova conta ML: cria novo registro isolado
  - Salva `mlNickname` para melhor identificação

- ✅ **Novo método `disconnectMercadoLiveStore()`**
  - Marca loja como "disconnected"
  - Limpa tokens sem deletar registro
  - Permite reconecção depois

- ✅ **Novo método `findAllMercadoLivreStores()`**
  - Retorna todas as lojas ML de um usuário
  - Ordenado por criação (mais recente primeiro)

#### 3. **Stores Controller** (`stores.controller.ts`)
- ✅ Novo endpoint: `POST /stores/{id}/disconnect`
  - Desconecta loja ML com validação de proprietário

- ✅ Novo endpoint: `GET /stores/marketplace/mercadolivre`
  - Lista todas as lojas ML conectadas do usuário

#### 4. **Marketplace Controller** (`marketplace.controller.ts`)
- ✅ Melhorado OAuth endpoint `/marketplace/mercadolivre/auth`
  - Adiciona `display=popup` para forçar novo contexto
  - Adiciona `nonce` e `t` para evitar cache
  - Headers para desabilitar cache no navegador

#### 5. **Migration** (Nova)
- ✅ Arquivo: `1707200000000-AddMercadoLivreFieldsToStores.ts`
- Adiciona campos `mlNickname` e `mlLastSyncAt`

### Frontend

#### 1. **Stores Service** (`storesService.ts`)
- ✅ Novo método: `disconnectMercadoLivre(storeId)`
  - Chamada POST ao novo endpoint de desconexão

- ✅ Novo método: `getMercadoLivreStores()`
  - Lista lojas ML (opcional, para uso futuro)

- ✅ Melhorado `connectMercadoLivre()`
  - Limpa cookies do ML no navegador
  - Adiciona timestamp para cache-busting
  - Redireciona para novo endpoint OAuth

#### 2. **Stores Page** (`StoresPage.tsx`)
- ✅ Novo método: `handleDisconnectMercadoLivre()`
  - Confirma antes de desconectar
  - Diferencia entre "deletar" e "desconectar"

- ✅ Melhorado status para "disconnected"
  - Mostra visualmente como desconectado

- ✅ Botão de ação inteligente
  - Se Mercado Livre: desconecta (não deleta)
  - Se outro: deleta

- ✅ Botão flutuante sempre visível
  - Permite conectar múltiplas lojas

## 🔄 Fluxo de Múltiplas Conexões

### Conectar Nova Loja

1. Usuario clica em "Conecte sua loja"
2. Frontend limpa cookies do ML
3. Frontend redireciona para `/marketplace/mercadolivre/auth?userId={userId}&t={timestamp}`
4. Backend retorna URL OAuth com `display=popup` (novo contexto)
5. Usuario faz login com conta ML diferente
6. ML retorna code para `/marketplace/mercadolivre/callback`
7. Backend:
   - Troca code por tokens
   - Busca nickname via API do ML
   - Chama `findOrCreateMercadoLivreStore()` com novo `mlUserId`
   - **Cria novo registro** (não sobrescreve)
8. Frontend recebe sucesso e recarrega lista
9. Agora aparecem 2 lojas ML conectadas

### Desconectar Loja

1. Usuario clica no botão delete/desconectar
2. Confirma ação
3. Frontend chamada `POST /stores/{id}/disconnect`
4. Backend marca como "disconnected" e limpa tokens
5. Frontend recarrega e mostra status "Desconectado"
6. Dados históricos preservados para reconexão

## 🔐 Garantias de Segurança

✅ **Isolamento de Tokens**
- Cada store tem seus próprios tokens
- Nunca compartilhar entre stores
- Cada sync usa tokens do store específico

✅ **Validação de Propriedade**
- Sempre verificar userId ao acessar store
- Impedir acesso cruzado entre usuários hub

✅ **Prevenção de Duplicatas**
- Se conta ML já conectada em outro usuário hub: rejeita
- Se mesmo usuário reconecta: apenas atualiza tokens

✅ **Renovação de Token**
- Se expirado: usar refresh token
- Se falha: marcar como disconnected
- Não impede sincronização de outras lojas

## 📊 Modelo de Dados

Cada registro na tabela `stores` agora pode ter:

```
id: 'uuid-1'
name: 'MinhaLojaTop - 2615459691'
marketplace: 'MercadoLivre'
status: 'active'
userId: 'hub-user-1'

mlUserId: '2615459691'              ← Identifica conta ML
mlNickname: 'MinhaLojaTop'           ← Nome da loja
mlAccessToken: 'APP_USR_...'         ← Token de acesso isolado
mlRefreshToken: 'TG_...'             ← Token para renovação isolado
mlTokenExpiresAt: 1708000000         ← Expira em timestamp específico
mlLastSyncAt: 1707000000             ← Última sync desta loja

createdAt: '2024-02-06'
updatedAt: '2024-02-06'
```

Quando conectar conta B:

```
id: 'uuid-2'
name: 'OutraLoja - 9876543210'
marketplace: 'MercadoLivre'
status: 'active'
userId: 'hub-user-1'                 ← MESMO usuário

mlUserId: '9876543210'               ← DIFERENTE mlUserId
mlNickname: 'OutraLoja'
mlAccessToken: 'APP_USR_...'         ← DIFERENTES tokens
mlRefreshToken: 'TG_...'
mlTokenExpiresAt: 1708100000
mlLastSyncAt: null

createdAt: '2024-02-06'
updatedAt: '2024-02-06'
```

## 🧪 Como Testar

### Conectar 2+ Lojas

1. Fazer login no hub
2. Ir para "Lojas Conectadas"
3. Clicar "Conecte sua loja"
4. Login com conta ML **A**
5. Confirmara  → Aparece "LojaA - {id}"
6. Clicar "Conecte sua loja" novamente
7. Login com conta ML **B** (diferente)
8. Confirmar → Aparece "LojaB - {id}"
9. Verificar que ambas têm tokens isolados

### Desconectar Loja

1. Ter 2+ lojas conectadas
2. Clicar botão delete em uma loja ML
3. Confirmar desconexão
4. Loja desaparece ou mostra "Desconectado"
5. Reconectar a mesma conta
6. Deve trazer dados históricos de volta

### Erro: Conta Duplicada

1. Desconectar loja em um usuário hub
2. Conectar em conta DIFERENTE do hub
3. Tentar conectar MESMA conta ML
4. Deve errar: "já está conectada em outra conta"

## 📚 Documentação

Veja [MULTI_STORE_ML.md](./MULTI_STORE_ML.md) para documentação completa:
- Fluxo OAuth detalhado
- Isolamento de tokens
- Tratamento de erros
- Exemplos de código

## ✨ Diferenciais

- **Múltiplas contas por usuário**: Conecte N lojas diferentes
- **Tokens isolados**: Cada loja tem seus próprios tokens
- **Sem sobrescrita**: Conectar nova conta não afeta anteriores
- **Desconexão reversível**: Marcar como inativo, não deleta
- **OAuth com contexto novo**: `display=popup` força novo login
- **Cache-busting**: Timestamps evitam reutilização de sessão
- **Documentação completa**: Guia de uso e troubleshooting

## 🚀 Próximos Passos

1. ✅ Implementar multi-store (COMPLETO)
2. Sincronizar por store específico (usar `storeId` ao sync)
3. Listar produtos por store
4. Filtrar pedidos por store
5. Dashboard com métricas por store
6. Agendador de sync por store independente

