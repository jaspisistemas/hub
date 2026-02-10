import { Controller, Post, Get, Query } from '@nestjs/common';
import { QueueService } from './queue.service';

/**
 * Controller para gerenciar filas BullMQ
 * Útil para enfileirar jobs assíncronos
 */
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * GET /queue/stats - Retorna estatísticas das filas
   */
  @Get('stats')
  async getStats() {
    return await this.queueService.getQueueStats();
  }

  /**
   * POST /queue/sync-orders - Enfileira sincronização de pedidos
   */
  @Post('sync-orders')
  async syncOrders(@Query('storeId') storeId: string) {
    if (!storeId) {
      return { error: 'storeId é obrigatório' };
    }
    const job = await this.queueService.enqueueSyncOrders(storeId);
    return {
      message: 'Job enfileirado com sucesso',
      jobId: job.id,
      storeId,
    };
  }

  /**
   * POST /queue/sync-products - Enfileira sincronização de produtos
   */
  @Post('sync-products')
  async syncProducts(@Query('storeId') storeId: string) {
    if (!storeId) {
      return { error: 'storeId é obrigatório' };
    }
    const job = await this.queueService.enqueueSyncProducts(storeId);
    return {
      message: 'Job enfileirado com sucesso',
      jobId: job.id,
      storeId,
    };
  }

  /**
   * POST /queue/refresh-tokens - Enfileira renovação de tokens
   */
  @Post('refresh-tokens')
  async refreshTokens() {
    const job = await this.queueService.enqueueRefreshTokens();
    return {
      message: 'Job enfileirado com sucesso',
      jobId: job.id,
    };
  }
}
