import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateOrderDto } from '../../domains/orders/dto/create-order.dto';

/**
 * OrdersQueueService: responsável por enfileirar jobs relacionados a pedidos
 */
@Injectable()
export class OrdersQueueService {
  private readonly logger = new Logger(OrdersQueueService.name);

  constructor(
    @InjectQueue('orders') private readonly ordersQueue: Queue,
  ) {}

  /**
   * Enfileira um job para criar um pedido
   */
  async enqueueCreateOrder(dto: CreateOrderDto) {
    this.logger.log(`Enfileirando criação de pedido: ${dto.externalId || 'N/A'}`);
    
    const job = await this.ordersQueue.add('create', dto, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.log(`Job #${job.id} criado para pedido`);
    return job;
  }

  /**
   * Enfileira um job para atualizar o status de um pedido
   */
  async enqueueUpdateOrderStatus(orderId: string, status: string) {
    this.logger.log(`Enfileirando atualização de status: ${orderId} -> ${status}`);
    
    const job = await this.ordersQueue.add('update-status', { orderId, status }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    this.logger.log(`Job #${job.id} criado para atualização de status`);
    return job;
  }

  /**
   * Obtém estatísticas da fila
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.ordersQueue.getWaitingCount(),
      this.ordersQueue.getActiveCount(),
      this.ordersQueue.getCompletedCount(),
      this.ordersQueue.getFailedCount(),
      this.ordersQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
}
