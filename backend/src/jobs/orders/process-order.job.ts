import { Injectable } from '@nestjs/common';
import { OrdersService } from '../../domains/orders/orders.service';

/**
 * Job que processa um payload de pedido enfileirado.
 * - Deve rodar em um worker separado em produção
 * - Chama adapters (mapeamento) na camada de integrações e o serviço de domínio para aplicar regras.
 */
@Injectable()
export class ProcessOrderJob {
  constructor(private readonly ordersService: OrdersService) {}

  async process(data: any) {
    // data é esperado como um CreateOrderDto mapeado (saída do adapter)
    try {
      const order = await this.ordersService.createOrder(data);
      console.log('Processed order', order.id);
      return { success: true, id: order.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to process order', message);
      return { success: false, reason: message };
    }
  }
}
