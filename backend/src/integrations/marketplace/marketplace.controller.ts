import { Controller, Post, Body, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MarketplaceService } from './marketplace.service';
import { OrdersService } from '../../domains/orders/orders.service';
import { StoresService } from '../../domains/stores/stores.service';
import { ProductsService } from '../../domains/products/products.service';

/**
 * Controller para receber webhooks e gerenciar integrações com marketplaces
 */
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly ordersService: OrdersService,
    private readonly storesService: StoresService,
    private readonly productsService: ProductsService,
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
    console.log('🔄 Callback ML recebido:', { code: code ? 'presente' : 'ausente', state });
    
    try {
      if (!code) {
        console.error('❌ Code não fornecido no callback');
        return res.redirect(`https://panel-joshua-norfolk-molecular.trycloudflare.com/stores?ml_auth=error&reason=no_code`);
      }

      console.log('🔄 Trocando code por token...');
      // Trocar code por access_token
      const tokenData = await this.marketplaceService.exchangeMercadoLivreCode(code);
      console.log('✅ Token obtido, userId:', tokenData.userId);
      
      // Salvar ou atualizar loja com os tokens
      console.log('🔄 Salvando loja no banco...');
      
      // O state contém o userId que foi passado na URL de autenticação
      const userId = state;
      
      if (!userId) {
        throw new Error('userId não encontrado no state');
      }
      
      const store = await this.storesService.findOrCreateMercadoLivreStore(
        tokenData.userId,
        userId,
        {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresIn: tokenData.expiresIn,
        },
      );

      console.log('✅ Loja ML autorizada com sucesso:', store.name, 'ID:', store.id);
      
      // Redirecionar para o frontend com sucesso
      const redirectUrl = `https://panel-joshua-norfolk-molecular.trycloudflare.com/lojas?ml_auth=success&store_id=${store.id}`;
      console.log('🔄 Redirecionando para:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Erro no callback ML:', error);
      const errorMsg = error instanceof Error ? error.message : 'unknown';
      
      // Verificar se é erro de loja já conectada
      if (errorMsg.includes('já está conectada')) {
        return res.redirect(`https://panel-joshua-norfolk-molecular.trycloudflare.com/lojas?ml_auth=error&reason=store_already_connected`);
      }
      
      return res.redirect(`https://panel-joshua-norfolk-molecular.trycloudflare.com/lojas?ml_auth=error&reason=${encodeURIComponent(errorMsg)}`);
    }
  }

  /**
   * Iniciar processo de autorização OAuth com Mercado Livre
   */
  @Get('mercadolivre/auth')
  async mercadoLivreAuth(@Query('userId') userId: string, @Res() res: Response) {
    console.log('🔄 Auth ML chamado, userId recebido:', userId);
    
    if (!userId) {
      console.error('❌ userId não fornecido');
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    
    // Credenciais do Mercado Livre (em produção, usar variáveis de ambiente)
    const APP_ID = process.env.ML_APP_ID || 'YOUR_APP_ID';
    const REDIRECT_URI = encodeURIComponent(
      process.env.ML_REDIRECT_URI || 'http://localhost:3000/marketplace/mercadolivre/callback'
    );
    
    console.log('✅ Redirecionando para ML com state:', userId);
    
    // URL de autorização do Mercado Livre (passando userId no state)
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&state=${userId}`;
    
    return res.redirect(authUrl);
  }

  /**
   * Sincronizar produtos do Mercado Livre
   */
  @Post('mercadolivre/sync-products')
  async syncMercadoLivreProducts() {
    try {
      // Buscar lojas do Mercado Livre conectadas
      const stores = await this.storesService.findAll();
      const mlStores = stores.filter(s => s.marketplace === 'MercadoLivre' && s.mlAccessToken);

      if (mlStores.length === 0) {
        return {
          success: false,
          message: 'Nenhuma loja do Mercado Livre conectada',
          count: 0,
        };
      }

      let totalProducts = 0;

      // Sincronizar produtos de cada loja
      for (const store of mlStores) {
        console.log(`🔄 Sincronizando produtos da loja: ${store.name}`);
        
        if (!store.mlUserId || !store.mlAccessToken) {
          console.warn(`⚠️ Loja ${store.name} sem credenciais válidas`);
          continue;
        }
        
        const products = await this.marketplaceService.syncMercadoLivreProducts(
          store.mlUserId,
          store.mlAccessToken,
        );

        // Salvar ou atualizar cada produto
        for (const productData of products) {
          try {
            // Verificar se produto já existe pelo SKU
            const existing = await this.productsService.findBySku(productData.sku);
            
            if (existing) {
              await this.productsService.update(existing.id, productData);
            } else {
              await this.productsService.create(productData);
            }
            totalProducts++;
          } catch (error) {
            console.error(`Erro ao salvar produto ${productData.sku}:`, error);
          }
        }
      }

      return {
        success: true,
        message: `${totalProducts} produtos sincronizados com sucesso`,
        count: totalProducts,
      };
    } catch (error) {
      console.error('❌ Erro ao sincronizar produtos ML:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Falha ao sincronizar produtos',
        count: 0,
      };
    }
  }

  /**
   * Publicar produtos no Mercado Livre
   */
  @Post('mercadolivre/publish-products')
  async publishProductsToMercadoLivre(@Body() body: { productIds: string[]; brand?: string; model?: string }) {
    try {
      const { productIds, brand, model } = body;

      if (!productIds || productIds.length === 0) {
        return {
          success: false,
          message: 'Nenhum produto selecionado',
          count: 0,
        };
      }

      // Buscar lojas do Mercado Livre conectadas
      const stores = await this.storesService.findAll();
      const mlStores = stores.filter(s => s.marketplace === 'MercadoLivre' && s.mlAccessToken);

      if (mlStores.length === 0) {
        return {
          success: false,
          message: 'Nenhuma loja do Mercado Livre conectada',
          count: 0,
        };
      }

      // Usar a primeira loja conectada (pode ser melhorado para escolher)
      const store = mlStores[0];

      if (!store.mlAccessToken) {
        return {
          success: false,
          message: 'Token de acesso inválido',
          count: 0,
        };
      }

      let publishedCount = 0;

      // Publicar cada produto
      for (const productId of productIds) {
        try {
          let product = await this.productsService.findOne(productId);
          
          console.log('📦 Produto a ser publicado:', {
            id: product.id,
            name: product.name,
            mlCategoryId: product.mlCategoryId,
            mlAttributes: product.mlAttributes,
            brand: product.brand,
            model: product.model,
          });
          
          // Aplicar brand e model fornecidos no request ao produto
          if (brand) {
            product.brand = brand;
          }
          if (model) {
            product.model = model;
          }
          
          // Criar produto no ML
          const mlProduct = await this.marketplaceService.createMercadoLivreProduct(
            product,
            store.mlAccessToken,
          );

          // Atualizar produto local com ID externo e atributos
          await this.productsService.update(productId, {
            externalId: mlProduct.externalId,
            brand: brand || product.brand,
            model: model || product.model,
          });

          publishedCount++;
          console.log(`✅ Produto ${product.name} publicado no ML`);
        } catch (error) {
          console.error(`❌ Erro ao publicar produto ${productId}:`, error);
        }
      }

      return {
        success: true,
        message: `${publishedCount} produto(s) publicado(s) no Mercado Livre`,
        count: publishedCount,
      };
    } catch (error) {
      console.error('❌ Erro ao publicar produtos no ML:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Falha ao publicar produtos',
        count: 0,
      };
    }
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

  /**
   * Buscar categorias principais do Mercado Livre
   */
  @Get('mercadolivre/categories')
  async getMercadoLivreCategories(@Query('storeId') storeId: string) {
    try {
      // Buscar access token da loja
      const store = await this.storesService.findOne(storeId);
      if (!store?.mlAccessToken) {
        return {
          success: false,
          message: 'Loja não possui token do Mercado Livre',
        };
      }
      
      const categories = await this.marketplaceService.getMercadoLivreCategories(store.mlAccessToken);
      return {
        success: true,
        categories,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar categorias',
      };
    }
  }

  /**
   * Buscar subcategorias de uma categoria específica
   */
  @Get('mercadolivre/categories/:categoryId')
  async getMercadoLivreSubcategories(
    @Query('categoryId') categoryId: string,
    @Query('storeId') storeId: string,
  ) {
    try {
      if (!categoryId) {
        return {
          success: false,
          message: 'ID da categoria não fornecido',
        };
      }

      // Buscar access token da loja
      const store = await this.storesService.findOne(storeId);
      if (!store?.mlAccessToken) {
        return {
          success: false,
          message: 'Loja não possui token do Mercado Livre',
        };
      }
      
      const subcategories = await this.marketplaceService.getMercadoLivreSubcategories(categoryId, store.mlAccessToken);
      return {
        success: true,
        subcategories,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar subcategorias:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar subcategorias',
      };
    }
  }

  /**
   * Buscar atributos de uma categoria específica
   */
  @Get('mercadolivre/categories/:categoryId/attributes')
  async getMercadoLivreCategoryAttributes(
    @Query('categoryId') categoryId: string,
    @Query('storeId') storeId: string,
  ) {
    try {
      if (!categoryId) {
        return {
          success: false,
          message: 'ID da categoria não fornecido',
        };
      }

      // Buscar access token da loja
      const store = await this.storesService.findOne(storeId);
      if (!store?.mlAccessToken) {
        return {
          success: false,
          message: 'Loja não possui token do Mercado Livre',
        };
      }
      
      const attributes = await this.marketplaceService.getMercadoLivreCategoryAttributes(categoryId, store.mlAccessToken);
      return {
        success: true,
        attributes,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar atributos:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar atributos',
      };
    }
  }
}
