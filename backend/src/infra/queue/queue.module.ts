import { Module } from '@nestjs/common';

/**
 * QueueModule: wrapper em torno da infra de fila (BullMQ, Redis). Este arquivo é propositalmente pequeno
 * para manter o design simples para o MVP. Em produção, forneça workers separados e tratamento de erros,
 * retries e monitoramento robustos.
 */
@Module({
  providers: [],
  exports: [],
})
export class QueueModule {}
