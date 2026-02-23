# 🧪 Como Testar API de Dados Fiscais no Postman

## 1️⃣ Login (Obter Token)

**Método:** `POST`  
**URL:** `${BACKEND_URL}/auth/login`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@jaspi.com",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@jaspi.com",
    "name": "Admin"
  }
}
```

✅ **Copie o `accessToken`** para usar nas próximas requisições!

---

## 2️⃣ Listar Pedidos (Obter orderId)

**Método:** `GET`  
**URL:** `${BACKEND_URL}/orders`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta:**
```json
[
  {
    "id": "fe54c8f2-e374-43b6-8342-6564ed16672b",
    "externalId": "ML-123456",
    "customerName": "João da Silva",
    "total": "299.90",
    ...
  }
]
```

✅ **Copie o `id`** de um pedido para buscar os dados fiscais!

---

## 3️⃣ Buscar Dados Fiscais do Pedido (PRINCIPAL)

**Método:** `GET`  
**URL:** `${BACKEND_URL}/invoices/order/{ORDER_ID}/invoice-data`  

Exemplo:
```
${BACKEND_URL}/invoices/order/fe54c8f2-e374-43b6-8342-6564ed16672b/invoice-data
```

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta Completa:**
```json
{
  "orderId": "fe54c8f2-e374-43b6-8342-6564ed16672b",
  "orderNumber": "ML-1770832308803",
  "orderDate": "2026-02-11T17:51:48.831Z",
  "totalAmount": 299.9,
  
  "customerName": "João da Silva",
  "customerEmail": "joao@exemplo.com",
  "customerPhone": "11987654321",
  "customerCpfCnpj": "12345678900",
  "customerInscricaoEstadual": null,
  
  "shippingAddress": {
    "street": "Rua Exemplo",
    "number": "123",
    "complement": null,
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "country": "BR"
  },
  
  "billingAddress": null,
  
  "items": [
    {
      "productId": "MLB123",
      "title": "Produto Teste",
      "quantity": 2,
      "unitPrice": 142,
      "totalPrice": 284,
      "sku": "SKU-001",
      "ncm": null,
      "cfop": null
    }
  ],
  
  "subtotal": 284,
  "shippingCost": 15.9,
  "discount": 0,
  "total": 299.9,
  
  "taxes": {
    "marketplaceFee": 28.4,
    "shippingFee": 15.9
  },
  
  "store": {
    "id": "...",
    "name": "Minha Loja"
  },
  
  "rawData": { ... }
}
```

---

## 4️⃣ Anexar Nota Fiscal (Upload de Arquivo)

**Método:** `POST`  
**URL:** `${BACKEND_URL}/invoices/upload`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (form-data):**
- Key: `file` (type: File) - Selecione o arquivo PDF ou XML da nota fiscal
- Key: `orderId` (type: Text) - Cole o ID do pedido

**Resposta:**
```json
{
  "id": "uuid-da-nota",
  "orderId": "fe54c8f2-e374-43b6-8342-6564ed16672b",
  "number": "12345",
  "series": "1",
  "accessKey": "35260212345678901234567890123456789012345678",
  "xmlContent": "...",
  "pdfUrl": "/uploads/invoices/invoice-1234567890.pdf",
  "issueDate": "2026-02-11T18:00:00.000Z",
  "status": "generated",
  "sentToMarketplace": false,
  "createdAt": "2026-02-11T18:00:00.000Z",
  "updatedAt": "2026-02-11T18:00:00.000Z"
}
```

✅ **Se for XML:** O sistema extrai automaticamente número, série e chave de acesso da NFe!  
✅ **Se for PDF:** Salva o arquivo e retorna o caminho no campo `pdfUrl`.

---

## 5️⃣ (Opcional) Criar Pedido de Teste

Se não tiver pedidos, crie um:

**Método:** `POST`  
**URL:** `${BACKEND_URL}/orders`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "externalId": "ML-999888",
  "marketplace": "mercado_livre",
  "total": 450.00,
  "customerName": "Maria Santos",
  "customerEmail": "maria@exemplo.com",
  "customerPhone": "11912345678",
  "customerCity": "Rio de Janeiro",
  "customerState": "RJ",
  "customerAddress": "Av. Atlântica, 500",
  "customerZipCode": "22010-000",
  "raw": {
    "buyer": {
      "billing_info": {
        "doc_number": "98765432100",
        "doc_type": "CPF"
      }
    },
    "shipping": {
      "receiver_address": {
        "street_name": "Av. Atlântica",
        "street_number": "500",
        "neighborhood": "Copacabana",
        "city": { "name": "Rio de Janeiro" },
        "state": { "id": "RJ" },
        "zip_code": "22010-000",
        "country": { "id": "BR" }
      },
      "cost": 25.00
    },
    "order_items": [
      {
        "item": {
          "id": "MLB456",
          "title": "Notebook Dell",
          "seller_sku": "DELL-001"
        },
        "quantity": 1,
        "unit_price": 425.00,
        "full_unit_price": 425.00,
        "sale_fee": 42.50
      }
    ]
  }
}
```

