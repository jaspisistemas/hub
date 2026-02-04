# Integração com Mercado Livre

## Status do Desenvolvimento

### ✅ Concluído
- [x] Estrutura de pastas do módulo marketplace criada
- [x] Controller do Marketplace implementado com endpoints de teste
- [x] Serviço do Marketplace com métodos de teste
- [x] Modulo marketplace integrado ao app principal
- [x] Documentação de endpoints e fluxos criada
- [x] Adapter base para mapeamento de dados do ML para o sistema
- [x] Endpoints funcionando localmente:
  - `GET /marketplace/mercadolivre/auth` - Inicia fluxo OAuth
  - `POST /marketplace/mercadolivre/webhook` - Recebe webhooks do ML
  - `POST /marketplace/mercadolivre/test-order` - Cria pedido de teste
- [x] **Implementação completa do fluxo OAuth (troca de code por token)**
- [x] **Persistência de tokens no banco de dados**
- [x] **Buscar dados completos do pedido via API do ML**
- [x] **Refresh token automatizado**
- [x] **Integração Store com tokens do Mercado Livre**

### ⏳ Pendente
- [ ] Sincronização de status de pedidos
- [ ] Sincronização de produtos com ML
- [ ] Criação de anúncios no ML
- [ ] Tratamento de erros de autenticação

## Configuração

### 1. Criar aplicação no Mercado Livre

1. Acesse https://developers.mercadolivre.com.br/
2. Faça login com sua conta ML
3. Vá em "Minhas Aplicações" > "Criar nova aplicação"
4. Preencha os dados:
   - Nome da aplicação
   - Descrição
   - URL de callback: `http://localhost:3000/marketplace/mercadolivre/callback`
   - Notificação (webhooks): `http://seu-dominio.com/marketplace/mercadolivre/webhook`

### 2. Configurar credenciais

Copie o `.env.example` para `.env` e preencha:

```env
ML_APP_ID=seu-app-id-aqui
ML_CLIENT_SECRET=seu-client-secret-aqui
ML_REDIRECT_URI=http://localhost:3000/marketplace/mercadolivre/callback
```

## Endpoints Disponíveis

### 1. Iniciar Autorização OAuth

```
GET http://localhost:3000/marketplace/mercadolivre/auth
```

Redireciona para a página de autorização do Mercado Livre. Após autorizar, o usuário será redirecionado para o callback.

### 2. Receber Webhook de Pedidos

```
POST http://localhost:3000/marketplace/mercadolivre/webhook
```

Endpoint para receber notificações do Mercado Livre sobre novos pedidos e atualizações.

Exemplo de payload:
```json
{
  "resource": "/orders/1234567890",
  "user_id": 123456,
  "topic": "orders_v2",
  "application_id": 987654,
  "attempts": 1,
  "sent": "2024-01-01T10:00:00.000Z",
  "received": "2024-01-01T10:00:01.000Z"
}
```

### 3. Testar Criação de Pedido (Desenvolvimento)

```
POST http://localhost:3000/marketplace/mercadolivre/test-order
```

Cria um pedido de teste sem precisar do Mercado Livre.

Body (opcional):
```json
{
  "id": 123456,
  "total_amount": 299.99,
  "product_name": "Produto Teste",
  "status": "paid"
}
```

Resposta:
```json
{
  "success": true,
  "message": "Pedido de teste criado com sucesso",
  "order": {
    "id": "uuid-gerado",
    "externalId": "123456",
    "marketplace": "mercadolivre",
    "total": 299.99,
    "status": "pending"
  }
}
```

## Fluxo de Autorização OAuth

1. Frontend chama `GET /marketplace/mercadolivre/auth`
2. Usuário é redirecionado para o ML para autorizar
3. ML redireciona de volta para `/marketplace/mercadolivre/callback?code=ABC123`
4. Backend troca o `code` por um `access_token`
5. `access_token` é salvo para fazer chamadas à API do ML

## Fluxo de Webhook

1. Cliente faz pedido no Mercado Livre
2. ML envia notificação para `/marketplace/mercadolivre/webhook`
3. Backend recebe o webhook com o `resource` (ID do pedido)
4. Backend busca os dados completos do pedido usando a API do ML
5. Adapter mapeia os dados para o formato interno
6. Pedido é criado no sistema

## Testar Localmente

### Usando ngrok para expor webhook

```bash
ngrok http 3000
```

Copie a URL gerada (ex: `https://abc123.ngrok.io`) e configure no painel do desenvolvedor do ML:
- Webhook: `https://abc123.ngrok.io/marketplace/mercadolivre/webhook`

### Testar sem webhook

Use o endpoint de teste:

```bash
curl -X POST http://localhost:3000/marketplace/mercadolivre/test-order \
  -H "Content-Type: application/json" \
  -d '{
    "id": 999888777,
    "total_amount": 149.90,
    "product_name": "Fone Bluetooth Premium"
  }'
```

## Próximos Passos

- [x] ~~Implementar troca de code por access_token~~ ✅
- [x] ~~Salvar tokens de acesso no banco~~ ✅
- [x] ~~Implementar refresh token~~ ✅
- [x] ~~Buscar dados completos do pedido via API após webhook~~ ✅
- [ ] Sincronizar status de pedidos
- [ ] Sincronizar produtos com o ML
- [ ] Implementar criação de anúncios no ML
- [ ] Tratamento avançado de erros e retry logic
- [ ] Dashboard de monitoramento de integrações

## Funcionalidades Implementadas

### 1. OAuth 2.0 Completo
- Troca automática de `code` por `access_token`
- Persistência segura de tokens no banco de dados
- Refresh token automático quando expira em menos de 1 hora
- Criação ou atualização automática de lojas no callback

### 2. Webhook com Busca de Dados Completos
- Recebe notificações do ML em tempo real
- Busca automaticamente os dados completos do pedido via API
- Verifica e renova token antes de fazer requisições
- Associa pedidos à loja correta via `mlUserId`

### 3. Entidade Store Atualizada
Novos campos para integração ML:
- `mlAccessToken`: Token de acesso à API
- `mlRefreshToken`: Token para renovação
- `mlTokenExpiresAt`: Timestamp de expiração
- `mlUserId`: ID do usuário no Mercado Livre

### 4. Métodos de Serviço
- `exchangeMercadoLivreCode()`: Troca code por tokens
- `refreshMercadoLivreToken()`: Renova token expirado
- `getMercadoLivreOrder()`: Busca pedido completo
- `isTokenExpiring()`: Verifica se token precisa renovação
- `findOrCreateMercadoLivreStore()`: Gerencia lojas ML
