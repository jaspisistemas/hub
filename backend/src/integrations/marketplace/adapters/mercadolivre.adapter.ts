import { CreateOrderDto } from '../../../domains/orders/dto/create-order.dto';

/**
 * Extrai apenas a sigla do estado de códigos como 'BR-SP' -> 'SP'
 */
function extractStateCode(stateId?: string): string | undefined {
  if (!stateId) return undefined;
  // Se tem formato 'BR-XX', pega só 'XX'
  if (stateId.includes('-')) {
    return stateId.split('-').pop();
  }
  return stateId;
}

/**
 * Adapter MercadoLibre: mapeia payload externo -> CreateOrderDto interno
 * NÃO contém regras de negócio.
 */
export class MercadoLivreAdapter {
  mapOrder(payload: any): CreateOrderDto {
    // O payload pode vir de webhook (com resource) ou direto da API
    const orderId = payload.id || payload.resource?.split('/').pop() || 'ml-unknown';
    const totalAmount = payload.total_amount || payload.paid_amount || 0;
    
    // Extrai a data de criação do pedido
    const dateCreated = payload.date_created || payload.date_closed;
    
    console.log('🔍 Mapeando pedido ML:', {
      orderId,
      hasBuyer: !!payload.buyer,
      buyerData: payload.buyer,
      hasShipping: !!payload.shipping,
      dateCreated,
    });
    
    const result = {
      externalId: orderId.toString(),
      marketplace: 'mercadolivre',
      total: Number(totalAmount),
      orderCreatedAt: dateCreated ? new Date(dateCreated) : undefined,
      customerName: payload.buyer?.nickname || payload.buyer?.first_name || 'Cliente ML',
      customerEmail: payload.buyer?.email || `ml-${orderId}@marketplace.com`,
      customerPhone: payload.buyer?.phone?.number,
      customerCity: payload.shipping?.receiver_address?.city?.name,
      customerState: extractStateCode(payload.shipping?.receiver_address?.state?.id),
      customerAddress: payload.shipping?.receiver_address?.address_line,
      customerZipCode: payload.shipping?.receiver_address?.zip_code,
      raw: payload,
    };
    
    console.log('📦 DTO criado:', result);
    
    return result;
  }

  /**
   * Mapeia resposta da API de pedidos do ML
   * GET /orders/{id} retorna um objeto mais completo
   */
  mapOrderFromApi(orderData: any): CreateOrderDto {
    const dateCreated = orderData.date_created || orderData.date_closed;
    
    return {
      externalId: orderData.id?.toString() || 'ml-unknown',
      marketplace: 'mercadolivre',
      total: Number(orderData.total_amount) || 0,
      orderCreatedAt: dateCreated ? new Date(dateCreated) : undefined,
      customerName: orderData.buyer?.nickname || orderData.buyer?.first_name || 'Cliente ML',
      customerEmail: orderData.buyer?.email || `ml-${orderData.id}@marketplace.com`,
      customerPhone: orderData.buyer?.phone?.number,
      customerCity: orderData.shipping?.receiver_address?.city?.name,
      customerState: extractStateCode(orderData.shipping?.receiver_address?.state?.id),
      customerAddress: orderData.shipping?.receiver_address?.address_line,
      customerZipCode: orderData.shipping?.receiver_address?.zip_code,
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
