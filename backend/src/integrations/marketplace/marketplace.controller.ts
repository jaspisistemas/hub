import { Controller, Post, Body, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MarketplaceService } from './marketplace.service';
import { OrdersService } from '../../domains/orders/orders.service';
import { StoresService } from '../../domains/stores/stores.service';
import { ProductsService } from '../../domains/products/products.service';
import { SupportService } from '../../domains/support/support.service';
import { QueueService } from '../../infra/queue/queue.service';

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
    private readonly supportService: SupportService,
    private readonly queueService: QueueService,
  ) {}

  private async syncMercadoLivreProductsForStore(store: any): Promise<number> {
    console.log(`🔄 Sincronizando produtos da loja: ${store.name}`);

    if (!store.mlUserId || !store.mlAccessToken) {
      console.warn(`⚠️ Loja ${store.name} sem credenciais válidas`);
      return 0;
    }

    // Renovar token se estiver expirado
    let accessToken = store.mlAccessToken;
    if (store.mlTokenExpiresAt && store.mlRefreshToken) {
      const now = Date.now();
      // Se expira em menos de 5 minutos, renovar agora
      if (now > store.mlTokenExpiresAt - 5 * 60 * 1000) {
        console.log(`🔄 Renovando token ML da loja: ${store.name}`);
        try {
          const tokenData = await this.marketplaceService.refreshMercadoLivreToken(store.mlRefreshToken);
          accessToken = tokenData.accessToken;

          // Atualizar token no banco de dados
          await this.storesService.update(store.id, {
            mlAccessToken: tokenData.accessToken,
            mlRefreshToken: tokenData.refreshToken,
            mlTokenExpiresAt: Date.now() + tokenData.expiresIn * 1000,
          });
          console.log(`✅ Token renovado com sucesso`);
        } catch (error: any) {
          console.error(`❌ Erro ao renovar token ML: ${error?.message || String(error)}`);
          return 0;
        }
      }
    }

    const products = await this.marketplaceService.syncMercadoLivreProducts(
      store.mlUserId,
      accessToken,
    );

    let totalProducts = 0;

    // Salvar ou atualizar cada produto
    for (const productData of products) {
      try {
        // Adicionar storeId ao produto
        (productData as any).storeId = store.id;

        // Verificar se produto já existe pelo SKU
        const existing = await this.productsService.findBySku(productData.sku);

        if (existing) {
          await this.productsService.update(existing.id, productData);
        } else {
          // Passar o userId da loja para criar o produto
          await this.productsService.create(productData, store.userId || '');
        }
        totalProducts++;
      } catch (error) {
        console.error(`Erro ao salvar produto ${productData.sku}:`, error);
      }
    }

    return totalProducts;
  }

  private async syncMercadoLivreOrdersForStore(store: any): Promise<{ imported: number; updated: number }> {
    console.log(`🔄 Sincronizando pedidos da loja: ${store.name}`);

    if (!store.mlUserId || !store.mlAccessToken) {
      console.warn(`⚠️ Loja ${store.name} sem credenciais válidas`);
      return { imported: 0, updated: 0 };
    }

    // Renovar token se estiver expirado
    let accessToken = store.mlAccessToken;
    if (store.mlTokenExpiresAt && store.mlRefreshToken) {
      const now = Date.now();
      if (now > store.mlTokenExpiresAt - 5 * 60 * 1000) {
        console.log(`🔄 Renovando token ML da loja: ${store.name}`);
        try {
          const tokenData = await this.marketplaceService.refreshMercadoLivreToken(store.mlRefreshToken);
          accessToken = tokenData.accessToken;

          await this.storesService.update(store.id, {
            mlAccessToken: tokenData.accessToken,
            mlRefreshToken: tokenData.refreshToken,
            mlTokenExpiresAt: Date.now() + tokenData.expiresIn * 1000,
          });
          console.log('✅ Token renovado com sucesso');
        } catch (error: any) {
          console.error(`❌ Erro ao renovar token ML: ${error?.message || String(error)}`);
          return { imported: 0, updated: 0 };
        }
      }
    }

    const orders = await this.marketplaceService.syncMercadoLivreOrders(
      store.mlUserId,
      accessToken,
    );

    let imported = 0;
    let updated = 0;

    for (const orderData of orders) {
      try {
        orderData.storeId = store.id;
        const result = await this.ordersService.upsertFromMarketplace(orderData);
        if (result.updated) updated++;
        else imported++;
      } catch (error) {
        console.error(`Erro ao salvar pedido ${orderData.externalId}:`, error);
      }
    }

    return { imported, updated };
  }

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
      // Para mensagens: topic = "messages" e resource = "/messages/{pack_id}"
      
      // Processar notificações de MENSAGENS
      if (payload.topic === 'messages') {
        const userId = payload.user_id?.toString();
        const packId = payload.resource?.split('/').pop();

        console.log(`📬 Nova mensagem ML - User: ${userId}, Pack: ${packId}`);

        if (!userId || !packId) {
          console.warn('⚠️ Webhook ML de mensagem sem user_id ou pack_id');
          return { success: true, message: 'Webhook recebido mas dados incompletos' };
        }

        // Buscar a loja pelo userId do ML
        const store = await this.storesService.findByMercadoLivreUserId(userId);
        
        if (!store || !store.mlAccessToken) {
          console.warn(`⚠️ Loja não encontrada ou sem token para user ${userId}`);
          return { success: false, message: 'Loja não autorizada' };
        }

        console.log(`✅ Mensagem recebida para loja: ${store.name}`);
        
        // Processar a mensagem e criar/atualizar registro de suporte
        const support = await this.supportService.processMessageFromWebhook(store.id, packId);
        
        if (support) {
          console.log(`✅ Mensagem processada com sucesso! Support ID: ${support.id}`);
          return { 
            success: true, 
            message: 'Mensagem processada com sucesso',
            supportId: support.id 
          };
        } else {
          console.log(`⚠️ Não foi possível processar a mensagem do pack ${packId}`);
          return { 
            success: true, 
            message: 'Webhook recebido mas mensagem não pôde ser processada' 
          };
        }
      }
      
      // Processar notificações de PEDIDOS
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
        orderData.storeId = store.id;
        
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
        const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/lojas?ml_auth=error&reason=no_code`;
        
        // Retornar HTML que notifica popup pai
        return res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.location.href = '${errorUrl}';
                  window.close();
                } else {
                  window.location.href = '${errorUrl}';
                }
              </script>
            </body>
          </html>
        `);
      }

      console.log('🔄 Trocando code por token...');
      // Trocar code por access_token
      const tokenData = await this.marketplaceService.exchangeMercadoLivreCode(code);
      console.log('✅ Token obtido, userId:', tokenData.userId);
      
      // Buscar informações do usuário/loja do ML
      console.log('🔄 Buscando informações da loja...');
      const userData = await this.marketplaceService.getMercadoLivreUser(
        tokenData.userId,
        tokenData.accessToken,
      );
      console.log('✅ Informações da loja obtidas:', userData.nickname);
      
      // Salvar ou atualizar loja com os tokens
      console.log('🔄 Salvando loja no banco...');
      
      // O state contém userId e companyId
      const { userId, companyId } = this.parseMercadoLivreState(state);

      if (!userId || !companyId) {
        throw new Error('userId ou companyId não encontrado no state');
      }
      
      const store = await this.storesService.findOrCreateMercadoLivreStore(
        tokenData.userId,
        userId,
        companyId,
        {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresIn: tokenData.expiresIn,
        },
        userData.nickname, // Passar o nome da loja
      );

      console.log('✅ Loja ML autorizada com sucesso:', store.name, 'ID:', store.id);
      
      // 🚀 Sincronizar produtos automaticamente após conectar
      console.log('🔄 Iniciando sincronização automática de produtos...');
      this.syncMercadoLivreProductsForStore(store).catch(err => {
        console.error('❌ Erro ao sincronizar produtos automaticamente:', err);
      });

      // 🚀 Sincronizar pedidos automaticamente após conectar
      console.log('🔄 Iniciando sincronização automática de pedidos...');
      this.syncMercadoLivreOrdersForStore(store).catch(err => {
        console.error('❌ Erro ao sincronizar pedidos automaticamente:', err);
      });

      // 🚀 Sincronizar suporte automaticamente após conectar
      console.log('🔄 Iniciando sincronização automática de suporte...');
      this.supportService.syncFromMarketplace(store.id).catch(err => {
        console.error('❌ Erro ao sincronizar suporte automaticamente:', err);
      });
      
      // Redirecionar para o frontend com sucesso
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/lojas?ml_auth=success&store_id=${store.id}`;
      console.log('🔄 Redirecionando para:', redirectUrl);
      
      // Retornar HTML que notifica popup pai e depois redireciona
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.location.href = '${redirectUrl}';
                window.close();
              } else {
                window.location.href = '${redirectUrl}';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('❌ Erro no callback ML:', error);
      const errorMsg = error instanceof Error ? error.message : 'unknown';
      
      // Verificar se é erro de loja já conectada
      let reason = encodeURIComponent(errorMsg);
      if (errorMsg.includes('já está conectada')) {
        reason = 'store_already_connected';
      }
      
      const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/lojas?ml_auth=error&reason=${reason}`;
      
      // Retornar HTML que notifica popup pai
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.location.href = '${errorUrl}';
                window.close();
              } else {
                window.location.href = '${errorUrl}';
              }
            </script>
          </body>
        </html>
      `);
    }
  }

  /**
   * Iniciar processo de autorização OAuth com Mercado Livre
   */
  @Get('mercadolivre/auth')
  async mercadoLivreAuth(
    @Query('userId') userId: string,
    @Query('companyId') companyId: string,
    @Query('t') timestamp: string,
    @Res() res: Response
  ) {
    console.log('🔄 Auth ML chamado, userId recebido:', userId, 'companyId:', companyId, 'timestamp:', timestamp);
    
    if (!userId || !companyId) {
      console.error('❌ userId ou companyId não fornecido');
      return res.status(400).json({ error: 'userId e companyId são obrigatórios' });
    }
    
    // Credenciais do Mercado Livre (em produção, usar variáveis de ambiente)
    const APP_ID = process.env.ML_APP_ID || 'YOUR_APP_ID';
    const REDIRECT_URI = encodeURIComponent(
      process.env.ML_REDIRECT_URI || 'http://localhost:3000/marketplace/mercadolivre/callback'
    );
    
    const statePayload = Buffer.from(JSON.stringify({ userId, companyId })).toString('base64url');
    console.log('✅ Redirecionando para ML com state (base64):', statePayload);
    
    // URL de autorização do Mercado Livre com parâmetros para força nova autenticação
    // - display=popup: Força abertura em contexto de popup (novo contexto de sessão)
    // - nonce: Token único para cada request
    // - timestamp na URL: Evita cache do navegador
    const nonce = timestamp || Date.now();
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&state=${encodeURIComponent(statePayload)}&display=popup&nonce=${nonce}&t=${timestamp}`;
    
    console.log('🔗 Enviando para:', authUrl);
    
    // Headers para evitar cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.redirect(authUrl);
  }

  private parseMercadoLivreState(state?: string): { userId?: string; companyId?: string } {
    if (!state) return {};

    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded);
      return {
        userId: parsed?.userId,
        companyId: parsed?.companyId,
      };
    } catch {
      // Fallback para estados antigos (apenas userId)
      return { userId: state };
    }
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
        const synced = await this.syncMercadoLivreProductsForStore(store);
        totalProducts += synced;
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
   * Sincronizar pedidos do Mercado Livre
   */
  @Post('mercadolivre/sync-orders')
  async syncMercadoLivreOrders() {
    try {
      // Buscar lojas do Mercado Livre conectadas
      const stores = await this.storesService.findAll();
      const mlStores = stores.filter(s => s.marketplace === 'MercadoLivre' && s.mlAccessToken);

      if (mlStores.length === 0) {
        return {
          success: false,
          message: 'Nenhuma loja do Mercado Livre conectada',
          imported: 0,
          updated: 0,
        };
      }

      let imported = 0;
      let updated = 0;

      // Sincronizar pedidos de cada loja
      for (const store of mlStores) {
        const { imported: incImported, updated: incUpdated } = await this.syncMercadoLivreOrdersForStore(store);
        imported += incImported;
        updated += incUpdated;
      }

      return {
        success: true,
        message: `${imported} novos, ${updated} atualizados`,
        imported,
        updated,
      };
    } catch (error) {
      console.error('❌ Erro ao sincronizar pedidos ML:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Falha ao sincronizar pedidos',
        imported: 0,
        updated: 0,
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
    const mappedOrder = await mapped;
    if (customData?.storeId) {
      mappedOrder.storeId = customData.storeId;
    }
    const order = await this.ordersService.createOrder(mappedOrder);

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
