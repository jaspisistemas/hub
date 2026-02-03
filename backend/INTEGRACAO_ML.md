# Integração com Mercado Livre

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

- [ ] Implementar troca de code por access_token
- [ ] Salvar tokens de acesso no banco
- [ ] Implementar refresh token
- [ ] Buscar dados completos do pedido via API após webhook
- [ ] Sincronizar status de pedidos
- [ ] Sincronizar produtos com o ML
- [ ] Implementar criação de anúncios no ML
