import { Controller, Post, Body, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MarketplaceService } from './marketplace.service';
import { OrdersService } from '../../domains/orders/orders.service';

/**
 * Controller para receber webhooks e gerenciar integrações com marketplaces
 */
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly ordersService: OrdersService,
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
        // Mapear o payload usando o adapter
        const mappedOrder = this.marketplaceService.handleMercadoLivreWebhook(payload);
        
        // Criar o pedido no sistema
        const order = await this.ordersService.createOrder(await mappedOrder);
        
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

      // Aqui você trocaria o code por um access_token
      // const tokenData = await this.marketplaceService.exchangeMercadoLivreCode(code);
      
      console.log('✅ Autorização ML recebida, code:', code);
      
      // Redirecionar para o frontend com sucesso
      return res.redirect(`http://localhost:5174/stores?ml_auth=success`);
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
        nickname: 'TESTUSER',
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
