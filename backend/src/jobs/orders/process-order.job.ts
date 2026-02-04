import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { OrdersService } from '../../domains/orders/orders.service';
import { CreateOrderDto } from '../../domains/orders/dto/create-order.dto';

/**
 * Job que processa um payload de pedido enfileirado.
 * - Roda como worker do BullMQ
 * - Processa pedidos de forma assíncrona
 * - Aplica regras de negócio através do OrdersService
 */
@Processor('orders')
@Injectable()
export class ProcessOrderJob {
  private readonly logger = new Logger(ProcessOrderJob.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Process('create')
  async processCreateOrder(job: Job<CreateOrderDto>) {
    this.logger.log(`Processando pedido job #${job.id}`);
    
    try {
      const order = await this.ordersService.createOrder(job.data);
      this.logger.log(`Pedido ${order.id} criado com sucesso`);
      return { success: true, orderId: order.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      this.logger.error(`Falha ao processar pedido: ${message}`, err);
      throw err; // BullMQ vai retentar baseado nas configurações
    }
  }

  @Process('update-status')
  async processUpdateStatus(job: Job<{ orderId: string; status: string }>) {
    this.logger.log(`Atualizando status do pedido ${job.data.orderId} para ${job.data.status}`);
    
    try {
      // Aqui você implementaria a lógica de atualização de status
      // await this.ordersService.updateStatus(job.data.orderId, job.data.status);
      this.logger.log(`Status do pedido ${job.data.orderId} atualizado`);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      this.logger.error(`Falha ao atualizar status: ${message}`, err);
      throw err;
    }
  }
}
