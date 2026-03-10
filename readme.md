# VendaMais - Integração de Marketplaces

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
- **Database**: PostgreSQL
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
- [x] Central de Ajuda completa com FAQs organizados
- [x] Sistema de atendimento unificado com resposta automática
- [x] Perfil de usuário com avatar e gestão de colaboradores
- [x] Upload de logo da empresa com preview

### ✅ Integração Mercado Livre
- [x] Fluxo OAuth completo (autorização e callback)
- [x] Troca de code por access_token
- [x] Persistência de tokens no banco de dados
- [x] Refresh token automático antes de expirar
- [x] Webhook para receber notificações de pedidos
- [x] Busca de dados completos do pedido via API
- [x] Mapeamento de dados do ML para formato interno
- [x] Salvamento de dados do cliente (nome, email, endereço, etc.)
- [x] **Resolução de nomes de clientes via API ML** (fallback multi-field)
- [x] Sincronização de produtos do Mercado Livre
- [x] Criação de anúncios no ML com categorias e atributos
- [x] Sincronização automática de pedidos
- [x] Sistema de perguntas e respostas
- [x] Mensagens de pós-venda (comunicação com compradores)
- [x] Atendimento centralizado (perguntas + mensagens + avaliações)

### ✅ Sistema de Suporte/Atendimento
- [x] Sincronização de perguntas não respondidas
- [x] Sincronização de mensagens de pós-venda
- [x] Resposta direta pelo hub (enviada automaticamente ao ML)
- [x] Filtros por tipo (pergunta, avaliação, mensagem de venda)
- [x] Filtros por loja, status, origem
- [x] **Filtro "Todas as lojas"** com comportamento correto
- [x] Filtros por período com data range configurável
- [x] Logs detalhados de sincronização
- [x] Histórico completo de interações
- [x] Dialog expandido para ver detalhes completos do atendimento

### ✅ Dashboard & Analytics
- [x] Gráfico de vendas por período (últimos N dias)
- [x] **Gráfico de vendas usando data real dos pedidos** (não data de sync)
- [x] Distribuição de pedidos por status
- [x] Métricas de receita e quantidade
- [x] Histórico de pedidos recentes
- [x] Estatísticas por loja
- [x] **Tradução de labels para português brasileiro**

### 🔄 Em Desenvolvimento
- [ ] Integração com Shopee
- [ ] Sistema de filas com BullMQ para processamento assíncrono
- [ ] Sincronização bidirecional de status de pedidos
- [ ] Gestão de estoque multi-loja
- [ ] Relatórios avançados e analytics

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
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=jaspi_hub

# JWT
JWT_SECRET=sua-chave-secreta-aqui

# Servidor
PORT=3000
BACKEND_URL=https://seu-server.com
FRONTEND_URL=https://seu-frontend.com
CORS_ORIGINS=https://seu-frontend.com,https://seu-server.com

# Mercado Livre API
ML_APP_ID=seu-app-id-aqui
ML_CLIENT_SECRET=seu-client-secret-aqui
ML_REDIRECT_URI=${BACKEND_URL}/marketplace/mercadolivre/callback
```

### Redis (obrigatorio para queues)

As filas usam Redis via BullMQ. Garanta um Redis ativo antes de iniciar o backend.

Variaveis utilizadas:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Variaveis de ambiente criticas

Backend:
- `PORT`
- `BACKEND_URL`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `ML_APP_ID`, `ML_CLIENT_SECRET`, `ML_REDIRECT_URI`

Frontend:
- `VITE_API_URL`

### 3. Executar em modo desenvolvimento

```bash
# Executar backend + frontend simultaneamente
npm run dev

