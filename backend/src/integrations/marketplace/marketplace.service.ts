import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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

  /**
   * Troca o código de autorização OAuth por um access_token do Mercado Livre
   */
  async exchangeMercadoLivreCode(code: string) {
    const APP_ID = process.env.ML_APP_ID;
    const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
    const REDIRECT_URI = process.env.ML_REDIRECT_URI;

    if (!APP_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new HttpException(
        'Credenciais do Mercado Livre não configuradas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: APP_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao trocar code por token ML:', error);
        throw new HttpException(
          'Erro ao obter token do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        userId: data.user_id,
      };
    } catch (error) {
      console.error('❌ Erro na troca de token ML:', error);
      throw new HttpException(
        'Erro ao autenticar com Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Renova o access_token usando o refresh_token
   */
  async refreshMercadoLivreToken(refreshToken: string) {
    const APP_ID = process.env.ML_APP_ID;
    const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

    if (!APP_ID || !CLIENT_SECRET) {
      throw new HttpException(
        'Credenciais do Mercado Livre não configuradas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: APP_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao renovar token ML:', error);
        throw new HttpException(
          'Erro ao renovar token do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      console.error('❌ Erro ao renovar token ML:', error);
      throw new HttpException(
        'Erro ao renovar token do Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca detalhes completos de um pedido do Mercado Livre
   */
  async getMercadoLivreOrder(orderId: string, accessToken: string) {
    try {
      const response = await fetch(
        `https://api.mercadolibre.com/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Erro ao buscar pedido ${orderId} do ML:`, error);
        throw new HttpException(
          'Erro ao buscar pedido do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const orderData = await response.json();
      return this.mlAdapter.mapOrderFromApi(orderData);
    } catch (error) {
      console.error('❌ Erro ao buscar pedido do ML:', error);
      throw new HttpException(
        'Erro ao buscar pedido do Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verifica se o token está expirado ou próximo de expirar
   * Retorna true se precisa renovar (expira em menos de 1 hora)
   */
  isTokenExpiring(expiresAt: number): boolean {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return expiresAt - now < oneHour;
  }
}
