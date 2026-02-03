import { Injectable } from '@nestjs/common';
import { MercadoLivreAdapter } from './adapters/mercadolivre.adapter';
import { ShopeeAdapter } from './adapters/shopee.adapter';

/**
 * MarketplaceService: orquestra o mapeamento dos adapters e enfileira o job para processamento.
 * OBS: Regras de negócio NÃO devem ficar nos adapters nem aqui — elas pertencem aos serviços de domínio.
 */
@Injectable()
export class MarketplaceService {
  constructor(
    private readonly mlAdapter: MercadoLivreAdapter,
    private readonly shopeeAdapter: ShopeeAdapter,
  ) {}

  // Exemplo: receber payload bruto do webhook e criar um job na fila
  async handleMercadoLivreWebhook(payload: any) {
    const mapped = this.mlAdapter.mapOrder(payload);
    // enviar para a fila (simulado)
    console.log('Enqueue order from MercadoLibre', mapped.externalId);
    return mapped;
  }

  async handleShopeeWebhook(payload: any) {
    const mapped = this.shopeeAdapter.mapOrder(payload);
    console.log('Enqueue order from Shopee', mapped.externalId);
    return mapped;
  }
}
