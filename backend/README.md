# Backend (NestJS)

Esta pasta contém o backend NestJS do Hub de Integrações Marketplaces (MVP).

Princípios orientadores:
- Regras de negócio vivem nos serviços de domínio (ex.: `OrdersService`).
- Adapters apenas mapeiam payloads externos para o modelo interno.
- Integrações externas sempre passam por filas.
- Comunicação interna é orientada a eventos.

Executar localmente:
- npm run start:dev

Build e execução:
- npm run build
- npm run start

Scripts utilitários:
- scripts/ (tarefas pontuais, migrações manuais, seed, testes rápidos)

Estrutura:
- src/domains
- src/integrations
- src/jobs
- src/infra
- scripts

