# Jaspi Hub - Integração de Marketplaces

Sistema completo de integração com marketplaces (Mercado Livre, Shopee, etc.) para centralizar pedidos, produtos e lojas em uma única plataforma.

## 🏗️ Estrutura do Monorepo

```
/hub
├── package.json (Root - NPM Workspaces)
├── /backend          (NestJS + TypeORM + SQLite)
├── /frontend         (React + Vite + Redux Toolkit + Material UI)
└── /packages
    └── /shared       (Types compartilhados - futuro)
```

## 🚀 Stack Tecnológica

### Backend
- **Framework**: NestJS
- **ORM**: TypeORM
- **Database**: SQLite (desenvolvimento) / SQL Server (produção)
- **Autenticação**: JWT + Passport
- **Validação**: class-validator + class-transformer
- **WebSocket**: Socket.io para notificações em tempo real
- **Queue**: BullMQ para processamento de jobs (em desenvolvimento)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **State Management**: Redux Toolkit
- **UI**: Material UI (MUI)
- **HTTP Client**: Fetch API
- **WebSocket**: Socket.io-client

## 📦 Funcionalidades Implementadas

### ✅ Core
- [x] Sistema de autenticação (Login/Register com JWT)
- [x] Dashboard com estatísticas em tempo real
- [x] Gestão de produtos com upload de imagens
- [x] Gestão de lojas conectadas
- [x] Gestão de pedidos com detalhes completos
- [x] WebSocket para notificações em tempo real
- [x] Sistema de temas (claro/escuro)

### ✅ Integração Mercado Livre
- [x] Fluxo OAuth completo (autorização e callback)
- [x] Troca de code por access_token
- [x] Persistência de tokens no banco de dados
- [x] Refresh token automático antes de expirar
- [x] Webhook para receber notificações de pedidos
- [x] Busca de dados completos do pedido via API
- [x] Mapeamento de dados do ML para formato interno
- [x] Salvamento de dados do cliente (nome, email, endereço, etc.)

### 🔄 Em Desenvolvimento
- [ ] Sincronização de produtos com Mercado Livre
- [ ] Criação de anúncios no ML
- [ ] Integração com Shopee
- [ ] Sistema de filas com BullMQ
- [ ] Sincronização de status de pedidos

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- NPM 8+

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie o arquivo `backend/.env` com base no `.env.example`:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=sua-chave-secreta-aqui

# Servidor
PORT=3000

# Mercado Livre API
ML_APP_ID=seu-app-id-aqui
ML_CLIENT_SECRET=seu-client-secret-aqui
ML_REDIRECT_URI=http://localhost:3000/marketplace/mercadolivre/callback
```

### 3. Executar em modo desenvolvimento

```bash
# Executar backend + frontend simultaneamente
npm run dev

# Ou executar separadamente:
npm run dev:backend  # Backend na porta 3000
npm run dev:frontend # Frontend na porta 5174
```

### 4. Acessar aplicação

- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:3000
- **Login padrão**: Criar conta na tela de registro

## 📡 Endpoints da API

### Autenticação
- `POST /auth/register` - Criar nova conta
- `POST /auth/login` - Fazer login
- `POST /auth/validate` - Validar token

### Produtos
- `GET /products` - Listar todos os produtos
- `POST /products` - Criar novo produto (com upload de imagem)
- `GET /products/:id` - Buscar produto por ID
- `PATCH /products/:id` - Atualizar produto
- `DELETE /products/:id` - Deletar produto
- `POST /products/export` - Exportar produtos selecionados

### Lojas
- `GET /stores` - Listar todas as lojas
- `POST /stores` - Criar nova loja
- `GET /stores/:id` - Buscar loja por ID
- `PATCH /stores/:id` - Atualizar loja
- `DELETE /stores/:id` - Deletar loja

### Pedidos
- `GET /orders` - Listar todos os pedidos
- `POST /orders` - Criar novo pedido
- `GET /orders/:id` - Buscar pedido por ID

### Marketplace - Mercado Livre
- `GET /marketplace/mercadolivre/auth` - Iniciar OAuth
- `GET /marketplace/mercadolivre/callback` - Callback OAuth
- `POST /marketplace/mercadolivre/webhook` - Receber webhooks
- `POST /marketplace/mercadolivre/test-order` - Criar pedido de teste

## 🔌 Integração com Mercado Livre

### 1. Criar aplicação no ML

1. Acesse https://developers.mercadolivre.com.br/
2. Faça login com sua conta ML
3. Vá em "Minhas Aplicações" > "Criar nova aplicação"
4. Configure:
   - **URL de redirect**: `http://localhost:3000/marketplace/mercadolivre/callback` ou URL do ngrok
   - **Webhook**: `https://seu-ngrok-url/marketplace/mercadolivre/webhook`