# Ou executar separadamente:
npm run dev:backend  # Backend na porta 3000
npm run dev:frontend # Frontend na porta 5174
```

### Migrations

As migrations ficam em `backend/src/migrations` e sao a fonte primaria.

```bash
npm -w backend run migration:run
```

### 4. Acessar aplicação

- **Frontend**: ${FRONTEND_URL}
- **Backend**: ${BACKEND_URL}
- **Login padrão**: Criar conta na tela de registro

## 🧰 Troubleshooting

- **Erro [ENV] ... is required**: confira se `backend/.env` existe e contem as variaveis criticas.
- **Erro de CORS (Access-Control-Allow-Origin)**: valide `CORS_ORIGINS` e reinicie o backend.
- **Frontend sem API**: configure `VITE_API_URL` e reinicie o dev server.
- **Falha Redis / BullMQ**: verifique se o Redis esta ativo e se `REDIS_HOST/REDIS_PORT` estao corretos.
- **Erro de conexao com banco**: confirme `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME`.

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
- `PATCH /orders/:id` - Atualizar pedido
- `GET /orders/metrics/dashboard` - Métricas do dashboard

### Suporte/Atendimento
- `GET /supports` - Listar atendimentos (com filtros)
- `GET /supports/:id` - Buscar atendimento por ID
- `POST /supports/:id/answer` - Responder atendimento
- `POST /supports/sync/:storeId` - Sincronizar perguntas e mensagens
- `DELETE /supports/:id` - Deletar atendimento

### Marketplace - Mercado Livre
- `GET /marketplace/mercadolivre/auth` - Iniciar OAuth
- `GET /marketplace/mercadolivre/callback` - Callback OAuth
- `POST /marketplace/mercadolivre/webhook` - Receber webhooks
- `POST /marketplace/mercadolivre/test-order` - Criar pedido de teste
- `POST /marketplace/mercadolivre/sync-products` - Sincronizar produtos
- `POST /marketplace/mercadolivre/sync-orders` - Sincronizar pedidos
- `POST /marketplace/mercadolivre/publish-products` - Publicar produtos no ML
- `GET /marketplace/mercadolivre/categories` - Listar categorias
- `GET /marketplace/mercadolivre/categories/:id` - Buscar subcategorias
- `GET /marketplace/mercadolivre/categories/:id/attributes` - Atributos da categoria

## 🔌 Integração com Mercado Livre

### 1. Criar aplicação no ML

1. Acesse https://developers.mercadolivre.com.br/
2. Faça login com sua conta ML
3. Vá em "Minhas Aplicações" > "Criar nova aplicação"
4. Configure:
  - **URL de redirect**: `${BACKEND_URL}/marketplace/mercadolivre/callback`
  - **Webhook**: `${BACKEND_URL}/marketplace/mercadolivre/webhook`

### 2. Configurar credenciais

Adicione as credenciais no arquivo `backend/.env`:

```env
ML_APP_ID=seu-app-id
ML_CLIENT_SECRET=seu-client-secret
ML_REDIRECT_URI=${BACKEND_URL}/marketplace/mercadolivre/callback
```

### 3. Autorizar aplicação

Acesse no navegador:
```
${BACKEND_URL}/marketplace/mercadolivre/auth
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
│   └── stores/       # Lojas com estatísticas
│   ├── orders/      # Gestão de pedidos
│   ├── products/    # Gestão de produtos
│   ├── stores/      # Gestão de lojas
│   └── support/     # Sistema de atendimento + Central de Ajuda
├── components/      # Componentes compartilhados
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── PageHeader.tsx
│   ├── StatusBadge.tsx
│   ├── EmptyState.tsx
│   └── ...
├── services/        # Serviços de API
│   ├── api.ts
│   ├── authService.ts
│   ├── productsService.ts
│   ├── ordersService.ts
│   ├── storesService.ts
│   ├── supportService.ts
│   └── websocket.ts
└── contexts/        # Contexts do React
    ├── ThemeContext.tsx
    └── SidebarContext.tsx

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
- **Product**: Produtos cadastrados com imagens
- **Store**: Lojas conectadas (com tokens do ML)
- **Order**: Pedidos recebidos dos marketplaces
- **Support**: Atendimentos (perguntas, mensagens, avaliações)

### Campos de integração ML na Store

- `mlAccessToken`: Token de acesso à API
- `mlRefreshToken`: Token para renovação
- `mlTokenExpiresAt`: Timestamp de expiração
- `mlUserId`: ID do usuário no ML

### Entidade Support (Atendimento)

- `origin`: Origem (mercado_livre, shopee, amazon, outros)
- `type`: Tipo (pergunta, avaliacao, mensagem_venda)
- `status`: Status (nao_respondido, respondido, fechado)
- `externalId`: ID no marketplace
- `packId`: ID do pack de mensagens (ML)
- `orderExternalId`: ID do pedido (para mensagens de venda)
- `question`: Pergunta/mensagem do cliente
- `answer`: Resposta enviada
- `customerName`: Nome do cliente
- `productTitle`: Título do produto/pedidoões com clientes dos marketplaces:

### Tipos de Atendimento
- **Perguntas**: Dúvidas sobre produtos antes da compra
- **Mensagens de Venda**: Comunicação pós-compra com compradores
- **Avaliações**: Feedback e comentários dos clientes

### Funcionalidades
- Sincronização automática de perguntas e mensagens
- Resposta direta pelo hub (enviada automaticamente ao marketplace)
- Filtros avançados (tipo, status, loja, produto)
- Histórico completo de conversas
- Logs detalhados de sincronização
- Busca por palavra-chave

### Fluxo de Sincronização
1. Selecione uma loja no filtro
2. Clique em "Sincronizar"
3. Sistema busca perguntas não respondidas e mensagens de pedidos
4. Dados são salvos no banco local
5. Você pode responder diretamente pelo hub
6. Resposta é automaticamente enviada ao Mercado Livre

## 📚 Central de Ajuda

Interface completa com documentação e FAQs:

- **6 Seções Organizadas**: Primeiros Passos, Produtos, Pedidos, Atendimento, Sincronização, Segurança
- **29 Perguntas Frequentes**: Respostas detalhadas para dúvidas comuns
- **Ações Rápidas**: Links diretos para funcionalidades principais
- **Suporte**: Informações de contato e horário de atendimento
- Acesso via ícone **?** no topo da páginamarketplaces

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

## 🆕 Atualizações Recentes (Fevereiro 2026)

### Correções de UX
- **Filtro de Loja**: Corrigido comportamento do filtro "Todas as lojas" (value='0') para mostrar todos os atendimentos
- **Avatar do Perfil**: Corrigido sistema de preview e armazenamento de avatar
- **Filtros Múltiplos**: Melhorado estado dos filtros para funcionar em combinação (loja + tipo + status + período)

### Melhorias de Dados
- **Gráfico de Vendas**: Agora usa a data real dos pedidos (`orderCreatedAt`) em vez da data de sincronização
  - Evita concentração artificial de vendas em datas de bulk sync
  - Mostra padrão real de vendas do cliente
- **Nomes de Clientes**: Integração com API Mercado Livre para resolver nomes reais
  - Fallback multi-field: nickname → name → display_name → API lookup → Cliente #{id}
  - Evita exibição de "Anônimo" ou falta de identificação

### Melhorias de Interface
- **Dialog de Atendimento**: Expandido para `maxWidth="md"` com melhor visualização de contexto
- **Botão de Atendimento**: Mudado para "Ver Detalhes & Responder" com estilo outlined
- **Textarea de Resposta**: Aumentado para 7 linhas para mensagens mais longas
- **PT-BR Translations**: Dashboard agora exibe labels em português (Cancelado, Pago, etc.)

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

Desenvolvido por [Equipe VendaMais]

