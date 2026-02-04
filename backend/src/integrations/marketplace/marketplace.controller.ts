import { Controller, Post, Body, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MarketplaceService } from './marketplace.service';
import { OrdersService } from '../../domains/orders/orders.service';
import { StoresService } from '../../domains/stores/stores.service';

/**
 * Controller para receber webhooks e gerenciar integrações com marketplaces
 */
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly ordersService: OrdersService,
    private readonly storesService: StoresService,
  ) {}

  /**
   * Webhook do Mercado Livre
   * Recebe notificações de novos pedidos, atualizações, etc.
   */
  @Post('mercadolivre/webhook')
  async mercadoLivreWebhook(@Body() payload: any) {
    console.log('📦 Webhook MercadoLibre recebido:', payload);

    try {
      // O payload típico do ML contém: { resource, user_id, topic, application_id, attempts, sent, received }
      // Para pedidos: topic = "orders_v2" e resource = "/orders/{order_id}"
      
      if (payload.topic === 'orders_v2' || payload.topic === 'orders') {
        const userId = payload.user_id?.toString();
        const orderId = payload.resource?.split('/').pop();

        if (!userId || !orderId) {
          console.warn('⚠️ Webhook ML sem user_id ou order_id');
          return {
            success: true,
            message: 'Webhook recebido mas dados incompletos',
          };
        }

        // Buscar a loja pelo userId do ML
        const store = await this.storesService.findByMercadoLivreUserId(userId);
        
        if (!store || !store.mlAccessToken) {
          console.warn(`⚠️ Loja não encontrada ou sem token para user ${userId}`);
          return {
            success: false,
            message: 'Loja não autorizada',
          };
        }

        // Verificar se o token precisa ser renovado
        let accessToken = store.mlAccessToken;
        if (
          store.mlTokenExpiresAt &&
          this.marketplaceService.isTokenExpiring(Number(store.mlTokenExpiresAt))
        ) {
          console.log('🔄 Token ML expirando, renovando...');
          
          if (!store.mlRefreshToken) {
            console.error('❌ Refresh token não encontrado');
            return {
              success: false,
              message: 'Token expirado e refresh token não disponível',
            };
          }

          const newTokenData = await this.marketplaceService.refreshMercadoLivreToken(
            store.mlRefreshToken,
          );

          await this.storesService.updateMercadoLivreTokens(store.id, {
            accessToken: newTokenData.accessToken,
            refreshToken: newTokenData.refreshToken,
            expiresIn: newTokenData.expiresIn,
            userId: store.mlUserId!,
          });

          accessToken = newTokenData.accessToken;
          console.log('✅ Token ML renovado com sucesso');
        }

        // Buscar dados completos do pedido na API do ML
        const orderData = await this.marketplaceService.getMercadoLivreOrder(
          orderId,
          accessToken,
        );
        
        // Criar o pedido no sistema
        const order = await this.ordersService.createOrder(orderData);
        
        console.log(`✅ Pedido ML ${orderId} processado com sucesso`);
        
        return {
          success: true,
          orderId: order.id,
          message: 'Pedido do Mercado Livre processado com sucesso',
        };
      }

      return {
        success: true,
        message: 'Webhook recebido mas não processado (topic não implementado)',
      };
    } catch (error) {
      console.error('❌ Erro ao processar webhook ML:', error);
      throw error;
    }
  }

  /**
   * Webhook da Shopee
   */
  @Post('shopee/webhook')
  async shopeeWebhook(@Body() payload: any) {
    console.log('📦 Webhook Shopee recebido:', payload);

    try {
      const mappedOrder = this.marketplaceService.handleShopeeWebhook(payload);
      const order = await this.ordersService.createOrder(await mappedOrder);
      
      return {
        success: true,
        orderId: order.id,
        message: 'Pedido da Shopee processado com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro ao processar webhook Shopee:', error);
      throw error;
    }
  }

  /**
   * Endpoint de callback OAuth do Mercado Livre
   * Usado após o usuário autorizar a aplicação
   */
  @Get('mercadolivre/callback')
  async mercadoLivreCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      if (!code) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Código de autorização não fornecido',
        });
      }

      // Trocar code por access_token
      const tokenData = await this.marketplaceService.exchangeMercadoLivreCode(code);
      
      // Salvar ou atualizar loja com os tokens
      const store = await this.storesService.findOrCreateMercadoLivreStore(
        tokenData.userId,
        {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresIn: tokenData.expiresIn,
        },
      );

      console.log('✅ Loja ML autorizada com sucesso:', store.name);
      
      // Redirecionar para o frontend com sucesso
      return res.redirect(`http://localhost:5174/stores?ml_auth=success&store_id=${store.id}`);
    } catch (error) {
      console.error('❌ Erro no callback ML:', error);
      return res.redirect(`http://localhost:5174/stores?ml_auth=error`);
    }
  }

  /**
   * Iniciar processo de autorização OAuth com Mercado Livre
   */
  @Get('mercadolivre/auth')
  async mercadoLivreAuth(@Res() res: Response) {
    // Credenciais do Mercado Livre (em produção, usar variáveis de ambiente)
    const APP_ID = process.env.ML_APP_ID || 'YOUR_APP_ID';
    const REDIRECT_URI = encodeURIComponent(
      process.env.ML_REDIRECT_URI || 'http://localhost:3000/marketplace/mercadolivre/callback'
    );
    
    // URL de autorização do Mercado Livre
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}`;
    
    return res.redirect(authUrl);
  }

  /**
   * Endpoint de teste para simular recebimento de pedido do ML
   */
  @Post('mercadolivre/test-order')
  async testMercadoLivreOrder(@Body() customData?: any) {
    const mockPayload = {
      id: customData?.id || Math.floor(Math.random() * 1000000),
      total_amount: customData?.total_amount || 299.99,
      status: customData?.status || 'paid',
      buyer: {
        id: 123456,
        nickname: customData?.customer_name || 'TESTUSER',
        first_name: customData?.customer_name || 'Cliente Teste',
        email: customData?.customer_email || 'teste@example.com',
        phone: {
          number: customData?.customer_phone || '11999999999',
        },
      },
      shipping: {
        receiver_address: {
          city: {
            name: customData?.customer_city || 'São Paulo',
          },
          state: {
            id: customData?.customer_state || 'SP',
          },
          address_line: customData?.customer_address || 'Rua Teste, 123',
          zip_code: customData?.customer_zipcode || '01234-567',
        },
      },
      items: [
        {
          id: 'MLB123456789',
          title: customData?.product_name || 'Produto Teste ML',
          quantity: 1,
          unit_price: customData?.total_amount || 299.99,
        },
      ],
      ...customData,
    };

    const mapped = this.marketplaceService.handleMercadoLivreWebhook(mockPayload);
    const order = await this.ordersService.createOrder(await mapped);

    return {
      success: true,
      message: 'Pedido de teste criado com sucesso',
      order,
    };
  }
}
