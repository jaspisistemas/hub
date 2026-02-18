import { CreateOrderDto } from '../../../domains/orders/dto/create-order.dto';

/**
 * Adapter Shopee: exemplo simples de mapeamento
 */
export class ShopeeAdapter {
  mapOrder(payload: any): CreateOrderDto {
    // Extrai a data de criação do pedido (Shopee usa create_time em timestamp)
    const dateCreated = payload.create_time ? new Date(payload.create_time * 1000) : undefined;
    
    return {
      externalId: payload.order_sn || 'sh-unknown',
      marketplace: 'shopee',
      total: Number(payload.total_amount) || 0,
      orderCreatedAt: dateCreated,
      customerName: payload.recipient_address?.name || 'Cliente Shopee',
      customerEmail: payload.recipient_address?.email || payload.buyer?.email,
      customerPhone: payload.recipient_address?.phone,
      customerCity: payload.recipient_address?.city,
      customerState: payload.recipient_address?.state,
      customerAddress: payload.recipient_address?.full_address,
      customerZipCode: payload.recipient_address?.zipcode,
      raw: payload,
    };
  }
}
