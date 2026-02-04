import { CreateOrderDto } from '../../../domains/orders/dto/create-order.dto';

/**
 * Adapter Shopee: exemplo simples de mapeamento
 */
export class ShopeeAdapter {
  mapOrder(payload: any): CreateOrderDto {
    return {
      externalId: payload.order_sn || 'sh-unknown',
      marketplace: 'shopee',
      total: Number(payload.total_amount) || 0,      customerName: payload.recipient_address?.name || 'Cliente Shopee',
      customerEmail: `shopee-${payload.order_sn}@marketplace.com`,
      customerPhone: payload.recipient_address?.phone,
      customerCity: payload.recipient_address?.city,
      customerState: payload.recipient_address?.state,
      customerAddress: payload.recipient_address?.full_address,
      customerZipCode: payload.recipient_address?.zipcode,      raw: payload,
    };
  }
}
