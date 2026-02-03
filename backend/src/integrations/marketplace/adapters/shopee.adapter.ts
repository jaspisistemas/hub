import { CreateOrderDto } from '../../../domains/orders/dto/create-order.dto';

/**
 * Adapter Shopee: exemplo simples de mapeamento
 */
export class ShopeeAdapter {
  mapOrder(payload: any): CreateOrderDto {
    return {
      externalId: payload.order_sn || 'sh-unknown',
      marketplace: 'shopee',
      total: Number(payload.total_amount) || 0,
      raw: payload,
    };
  }
}
