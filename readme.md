Guia de Inicialização: Hub de Integração Marketplaces
Este documento fornece as instruções e padrões arquiteturais para a criação do novo projeto Hub de Integração Marketplaces, seguindo a estrutura de Monorepo e a stack tecnológica consolidada no projeto Jaboti.

🏗️ Estrutura do Monorepo (NPM Workspaces)
O projeto deve ser organizado em três partes principais para garantir o compartilhamento de tipos e a separação de responsabilidades.

/hub-marketplaces
├── package.json (Root)
├── /backend          (NestJS)
├── /frontend         (React + Vite)
└── /packages
    └── /shared       (Types, Enums, Interfaces)
1. Inicialização do Root
Crie o arquivo 
package.json
 na raiz com a configuração de workspaces:

{
  "name": "hub-marketplaces",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "packages/shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:shared": "cd packages/shared && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
🧬 Shared Package (O "Coração" da Tipagem)
Antes de começar o front ou o back, configure o packages/shared. Nele devem ficar:

Interfaces de API: Para que o front e o back falem a mesma língua.
Enums de Status: (ex: StatusPedido { PENDENTE, INTEGRADO, ERRO }).
Interfaces de DTO: Para garantir que os dados enviados via HTTP sejam tipados globalmente.
⚙️ Backend (NestJS + Prisma)
Siga o padrão Modular do Jaboti:

Módulos de Domínio: Crie um módulo para cada marketplace (ex: MercadoLivreModule, ShopeeModule).
Service Layer: Toda a lógica de integração e chamadas de APIs externas deve ficar nos Services.
Controllers: Apenas roteamento e validação inicial.
Prisma: Utilize o Prisma para modelagem do banco de dados, garantindo que as tabelas de Pedidos, Produtos e Tokens sejam bem estruturadas.
DTOs & Validation: Utilize class-validator e class-transformer em todos os inputs.
🎨 Frontend (React + Vite + Redux Toolkit)
Siga a estrutura baseada em Features:

Pasta Features: Organize por domínios (ex: src/features/dashboard, src/features/marketplaces).
Redux Slices: Utilize createSlice do RTK para gerenciar o estado dos pedidos e status de conexões.
Hooks Customizados: Encapsule a lógica de "fetch" e "actions" em hooks para não poluir os componentes.
Material UI (MUI): Utilize como base para os componentes de UI, mantendo a consistência visual.
Contexts: Use contexts apenas para estados globais que não precisam do Redux (ex: Temas ou Notificações via Toast).
📡 Padronização de Integração
Sendo um Hub, o padrão de comunicação é crítico:

Webhooks: Configure endpoints específicos para receber atualizações dos marketplaces em tempo real.
WebSocket: Use para notificar o frontend sobre novos pedidos ou erros de integração sem necessidade de Refresh.
Queue/Jobs: Considere o uso de BullMQ ou similar no backend para processar integrações pesadas em background.