---

## 📋 Passo a Passo Rápido no Postman:

### 1. Login
1. Nova requisição → `POST`
2. URL: `${BACKEND_URL}/auth/login`
3. Body → raw → JSON
4. Cole: `{"email": "admin@jaspi.com", "password": "admin123"}`
5. **Send**
6. Copie o `accessToken`

### 2. Configurar Authorization
1. Aba **Authorization**
2. Type: `Bearer Token`
3. Cole o token copiado

### 3. Buscar Pedidos
1. Nova requisição → `GET`
2. URL: `${BACKEND_URL}/orders`
3. Authorization: Bearer Token (cole o token)
4. **Send**
5. Copie um `id` de pedido

**Filtros opcionais:**
- Apenas pedidos pagos: `${BACKEND_URL}/orders?paidOnly=true`
- Filtrar por status: `${BACKEND_URL}/orders?status=paid,approved`
- Filtrar por data de atualização: `${BACKEND_URL}/orders?updatedSince=2026-02-11T00:00:00.000Z`
- Atalho para pagos: `${BACKEND_URL}/orders/paid`
- Pagos + data: `${BACKEND_URL}/orders/paid?updatedSince=2026-02-11T00:00:00.000Z`

### 4. Buscar Dados Fiscais
1. Nova requisição → `GET`
2. URL: `${BACKEND_URL}/invoices/order/COLE_O_ID_AQUI/invoice-data`
3. Authorization: Bearer Token (cole o token)
4. **Send**
5. ✅ Veja todos os dados fiscais!

### 5. Anexar Nota Fiscal (Upload)
1. Nova requisição → `POST`
2. URL: `${BACKEND_URL}/invoices/upload`
3. Authorization: Bearer Token (cole o token)
4. Body → **form-data**
5. Adicione chave `file` (type: File) e selecione o PDF/XML
6. Adicione chave `orderId` (type: Text) e cole o ID do pedido
7. **Send**
8. ✅ Nota fiscal anexada!

---

## 🎯 Endpoints Disponíveis:

```
POST   /auth/login                                  - Login
POST   /auth/register                               - Registrar usuário

GET    /orders                                      - Listar pedidos
GET    /orders?paidOnly=true                         - Listar apenas pedidos pagos
GET    /orders?status=paid,approved                  - Listar pedidos por status
GET    /orders?updatedSince=2026-02-11T00:00:00.000Z - Listar pedidos atualizados após a data
GET    /orders/paid                                  - Listar apenas pedidos pagos (atalho)
GET    /orders/paid?updatedSince=2026-02-11T00:00:00.000Z - Pagos atualizados após a data
POST   /orders                                      - Criar pedido
GET    /orders/:id                                  - Buscar pedido

GET    /invoices/order/:orderId/invoice-data       - Dados fiscais do pedido
POST   /invoices/upload                             - 🆕 Anexar nota fiscal (upload)
POST   /invoices                                    - Criar nota fiscal
GET    /invoices                                    - Listar notas
GET    /invoices/order/:orderId                     - Buscar nota por pedido
```

---

## ⚠️ Troubleshooting:

**Erro 401 - Unauthorized:**
- Verifique se copiou o token corretamente
- Refaça o login se o token expirou

**Erro 404 - Not Found:**
- Confirme se o `orderId` está correto
- Verifique se o pedido existe (`GET /orders`)

**Erro 500 - Internal Server Error:**
- Backend pode não estar rodando
- Verifique console do backend para detalhes

---

## 💡 Dica: Salvar Collection no Postman

1. Crie uma **Collection** chamada "Jaspi Hub"
2. Salve todas as requisições
3. Configure uma **Variable** `{{token}}` para o accessToken
4. Configure uma **Variable** `{{baseUrl}}` = `${BACKEND_URL}`

Assim você reutiliza facilmente! 🚀
