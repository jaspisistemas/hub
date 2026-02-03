import { CreateOrderDto } from '../../../domains/orders/dto/create-order.dto';

/**
 * Adapter MercadoLibre: mapeia payload externo -> CreateOrderDto interno
 * NÃO contém regras de negócio.
 */
export class MercadoLivreAdapter {
  mapOrder(payload: any): CreateOrderDto {
    // O payload pode vir de webhook (com resource) ou direto da API
    const orderId = payload.id || payload.resource?.split('/').pop() || 'ml-unknown';
    const totalAmount = payload.total_amount || payload.paid_amount || 0;
    
    return {
      externalId: orderId.toString(),
      marketplace: 'mercadolivre',
      total: Number(totalAmount),
      raw: payload,
    };
  }

  /**
   * Mapeia resposta da API de pedidos do ML
   * GET /orders/{id} retorna um objeto mais completo
   */
  mapOrderFromApi(orderData: any): CreateOrderDto {
    return {
      externalId: orderData.id?.toString() || 'ml-unknown',
      marketplace: 'mercadolivre',
      total: Number(orderData.total_amount) || 0,
      raw: {
        status: orderData.status,
        date_created: orderData.date_created,
        buyer: orderData.buyer,
        items: orderData.order_items,
        shipping: orderData.shipping,
        payments: orderData.payments,
      },
    };
  }
}
