# API de Notas Fiscais

API para gerenciamento de notas fiscais vinculadas aos pedidos.

## Endpoints

### POST /invoices
Criar nota fiscal manualmente com dados estruturados.

**Request:**
```json
{
  "orderId": "uuid-do-pedido",
  "invoiceNumber": "12345",
  "invoiceKey": "35210512345678901234567890123456789012345678",
  "issueDate": "2026-02-12T10:30:00Z",
  "totalValue": 150.00,
  "xmlUrl": "https://storage.com/nota.xml",
  "pdfUrl": "https://storage.com/nota.pdf",
  "status": "issued"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "orderId": "uuid-do-pedido",
  "invoiceNumber": "12345",
  "invoiceKey": "35210512345678901234567890123456789012345678",
  "issueDate": "2026-02-12T10:30:00Z",
  "totalValue": 150.00,
  "xmlUrl": "https://storage.com/nota.xml",
  "pdfUrl": "https://storage.com/nota.pdf",
  "status": "issued",
  "createdAt": "2026-02-12T10:35:00Z"
}
```

---

### POST /invoices/upload
Upload de arquivo XML ou PDF da nota fiscal.

**Request:** `multipart/form-data`
```
file: [arquivo XML/PDF]
orderId: "uuid-do-pedido"
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "orderId": "uuid-do-pedido",
  "xmlUrl": "/uploads/invoices/arquivo.xml",
  "status": "pending",
  "createdAt": "2026-02-12T10:35:00Z"
}
```

**Exemplo CURL:**
```bash
curl -X POST http://localhost:3000/invoices/upload \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@nota.xml" \
  -F "orderId=123e4567-e89b-12d3-a456-426614174000"
```

---

### GET /invoices
Listar todas as notas fiscais.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "orderId": "uuid-do-pedido",
    "invoiceNumber": "12345",
    "totalValue": 150.00,
    "status": "issued",
    "createdAt": "2026-02-12T10:35:00Z"
  }
]
```

---

### GET /invoices/order/:orderId
Buscar nota fiscal de um pedido específico.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orderId": "uuid-do-pedido",
  "invoiceNumber": "12345",
  "invoiceKey": "35210512345678901234567890123456789012345678",
  "totalValue": 150.00,
  "xmlUrl": "/uploads/invoices/nota.xml",
  "pdfUrl": "/uploads/invoices/nota.pdf",
  "status": "issued",
  "sentAt": "2026-02-12T11:00:00Z"
}
```

---

### GET /invoices/order/:orderId/invoice-data
Obter dados estruturados para emissão de nota fiscal a partir de um pedido.

**Response:** `200 OK`
```json
{
  "order": {
    "id": "uuid-do-pedido",
    "orderNumber": "ML-12345678",
    "totalAmount": 150.00,
    "marketplace": "MercadoLivre"
  },
  "customer": {
    "name": "João Silva",
    "document": "123.456.789-00",
    "email": "joao@email.com",
    "phone": "(11) 98765-4321",
    "address": {
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Apto 45",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }
  },
  "items": [
    {
      "productName": "Produto Exemplo",
      "quantity": 2,
      "unitPrice": 50.00,
      "totalPrice": 100.00,
      "sku": "SKU-123"
    }
  ],
  "shipping": {
    "cost": 15.00,
    "method": "Correios PAC"
  },
  "store": {
    "name": "Minha Loja",
    "cnpj": "12.345.678/0001-90",
    "address": "Rua da Loja, 456"
  }
}
```

---

### GET /invoices/:id
Obter detalhes de uma nota fiscal específica.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "orderId": "uuid-do-pedido",
  "invoiceNumber": "12345",
  "invoiceKey": "35210512345678901234567890123456789012345678",
  "issueDate": "2026-02-12T10:30:00Z",
  "totalValue": 150.00,
  "xmlUrl": "/uploads/invoices/nota.xml",
  "pdfUrl": "/uploads/invoices/nota.pdf",
  "status": "sent",
  "sentAt": "2026-02-12T11:00:00Z",
  "createdAt": "2026-02-12T10:35:00Z"
}
```

---

### PATCH /invoices/:id
Atualizar dados de uma nota fiscal.

**Request:**
```json
{
  "invoiceNumber": "12346",
  "pdfUrl": "/uploads/invoices/nova-nota.pdf",
  "status": "issued"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "invoiceNumber": "12346",
  "pdfUrl": "/uploads/invoices/nova-nota.pdf",
  "status": "issued",
  "updatedAt": "2026-02-12T12:00:00Z"
}
```

---

### POST /invoices/:id/mark-sent
Marcar nota fiscal como enviada ao cliente.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "sent",
  "sentAt": "2026-02-12T11:00:00Z"
}
```

---

### POST /invoices/:id/mark-failed
Marcar nota fiscal como falha na emissão/envio.

**Request:**
```json
{
  "errorMessage": "Erro na SEFAZ: timeout ao consultar status"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "failed",
  "errorMessage": "Erro na SEFAZ: timeout ao consultar status",
  "updatedAt": "2026-02-12T12:00:00Z"
}
```

---

### DELETE /invoices/:id
Deletar uma nota fiscal.

**Response:** `204 No Content`

---

## Status da Nota Fiscal

| Status | Descrição |
|--------|-----------|
| `pending` | Nota criada mas ainda não emitida |
| `issued` | Nota emitida com sucesso |
| `sent` | Nota enviada ao cliente |
| `failed` | Falha na emissão/envio |
| `cancelled` | Nota cancelada |

---

## Fluxo de Uso

### 1. Emitir Nota a Partir de um Pedido

```bash
# 1. Buscar dados para emissão
GET /invoices/order/{orderId}/invoice-data

# 2. Enviar para sistema fiscal (externo)
# 3. Fazer upload do XML retornado
POST /invoices/upload
  file: nota.xml
  orderId: {orderId}

# 4. Marcar como enviada
POST /invoices/{id}/mark-sent
```

### 2. Upload Manual de Nota

```bash
# Upload direto do arquivo
POST /invoices/upload
  file: nota.xml
  orderId: {orderId}
```

### 3. Criação Manual (dados já processados)

```bash
POST /invoices
{
  "orderId": "uuid",
  "invoiceNumber": "12345",
  "invoiceKey": "chave-de-acesso",
  "totalValue": 150.00,
  "xmlUrl": "url-do-xml",
  "pdfUrl": "url-do-pdf",
  "status": "issued"
}
```

---

## Integração Frontend

```typescript
// Buscar nota de um pedido
const invoice = await api.get(`/invoices/order/${orderId}`);

// Upload de arquivo
const formData = new FormData();
formData.append('file', xmlFile);
formData.append('orderId', orderId);
await api.post('/invoices/upload', formData);

// Marcar como enviada
await api.post(`/invoices/${invoiceId}/mark-sent`);
```

---

## Validações

- **orderId**: Deve ser um UUID válido e o pedido deve existir
- **file** (upload): Apenas XML ou PDF, máximo 5MB
- **invoiceKey**: 44 caracteres numéricos (chave de acesso NF-e)
- **totalValue**: Valor positivo com 2 casas decimais

---

## Arquivos Armazenados

Os arquivos enviados são salvos em:
```
backend/uploads/invoices/
  - {timestamp}-{originalname}
```

Acessíveis via:
```
http://localhost:3000/uploads/invoices/{filename}
```
