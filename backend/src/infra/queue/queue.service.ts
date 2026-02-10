import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * ServiçoFila: responsável por enfileirar jobs assíncronos
 * Permite que operações longas sejam processadas em background
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('sync')
    private syncQueue: Queue,
    @InjectQueue('orders')
    private ordersQueue: Queue,
    @InjectQueue('products')
    private productsQueue: Queue,
  ) {}

  /**
   * Enfileira sincronização de pedidos para uma loja
   */
  async enqueueSyncOrders(storeId: string) {
    try {
      const job = await this.syncQueue.add(
        'sync-mercadolivre-orders',
        { storeId },
        {
          priority: 10,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`📝 Job enfileirado: sync-mercadolivre-orders (${job.id})`);
      return job;
    } catch (error) {
      this.logger.error(`❌ Erro ao enfileirar sync-mercadolivre-orders: ${error}`);
      throw error;
    }
  }

  /**
   * Enfileira sincronização de produtos para uma loja
   */
  async enqueueSyncProducts(storeId: string) {
    try {
      const job = await this.syncQueue.add(
        'sync-mercadolivre-products',
        { storeId },
        {
          priority: 10,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`📝 Job enfileirado: sync-mercadolivre-products (${job.id})`);
      return job;
    } catch (error) {
      this.logger.error(`❌ Erro ao enfileirar sync-mercadolivre-products: ${error}`);
      throw error;
    }
  }

  /**
   * Enfileira renovação de tokens do Mercado Livre
   */
  async enqueueRefreshTokens() {
    try {
      const job = await this.syncQueue.add(
        'refresh-ml-tokens',
        {},
        {
          priority: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`📝 Job enfileirado: refresh-ml-tokens (${job.id})`);
      return job;
    } catch (error) {
      this.logger.error(`❌ Erro ao enfileirar refresh-ml-tokens: ${error}`);
      throw error;
    }
  }

  /**
   * Enfileira processamento de resposta de suporte
   */
  async enqueueSupportResponse(supportId: string, response: string) {
    try {
      const job = await this.syncQueue.add(
        'process-support-response',
        { supportId, response },
        {
          priority: 1,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`📝 Job enfileirado: process-support-response (${job.id})`);
      return job;
    } catch (error) {
      this.logger.error(`❌ Erro ao enfileirar process-support-response: ${error}`);
      throw error;
    }
  }

  /**
   * Retorna estatísticas das filas
   */
  async getQueueStats() {
    const [syncCount, ordersCount, productsCount] = await Promise.all([
      this.syncQueue.count(),
      this.ordersQueue.count(),
      this.productsQueue.count(),
    ]);

    return {
      sync: syncCount,
      orders: ordersCount,
      products: productsCount,
      total: syncCount + ordersCount + productsCount,
    };
  }

  /**
   * Limpa todas as filas (útil para testes/desenvolvimento)
   */
  async clearQueues() {
    await Promise.all([
      this.syncQueue.clean(0, 'completed'),
      this.syncQueue.clean(0, 'failed'),
      this.ordersQueue.clean(0, 'completed'),
      this.ordersQueue.clean(0, 'failed'),
      this.productsQueue.clean(0, 'completed'),
      this.productsQueue.clean(0, 'failed'),
    ]);

    this.logger.log('🗑️ Filas limpas');
  }
}
