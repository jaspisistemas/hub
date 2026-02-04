import { Module } from '@nestjs/common';

/**
 * QueueModule: wrapper em torno da infra de fila (BullMQ, Redis). 
 * Temporariamente desabilitado para facilitar desenvolvimento local sem Redis.
 * Para habilitar: instale Redis e descomente o código abaixo.
 */
@Module({
  imports: [
    // TODO: Habilitar quando Redis estiver disponível
    // BullModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     redis: {
    //       host: configService.get<string>('REDIS_HOST', 'localhost'),
    //       port: configService.get<number>('REDIS_PORT', 6379),
    //       password: configService.get<string>('REDIS_PASSWORD'),
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
    // BullModule.registerQueue({
    //   name: 'orders',
    // }),
  ],
  exports: [],
})
export class QueueModule {}
