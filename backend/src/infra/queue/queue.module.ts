import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

/**
 * QueueModule: wrapper em torno da infra de fila (BullMQ, Redis).
 * Configurado para usar Redis (local ou via variáveis de ambiente)
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          enableOfflineQueue: true,
        },
      }),
      inject: [ConfigService],
    }),
    // Filas de processamento
    BullModule.registerQueue(
      { name: 'orders' },
      { name: 'products' },
      { name: 'sync' },
    ),
  ],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