### 2. Configurar credenciais

Adicione as credenciais no arquivo `backend/.env`:

```env
ML_APP_ID=seu-app-id
ML_CLIENT_SECRET=seu-client-secret
ML_REDIRECT_URI=http://localhost:3000/marketplace/mercadolivre/callback
```

### 3. Autorizar aplicação

Acesse no navegador:
```
http://localhost:3000/marketplace/mercadolivre/auth
```

Os tokens serão salvos automaticamente no banco de dados.

### 4. Testar webhook com ngrok

```bash
ngrok http 3000
```

Configure a URL do ngrok no painel do desenvolvedor do ML.

## 🏛️ Arquitetura

### Backend - Padrão Modular

```
backend/src/
├── domains/           # Módulos de domínio
│   ├── auth/         # Autenticação
│   ├── orders/       # Pedidos
│   ├── products/     # Produtos
│   └── stores/       # Lojas
├── integrations/     # Integrações externas
│   └── marketplace/  # Mercado Livre, Shopee, etc.
├── infra/           # Infraestrutura
│   ├── queue/       # Sistema de filas
│   └── websocket/   # WebSocket Gateway
└── jobs/            # Background jobs
```

### Frontend - Feature-based

```
frontend/src/
├── features/         # Módulos por funcionalidade
│   ├── auth/        # Login/Register
│   ├── dashboard/   # Dashboard
│   ├── orders/      # Pedidos
│   ├── products/    # Produtos
│   ├── stores/      # Lojas
│   └── support/     # Suporte
├── components/      # Componentes compartilhados
├── services/        # Serviços de API
└── contexts/        # Contexts do React
```

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:

1. Usuário faz login com email/senha
2. Backend valida e retorna um token JWT
3. Token é armazenado no localStorage
4. Token é enviado no header `Authorization: Bearer {token}` em todas as requisições

## 📊 Banco de Dados

### Entidades principais

- **User**: Usuários do sistema
- **Product**: Produtos cadastrados
- **Store**: Lojas conectadas (com tokens do ML)
- **Order**: Pedidos recebidos dos marketplaces

### Campos de integração ML na Store

- `mlAccessToken`: Token de acesso à API
- `mlRefreshToken`: Token para renovação
- `mlTokenExpiresAt`: Timestamp de expiração
- `mlUserId`: ID do usuário no ML

## 🔔 WebSocket - Eventos em Tempo Real

O sistema emite eventos via WebSocket para:

- `order:created` - Novo pedido criado
- `order:updated` - Pedido atualizado
- `order:deleted` - Pedido removido

## 📝 Scripts Disponíveis

```bash
# Root
npm run dev              # Rodar backend + frontend
npm run build           # Build de produção

# Backend
npm run start:dev       # Modo desenvolvimento
npm run build          # Build TypeScript
npm run start          # Rodar build de produção

# Frontend  
npm run dev            # Modo desenvolvimento
npm run build          # Build de produção
npm run preview        # Preview do build
```

## 📖 Documentação Adicional

- [Integração com Mercado Livre](backend/INTEGRACAO_ML.md)
- [Implementações Realizadas](IMPLEMENTACOES.md)

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Equipe

Desenvolvido por [Jaspi Team]
