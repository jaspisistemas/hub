import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { DATE_CONSTANTS } from '@hub/shared';
import { MercadoLivreAdapter } from './adapters/mercadolivre.adapter';
import { ShopeeAdapter } from './adapters/shopee.adapter';
import { StoresService } from '../../domains/stores/stores.service';
import { SupportOrigin } from '../../domains/support/entities/support.entity';

/**
 * MarketplaceService: orquestra o mapeamento dos adapters e enfileira o job para processamento.
 * OBS: Regras de negócio NÃO devem ficar nos adapters nem aqui — elas pertencem aos serviços de domínio.
 */
@Injectable()
export class MarketplaceService {
  constructor(
    private readonly mlAdapter: MercadoLivreAdapter,
    private readonly shopeeAdapter: ShopeeAdapter,
    @Inject(forwardRef(() => StoresService))
    private readonly storesService: StoresService,
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

      // Se o pedido traz apenas o shipping.id ou não tem substatus, buscar o shipment
      try {
        const shippingId = orderData?.shipping?.id;
        const hasReceiverAddress = !!orderData?.shipping?.receiver_address;
        const hasSubstatus = !!orderData?.shipping?.substatus;

        if (shippingId && (!hasReceiverAddress || !hasSubstatus)) {
          const shipmentResponse = await fetch(
            `https://api.mercadolibre.com/shipments/${shippingId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            },
          );

          if (shipmentResponse.ok) {
            const shipmentData = await shipmentResponse.json();
            orderData.shipping = {
              ...orderData.shipping,
              receiver_address: shipmentData?.receiver_address || orderData.shipping?.receiver_address,
              shipping_cost: shipmentData?.shipping_cost ?? orderData.shipping?.shipping_cost,
              cost: shipmentData?.cost ?? orderData.shipping?.cost,
              status: shipmentData?.status || orderData.shipping?.status,
              substatus: shipmentData?.substatus || orderData.shipping?.substatus,
            };
          } else {
            const error = await shipmentResponse.text();
            console.warn(`⚠️ Erro ao buscar shipment ${shippingId}:`, error);
          }
        }
      } catch (shippingError) {
        console.warn('⚠️ Falha ao enriquecer shipping do pedido ML:', shippingError);
      }

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
   * Baixa etiqueta de envio do Mercado Livre em PDF
   */
  async getMercadoLivreShipmentLabel(shipmentId: string, accessToken: string) {
    try {
      const response = await fetch(
        `https://api.mercadolibre.com/shipment_labels?shipment_ids=${shipmentId}&response_type=pdf`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Erro ao buscar etiqueta do shipment ${shipmentId}:`, error);
        throw new HttpException(
          'Erro ao buscar etiqueta do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const contentType = response.headers.get('content-type') || 'application/pdf';

      if (contentType.includes('application/json')) {
        const errorJson = await response.json();
        console.error(`❌ Resposta JSON inesperada ao buscar etiqueta ${shipmentId}:`, errorJson);
        throw new HttpException(
          errorJson?.message || 'Resposta invalida ao buscar etiqueta do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!buffer.length || buffer.length < 200) {
        console.error(`❌ Etiqueta vazia ou muito pequena (${buffer.length} bytes) para shipment ${shipmentId}`);
        throw new HttpException(
          'Etiqueta vazia retornada pelo Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        buffer,
        contentType,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar etiqueta do ML:', error);
      throw new HttpException(
        'Erro ao buscar etiqueta do Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca detalhes do shipment do Mercado Livre
   */
  async getMercadoLivreShipment(storeId: string, shippingId: string) {
    const Store = await this.getStoreEntity(storeId);

    if (!Store?.mlAccessToken) {
      throw new HttpException(
        'Loja não possui token de acesso ao Mercado Livre',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Renovar token se estiver expirado
    let accessToken = Store.mlAccessToken;
    if (Store.mlTokenExpiresAt && Store.mlRefreshToken) {
      const now = Date.now();
      if (now > Store.mlTokenExpiresAt - 5 * 60 * 1000) {
        try {
          const tokenData = await this.refreshMercadoLivreToken(Store.mlRefreshToken);
          accessToken = tokenData.accessToken;

          await this.storesService.update(Store.id, {
            mlAccessToken: tokenData.accessToken,
            mlRefreshToken: tokenData.refreshToken,
            mlTokenExpiresAt: Date.now() + tokenData.expiresIn * 1000,
          });
        } catch (error: any) {
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    const response = await fetch(
      `https://api.mercadolibre.com/shipments/${shippingId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new HttpException(
        `Erro ao buscar shipment do Mercado Livre: ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return response.json();
  }

  /**
   * Sincroniza pedidos do Mercado Livre do vendedor
   */
  async syncMercadoLivreOrders(mlUserId: string, accessToken: string, limit: number = 50) {
    try {
      const response = await fetch(
        `https://api.mercadolibre.com/orders/search?seller=${mlUserId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao listar pedidos do ML:', error);
        throw new HttpException(
          'Erro ao listar pedidos do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      const results = data.results || [];
      const orders = [];

      for (const item of results) {
        const orderId = item.id || item.order_id;
        if (!orderId) continue;
        try {
          const mapped = await this.getMercadoLivreOrder(orderId.toString(), accessToken);
          orders.push(mapped);
        } catch (error) {
          console.error(`❌ Erro ao buscar pedido ${orderId} do ML:`, error);
        }
      }

      return orders;
    } catch (error) {
      console.error('❌ Erro ao sincronizar pedidos do ML:', error);
      throw new HttpException(
        'Erro ao sincronizar pedidos do Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca informações do usuário/loja do Mercado Livre
   */
  async getMercadoLivreUser(userId: string, accessToken: string) {
    try {
      const response = await fetch(
        `https://api.mercadolibre.com/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Erro ao buscar usuário ${userId} do ML:`, error);
        throw new HttpException(
          'Erro ao buscar informações do usuário do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const userData = await response.json();
      return {
        id: userData.id,
        nickname: userData.nickname,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar usuário do ML:', error);
      throw new HttpException(
        'Erro ao buscar informações do usuário do Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca o nome real de um cliente do Mercado Livre pelo userId/nickname
   */
  async getCustomerRealName(userIdOrNickname: string | number, accessToken: string): Promise<string> {
    try {
      const response = await fetch(
        `https://api.mercadolibre.com/users/${userIdOrNickname}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        console.warn(`⚠️ Não foi possível buscar nome do cliente ${userIdOrNickname}, usando fallback`);
        return `Cliente #${userIdOrNickname}`;
      }

      const userData = await response.json();
      // Retorna nome completo se disponível, senão nickname
      return userData.first_name && userData.last_name 
        ? `${userData.first_name} ${userData.last_name}`
        : userData.nickname || `Cliente #${userIdOrNickname}`;
    } catch (error: any) {
      console.warn(`⚠️ Erro ao buscar nome do cliente:`, error?.message || String(error));
      return `Cliente #${userIdOrNickname}`;
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

  /**
   * Sincroniza produtos do Mercado Livre para o sistema
   */
  async syncMercadoLivreProducts(userId: string, accessToken: string) {
    try {
      // Buscar produtos ativos do vendedor
      const response = await fetch(
        `https://api.mercadolibre.com/users/${userId}/items/search?status=active&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao buscar produtos do ML:', error);
        throw new HttpException(
          'Erro ao buscar produtos do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      const itemIds = data.results || [];

      // Buscar detalhes de cada produto
      const products = [];
      for (const itemId of itemIds) {
        try {
          const itemResponse = await fetch(
            `https://api.mercadolibre.com/items/${itemId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            },
          );

          if (itemResponse.ok) {
            const item = await itemResponse.json();
            
            // Converter URLs de imagem para HTTPS (evita mixed content warnings)
            const ensureHttps = (url: string | null | undefined) => {
              if (!url) return undefined;
              return url.toString().replace(/^http:\/\//, 'https://');
            };
            
            products.push({
              sku: item.id,
              name: item.title,
              price: item.price,
              quantity: item.available_quantity,
              category: item.category_id,
              imageUrl: ensureHttps(item.pictures?.[0]?.url || item.thumbnail || null),
              imageUrls: (item.pictures?.map((pic: any) => ensureHttps(pic.url || pic.secure_url)).filter(Boolean)) || [],
              externalId: item.id,
              marketplace: 'mercadolivre',
            });
          }
        } catch (error) {
          console.error(`Erro ao buscar produto ${itemId}:`, error);
        }
      }

      return products;
    } catch (error) {
      console.error('❌ Erro ao sincronizar produtos do ML:', error);
      throw new HttpException(
        'Erro ao sincronizar produtos do Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cria um produto no Mercado Livre
   */
  async createMercadoLivreProduct(product: any, accessToken: string) {
    try {
      // Gerar family_name (obrigatório em algumas categorias)
      // Usa as primeiras 2-3 palavras do título ou o nome do produto
      const generateFamilyName = (productData: any): string => {
        const baseName = productData.name || productData.title || 'Produto';
        const words = baseName.trim().split(/\s+/);
        // Se tem 3+ palavras, pega as 2-3 primeiras; senão usa o nome completo
        if (words.length >= 3) {
          return words.slice(0, 3).join(' ');
        }
        return baseName.substring(0, 50); // Limita a 50 caracteres
      };

      // Montar payload no formato do ML
      const listing = {
        title: this.buildProductTitle(product), // Melhorar título automaticamente
        category_id: product.mlCategoryId || product.category || 'MLB1051', // Usar mlCategoryId do produto ou padrão
        price: product.price,
        currency_id: 'BRL',
        available_quantity: product.quantity,
        buying_mode: 'buy_it_now',
        condition: 'new',
        listing_type_id: 'gold_special', // free, bronze, silver, gold_special, gold_premium, gold_pro
        family_name: product.familyName || generateFamilyName(product), // Campo obrigatório em algumas categorias
        description: {
          plain_text: product.description || `${product.name}\n\nSKU: ${product.sku}`,
        },
        pictures: [] as Array<{ source: string }>,
        attributes: [] as Array<{ id: string; value_name?: string; values?: Array<{ id: string }> }>,
        shipping: {
          mode: 'me2', // Mercado Envios
          local_pick_up: false,
          free_shipping: false,
        },
      };

      // Adicionar imagens (ML aceita URLs públicas)
      if (product.imageUrls && product.imageUrls.length > 0) {
        listing.pictures = product.imageUrls
          .filter((url: string) => url.startsWith('http'))
          .map((url: string) => ({ source: url }))
          .slice(0, 10); // ML limita a 10 imagens
      }

      // Adicionar atributos do ML salvos
      if (product.mlAttributes && Object.keys(product.mlAttributes).length > 0) {
        console.log('📦 mlAttributes do produto:', product.mlAttributes);
        for (const [attrId, attrValue] of Object.entries(product.mlAttributes)) {
          if (attrValue) {
            // Se o valor é um array, assume que são valores de atributo com múltiplas seleções
            if (Array.isArray(attrValue)) {
              listing.attributes.push({
                id: attrId,
                values: attrValue.map(v => ({ id: v })),
              });
            } else {
              // Caso contrário, é um valor simples
              listing.attributes.push({
                id: attrId,
                value_name: String(attrValue),
              });
            }
          }
        }
        console.log('📦 Atributos adicionados ao listing:', listing.attributes);
      } else {
        console.warn('⚠️ Produto sem mlAttributes!');
      }

      // Adicionar atributos básicos se não fornecidos nos mlAttributes
      const attrIds = listing.attributes.map(a => a.id);

      if (!attrIds.includes('SELLER_SKU') && product.sku) {
        listing.attributes.push({
          id: 'SELLER_SKU',
          value_name: product.sku,
        });
      }

      // Adicionar marca (obrigatório para algumas categorias)
      if (!attrIds.includes('BRAND')) {
        if (product.brand) {
          listing.attributes.push({
            id: 'BRAND',
            value_name: product.brand,
          });
        } else {
          // Valor padrão se não informado
          listing.attributes.push({
            id: 'BRAND',
            value_name: 'Genérico',
          });
        }
      }

      // Adicionar modelo (obrigatório para algumas categorias)
      if (!attrIds.includes('MODEL')) {
        if (product.model) {
          listing.attributes.push({
            id: 'MODEL',
            value_name: product.model,
          });
        } else {
          // Valor padrão se não informado
          listing.attributes.push({
            id: 'MODEL',
            value_name: product.sku || 'Padrão',
          });
        }
      }

      console.log('📦 Payload para criar produto no ML:', {
        title: listing.title,
        category_id: listing.category_id,
        family_name: listing.family_name,
        price: listing.price,
        attributes_count: listing.attributes.length,
        pictures_count: listing.pictures.length,
      });

      const response = await fetch('https://api.mercadolibre.com/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listing),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Erro ao criar produto no ML:', responseData);
        
        // Mensagem de erro mais específica
        let errorMessage = 'Erro ao criar produto no Mercado Livre';
        if (responseData.message) {
          errorMessage += `: ${responseData.message}`;
        }
        if (responseData.cause && responseData.cause.length > 0) {
          const causes = responseData.cause.map((c: any) => c.message).join(', ');
          errorMessage += ` - ${causes}`;
          
          // Verificar se faltam campos obrigatórios
          const missingRequired = responseData.cause.filter((c: any) => 
            c.code === 'item.attribute.missing_catalog_required'
          );
          
          if (missingRequired.length > 0) {
            console.warn('⚠️ Campos obrigatórios faltando:', missingRequired.map((c: any) => c.message));
            errorMessage += '\n\n💡 Dica: Preencha TODOS os campos obrigatórios ao criar o produto, incluindo Cor, Marca, Modelo, etc.';
          }
        }
        
        throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
      }

      console.log('✅ Produto criado no ML:', responseData.id);
      
      return {
        externalId: responseData.id,
        permalink: responseData.permalink,
        status: responseData.status,
      };
    } catch (error) {
      console.error('❌ Erro ao criar produto no ML:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erro ao criar produto no Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Buscar categorias principais do Mercado Livre Brasil
   */
  async getMercadoLivreCategories(accessToken: string) {
    try {
      console.log('🔍 Buscando categorias do ML...');
      const response = await fetch('https://api.mercadolibre.com/sites/MLB/categories', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta do ML:', errorText);
        throw new HttpException(
          `Erro ao buscar categorias do Mercado Livre: ${response.status}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const categories = await response.json();
      console.log(`✅ ${categories.length} categorias encontradas`);
      
      // Retornar categorias formatadas
      return categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar categorias ML:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erro ao buscar categorias',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Buscar subcategorias de uma categoria específica do ML
   */
  async getMercadoLivreSubcategories(categoryId: string, accessToken: string) {
    try {
      const response = await fetch(`https://api.mercadolibre.com/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new HttpException(
          'Erro ao buscar subcategorias do Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const categoryData = await response.json();
      
      // Se não tiver filhos, retornar a própria categoria
      if (!categoryData.children_categories || categoryData.children_categories.length === 0) {
        return [{
          id: categoryData.id,
          name: categoryData.name,
        }];
      }
      
      // Retornar subcategorias formatadas
      return categoryData.children_categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar subcategorias ML:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erro ao buscar subcategorias',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Buscar atributos de uma categoria específica do ML
   */
  async getMercadoLivreCategoryAttributes(categoryId: string, accessToken: string) {
    try {
      const response = await fetch(`https://api.mercadolibre.com/categories/${categoryId}/attributes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new HttpException(
          'Erro ao buscar atributos da categoria',
          HttpStatus.BAD_REQUEST,
        );
      }

      const attributes = await response.json();
      
      // Retornar atributos formatados
      return attributes.map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        value_type: attr.value_type,
        values: attr.values || [],
        tags: attr.tags || {},
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar atributos ML:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erro ao buscar atributos da categoria',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Construir título otimizado para o ML com brand, modelo e características
   */
  private buildProductTitle(product: any): string {
    const parts: string[] = [];
    
    // Adicionar brand (do mlAttributes ou do campo brand)
    const brand = product.mlAttributes?.BRAND || product.brand;
    if (brand && brand !== 'Genérico') {
      parts.push(brand);
    }
    
    // Adicionar nome do produto
    parts.push(product.name);
    
    // Adicionar modelo (do mlAttributes ou do campo model)
    const model = product.mlAttributes?.MODEL || product.model;
    if (model) {
      parts.push(model);
    }
    
    // Adicionar cor se disponível
    const color = product.mlAttributes?.COLOR;
    if (color) {
      parts.push(color);
    }
    
    // Juntar e limitar a 60 caracteres
    const title = parts.join(' ').substring(0, 60);
    console.log('📝 Título gerado:', title);
    
    return title;
  }

  /**
   * Busca perguntas não respondidas do Mercado Livre
   */
  /**
   * Busca perguntas do Mercado Livre seguindo a documentação oficial
   * Documentação: https://developers.mercadolivre.com.br/pt_br/gerenciamento-perguntas-respostas
   * Endpoint: GET /questions/search
   */
  async getQuestions(storeId: string) {
    console.log(`\n🔍 [QUESTIONS] Iniciando busca de perguntas para loja: ${storeId}`);
    
    // Buscar a store para obter o accessToken
    const Store = await this.getStoreEntity(storeId);
    
    if (!Store?.mlAccessToken || !Store?.mlUserId) {
      throw new HttpException(
        'Loja não possui token de acesso ou userId do Mercado Livre',
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log(`   📋 Loja: ${Store.name} (User ID: ${Store.mlUserId})`);

    // Renovar token se estiver expirado
    let accessToken = Store.mlAccessToken;
    if (Store.mlTokenExpiresAt && Store.mlRefreshToken) {
      const now = Date.now();
      if (now > Store.mlTokenExpiresAt - 5 * 60 * 1000) {
        console.log(`   🔄 Renovando token ML...`);
        try {
          const tokenData = await this.refreshMercadoLivreToken(Store.mlRefreshToken);
          accessToken = tokenData.accessToken;
          
          await this.storesService.update(Store.id, {
            mlAccessToken: tokenData.accessToken,
            mlRefreshToken: tokenData.refreshToken,
            mlTokenExpiresAt: Date.now() + tokenData.expiresIn * 1000,
          });
          console.log(`   ✅ Token renovado com sucesso`);
        } catch (error: any) {
          console.error(`   ❌ Erro ao renovar token ML: ${error?.message || String(error)}`);
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    try {
      const allQuestions = [];
      
      // Buscar perguntas do mês atual (últimos 30 dias)
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - DATE_CONSTANTS.DEFAULT_DATE_RANGE_DAYS);
      const dateFromISO = dateFrom.toISOString();
      
      console.log(`\n   📝 Buscando perguntas dos últimos ${DATE_CONSTANTS.DEFAULT_DATE_RANGE_DAYS} dias (desde ${dateFrom.toLocaleDateString('pt-BR')})...`);
      
      let offset = 0;
      const limit = 50; // Limite padrão da API
      let hasMore = true;
      let pageCount = 0;

      // Buscar até 200 perguntas (4 páginas)
      while (hasMore && offset < 200) {
        pageCount++;
        
        // Endpoint oficial: GET /questions/search com filtro de data
        const url = `https://api.mercadolibre.com/questions/search?seller_id=${Store.mlUserId}&limit=${limit}&offset=${offset}&api_version=4&date_from=${dateFromISO}`;
        
        console.log(`      🌐 Página ${pageCount}: offset=${offset}, limit=${limit}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        // Validar status HTTP esperado (200 para GET)
        if (response.status !== 200) {
          const errorText = await response.text();
          console.error(`      ❌ Erro HTTP ${response.status}: ${errorText.substring(0, 200)}`);
          break;
        }

        const data = await response.json();
        const questions = data.questions || [];
        
        if (questions.length === 0) {
          console.log(`      ℹ️ Nenhuma pergunta encontrada`);
          hasMore = false;
          break;
        }

        console.log(`      ✅ ${questions.length} pergunta(s) encontrada(s)`);
        
        // Logar detalhes para auditoria
        questions.forEach((q: any) => {
          console.log(`         • ID: ${q.id} | Status: ${q.status} | Item: ${q.item_id} | Data: ${q.date_created}`);
        });
        
        allQuestions.push(...questions);
        offset += limit;

        // Se retornou menos que o limite, não há mais páginas
        if (questions.length < limit) {
          hasMore = false;
        }
      }

      console.log(`\n   📊 Total: ${allQuestions.length} perguntas encontradas`);
      console.log(`✅ [QUESTIONS] Busca concluída com sucesso\n`);
      
      return allQuestions.map((q: any) => ({
        id: q.id.toString(),
        item_id: q.item_id,
        item_title: q.item?.title || 'Produto não identificado',
        text: q.text,
        status: q.status,
        date_created: q.date_created,
        from: q.from,
        answer: q.answer,
        origin: 'mercado_livre',
        type: 'pergunta',
      }));
    } catch (error: any) {
      console.error(`❌ [QUESTIONS] Erro ao buscar perguntas:`, error?.message || String(error));
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erro ao buscar perguntas do Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Responde uma pergunta no Mercado Livre seguindo a documentação oficial
   * Documentação: https://developers.mercadolivre.com.br/pt_br/gerenciamento-perguntas-respostas
   * Endpoint: POST /answers
   * Corpo: { "question_id": <id>, "text": "<resposta>" }
   */
  async answerQuestion(storeId: string, questionId: string, answer: string) {
    console.log(`\n📤 [ANSWER] Respondendo pergunta ID: ${questionId}`);
    console.log(`   📝 Resposta: "${answer.substring(0, 100)}${answer.length > 100 ? '...' : ''}"`);
    
    const Store = await this.getStoreEntity(storeId);
    
    if (!Store?.mlAccessToken) {
      throw new HttpException(
        'Loja não possui token de acesso ao Mercado Livre',
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log(`   🏪 Loja: ${Store.name}`);

    // Renovar token se estiver expirado
    let accessToken = Store.mlAccessToken;
    if (Store.mlTokenExpiresAt && Store.mlRefreshToken) {
      const now = Date.now();
      if (now > Store.mlTokenExpiresAt - 5 * 60 * 1000) {
        console.log(`   🔄 Renovando token ML...`);
        try {
          const tokenData = await this.refreshMercadoLivreToken(Store.mlRefreshToken);
          accessToken = tokenData.accessToken;
          
          await this.storesService.update(Store.id, {
            mlAccessToken: tokenData.accessToken,
            mlRefreshToken: tokenData.refreshToken,
            mlTokenExpiresAt: Date.now() + tokenData.expiresIn * 1000,
          });
          console.log(`   ✅ Token renovado`);
        } catch (error: any) {
          console.error(`   ❌ Erro ao renovar token ML: ${error?.message || String(error)}`);
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    try {
      // Validar limite de caracteres (máximo 2.000 conforme documentação)
      if (answer.length > 2000) {
        console.warn(`   ⚠️ Resposta truncada de ${answer.length} para 2000 caracteres`);
        answer = answer.substring(0, 2000);
      }

      // Endpoint oficial: POST /answers
      const url = 'https://api.mercadolibre.com/answers';
      
      // Corpo exato conforme documentação
      const body = {
        question_id: parseInt(questionId),
        text: answer,
      };

      console.log(`   🌐 POST ${url}`);
      console.log(`   📦 Body: ${JSON.stringify(body)}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Validar status HTTP esperado (201 para POST conforme documentação)
      if (response.status !== 201 && response.status !== 200) {
        const errorText = await response.text();
        console.error(`   ❌ Erro HTTP ${response.status}: ${errorText}`);
        
        // Tratar erros específicos da documentação
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            console.error(`   💬 Mensagem de erro: ${errorJson.message}`);
          }
        } catch (e) {
          // Erro não é JSON
        }
        
        throw new HttpException(
          `Erro ao responder pergunta no Mercado Livre: ${errorText.substring(0, 200)}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await response.json();
      
      // Log para auditoria conforme especificação
      console.log(`   ✅ Resposta enviada com sucesso!`);
      console.log(`      📋 Question ID: ${questionId}`);
      console.log(`      📊 Status retornado: ${result.status || 'N/A'}`);
      console.log(`      📅 Data: ${result.date_created || new Date().toISOString()}`);
      console.log(`✅ [ANSWER] Operação concluída\n`);
      
      return result;
    } catch (error: any) {
      console.error(`❌ [ANSWER] Erro ao responder pergunta:`, error?.message || String(error));
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erro ao responder pergunta no Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Método auxiliar para buscar a store
   */
  private async getStoreEntity(storeId: string) {
    return await this.storesService.findOne(storeId);
  }

  /**
   * Busca mensagens de vendas (packs) dos pedidos do Mercado Livre
   * Usando pack_id extraído dos orders para buscar as mensagens
   */
  async getOrderMessages(storeId: string) {
    const Store = await this.getStoreEntity(storeId);
    
    if (!Store?.mlAccessToken || !Store?.mlUserId) {
      throw new HttpException(
        'Loja não possui token de acesso ao Mercado Livre',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Renovar token se estiver expirado
    let accessToken = Store.mlAccessToken;
    if (Store.mlTokenExpiresAt && Store.mlRefreshToken) {
      const now = Date.now();
      if (now > Store.mlTokenExpiresAt - 5 * 60 * 1000) {
        console.log(`🔄 Renovando token ML da loja: ${Store.name}`);
        try {
          const tokenData = await this.refreshMercadoLivreToken(Store.mlRefreshToken);
          accessToken = tokenData.accessToken;
          
          await this.storesService.update(Store.id, {
            mlAccessToken: tokenData.accessToken,
            mlRefreshToken: tokenData.refreshToken,
            mlTokenExpiresAt: Date.now() + tokenData.expiresIn * 1000,
          });
          console.log('✅ Token renovado com sucesso');
        } catch (error: any) {
          console.error(`❌ Erro ao renovar token ML: ${error?.message || String(error)}`);
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    try {
      const messages = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      console.log(`\n🔍 Iniciando busca de mensagens de pós-venda para loja: ${Store.name} (userId: ${Store.mlUserId})`);

      // Buscar até 200 pedidos (4 páginas) para cobrir mais histórico
      while (hasMore && offset < 200) {
        console.log(`  📄 Buscando página ${Math.floor(offset / limit) + 1} de orders (offset: ${offset})...`);
        
        const ordersResponse = await fetch(
          `https://api.mercadolibre.com/orders/search?seller=${Store.mlUserId}&limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          },
        ) as any;

        if (!ordersResponse.ok) {
          const errorText = await ordersResponse.text();
          console.error(`❌ Erro ao buscar pedidos do ML (${ordersResponse.status}): ${errorText.substring(0, 100)}`);
          break;
        }

        const ordersData: any = await ordersResponse.json();
        const orders: any[] = ordersData.results || [];
        
        if (orders.length === 0) {
          console.log(`  ℹ️ Nenhum pedido encontrado nesta página`);
          hasMore = false;
          break;
        }

        console.log(`  📦 Processando ${orders.length} pedidos...`);
        
        // Para cada pedido, extrair pack_id e buscar as mensagens
        for (const order of orders) {
          try {
            // DEBUG: Log completo do order para ver estrutura
            console.log(`  📋 DEBUG - Estrutura do pedido ${order.id}:`, JSON.stringify({
              id: order.id,
              pack_id: order.pack_id,
              context: order.context,
              payments: order.payments?.map((p: any) => ({ id: p.id, pack_id: p.pack_id })),
              messages_available: !!order.messages
            }, null, 2));

            // Extrair pack_id do objeto order
            // O pack_id pode estar em diferentes locais dependendo da estrutura da API
            const packId: any = order.pack_id || 
                          order.context?.flow_id ||
                          order.payments?.[0]?.pack_id ||
                          order.messages?.pack_id;

            if (!packId) {
              console.log(`  ⏭️ Pedido ${order.id} - Sem pack_id disponível (talvez sem comunicação)`);
              continue;
            }

            console.log(`  🔗 Pedido: ${order.id}, Pack: ${packId} ${packId === '2000011363192693' ? '🎯 ENCONTRADO O PACK!' : ''}`);
            
            // Tentar buscar mensagens do pack com múltiplas tentativas
            let messagesResponse = null;
            let messagesData = null;
            let successUrl = null;
            
            const headers = {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            };

            // Lista de URLs para tentar - incluindo API de Claims
            const urlsToTry: any = [
              // API de Claims (usado para mensagens de pós-venda)
              `https://api.mercadolibre.com/v1/claims/${packId}`,
              `https://api.mercadolibre.com/claims/${packId}`,
              // API de Messages (antiga)
              `https://api.mercadolibre.com/messages/packs/${packId}`,
              `https://api.mercadolibre.com/messages/packs/${packId}/messages`,
              `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${Store.mlUserId}`,
              `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${Store.mlUserId}/messages`,
              // API de Orders com mensagens
              `https://api.mercadolibre.com/orders/${order.id}/messages`,
            ];

            // Tentar cada URL até encontrar uma que funcione
            for (let i = 0; i < urlsToTry.length; i++) {
              const url: any = urlsToTry[i];
              console.log(`    📨 Tentativa ${i + 1}: GET ${url}`);
              
              messagesResponse = await fetch(url, { headers });
              
              if (messagesResponse.ok) {
                successUrl = url;
                console.log(`    ✅ Sucesso com: ${url}`);
                break;
              } else {
                console.log(`    ❌ Status ${messagesResponse.status} - ${url}`);
              }
            }

            // Se nenhuma URL funcionou, logar e continuar
            if (!messagesResponse || !messagesResponse.ok) {
              const errorBody = messagesResponse ? await messagesResponse.text() : 'No response';
              console.log(`    ⚠️ Todas as tentativas falharam para Pack ${packId}`);
              console.log(`    📄 Última resposta: ${errorBody.substring(0, 200)}`);
              continue;
            }

            messagesData = await messagesResponse.json();
            console.log(`    📦 Estrutura da resposta:`, JSON.stringify(messagesData, null, 2).substring(0, 500));
            
            // A resposta pode ter diferentes estruturas dependendo da API
            let messagesList = [];
            
            // API de Claims (mensagens pós-venda)
            if (messagesData.conversation && messagesData.conversation.messages) {
              messagesList = messagesData.conversation.messages;
              console.log(`    🏷️ Resposta da API de Claims detectada`);
            }
            // API de Messages padrão
            else if (messagesData.messages) {
              messagesList = messagesData.messages;
              console.log(`    🏷️ Resposta da API de Messages detectada`);
            }
            // API de Orders com messages
            else if (messagesData.results) {
              messagesList = messagesData.results;
              console.log(`    🏷️ Resposta da API de Orders/Messages detectada`);
            }
            // Se a resposta for um pack com histórico de mensagens
            else if (messagesData.resource && messagesData.resource.messages) {
              messagesList = messagesData.resource.messages;
              console.log(`    🏷️ Resposta com resource.messages detectada`);
            }
            // Pode ser que a resposta seja diretamente um array
            else if (Array.isArray(messagesData)) {
              messagesList = messagesData;
              console.log(`    🏷️ Resposta direta como array detectada`);
            }
            
            // Validar se há mensagens
            if (!messagesList || messagesList.length === 0) {
              console.log(`    ℹ️ Pack ${packId} sem mensagens na resposta`);
              continue;
            }

            console.log(`    📝 Total de ${messagesList.length} mensagens encontradas no pack`);
            const lastMessage: any = messagesList[messagesList.length - 1];
            
            // Filtrar: só adicionar se a última mensagem for do comprador (não do vendedor)
            if (lastMessage.from?.user_id === Store.mlUserId) {
              console.log(`    ⏭️ Pack ${packId} - Última mensagem é do vendedor (ignorando)`);
              continue;
            }

            if (!lastMessage.from || !lastMessage.text) {
              console.log(`    ⚠️ Pack ${packId} - Mensagem sem dados completos (ignorando)`);
              continue;
            }

            console.log(`    ✅ Mensagem encontrada! Cliente: ${lastMessage.from.nickname}, Texto: "${lastMessage.text.substring(0, 50)}..."`);
            
            messages.push({
              packId: packId,
              orderId: order.id.toString(),
              orderTitle: order.order_items?.[0]?.item?.title || 'Pedido',
              customerId: lastMessage.from.user_id,
              customerName: lastMessage.from.nickname || 'Cliente',
              lastMessage: lastMessage.text,
              lastMessageDate: lastMessage.date_created,
              origin: SupportOrigin.MERCADO_LIVRE,
            });
          } catch (error: any) {
            console.error(`  ❌ Erro ao processar pedido ${order.id}:`, error?.message || String(error));
          }
        }

        offset += limit;
        
        // Se retornou menos que o limite, não há mais páginas
        if (orders.length < limit) {
          hasMore = false;
        }
      }

      console.log(`\n✅ Busca concluída! Total de ${messages.length} mensagens de vendas encontradas\n`);
      return messages;
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens de vendas do ML:', error);
      return [];
    }
  }

  /**
   * Envia mensagem em um pack de vendas do Mercado Livre
   */
  async sendOrderMessage(storeId: string, packId: string, message: string) {
    const Store = await this.getStoreEntity(storeId);
    
    if (!Store?.mlAccessToken) {
      throw new HttpException(
        'Loja não possui token de acesso ao Mercado Livre',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Renovar token se estiver expirado
    let accessToken = Store.mlAccessToken;
    if (Store.mlTokenExpiresAt && Store.mlRefreshToken) {
      const now = Date.now();
      if (now > Store.mlTokenExpiresAt - 5 * 60 * 1000) {
        console.log(`🔄 Renovando token ML da loja: ${Store.name}`);
        try {
          const tokenData = await this.refreshMercadoLivreToken(Store.mlRefreshToken);
          accessToken = tokenData.accessToken;
          
          await this.storesService.update(Store.id, {
            mlAccessToken: tokenData.accessToken,
            mlRefreshToken: tokenData.refreshToken,
            mlTokenExpiresAt: Date.now() + tokenData.expiresIn * 1000,
          });
          console.log('✅ Token renovado com sucesso');
        } catch (error: any) {
          console.error(`❌ Erro ao renovar token ML: ${error?.message || String(error)}`);
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    try {
      // Endpoint correto para enviar mensagem em um pack
      const sendUrl = `https://api.mercadolibre.com/messages/packs/${packId}`;
      
      console.log(`📤 Enviando mensagem para pack ${packId} na loja ${Store.name}`);
      
      const response = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Erro ao enviar mensagem no ML (${response.status}):`, error);
        throw new HttpException(
          'Erro ao enviar mensagem no Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await response.json();
      console.log(`✅ Mensagem enviada com sucesso para pack ${packId}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem no ML:', error);
      throw new HttpException(
        'Erro ao enviar mensagem no Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca detalhes de um pack específico (usado por webhooks)
   * Tenta múltiplos endpoints até encontrar um que funcione
   */
  async getPackDetails(storeId: string, packId: string) {
    const Store = await this.getStoreEntity(storeId);
    
    if (!Store?.mlAccessToken) {
      throw new HttpException(
        'Loja não possui token de acesso ao Mercado Livre',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Renovar token se estiver expirado
    let accessToken = Store.mlAccessToken;
    if (Store.mlTokenExpiresAt && Store.mlRefreshToken) {
      const now = Date.now();
      if (now > Store.mlTokenExpiresAt - 5 * 60 * 1000) {
        console.log(`🔄 Renovando token ML da loja: ${Store.name}`);
        try {
          const tokenData = await this.refreshMercadoLivreToken(Store.mlRefreshToken);
          accessToken = tokenData.accessToken;
          
          await this.storesService.update(Store.id, {
            mlAccessToken: tokenData.accessToken,
            mlRefreshToken: tokenData.refreshToken,
            mlTokenExpiresAt: Date.now() + tokenData.expiresIn * 1000,
          });
        } catch (error: any) {
          console.error(`❌ Erro ao renovar token ML: ${error?.message || String(error)}`);
        }
      }
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    };

    // Tentar múltiplos endpoints
    const urlsToTry = [
      `https://api.mercadolibre.com/v1/claims/${packId}`,
      `https://api.mercadolibre.com/claims/${packId}`,
      `https://api.mercadolibre.com/messages/packs/${packId}`,
      `https://api.mercadolibre.com/messages/packs/${packId}/messages`,
    ];

    for (const url of urlsToTry) {
      try {
        console.log(`🔍 Tentando: ${url}`);
        const response = await fetch(url, { headers });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Dados encontrados em: ${url}`);
          
          // Processar resposta baseado na estrutura
          let messagesList = [];
          
          if (data.conversation && data.conversation.messages) {
            messagesList = data.conversation.messages;
          } else if (data.messages) {
            messagesList = data.messages;
          } else if (data.results) {
            messagesList = data.results;
          } else if (Array.isArray(data)) {
            messagesList = data;
          }

          if (messagesList.length > 0) {
            const lastMessage = messagesList[messagesList.length - 1];
            
            return {
              packId: packId,
              orderId: data.order_id || data.resource?.order_id || null,
              orderTitle: 'Pedido',
              customerId: lastMessage.from?.user_id,
              customerName: lastMessage.from?.nickname || 'Cliente',
              lastMessage: lastMessage.text,
              lastMessageDate: lastMessage.date_created,
              origin: SupportOrigin.MERCADO_LIVRE,
            };
          }
        }
      } catch (error) {
        console.log(`❌ Falhou: ${url}`);
      }
    }

    console.log(`⚠️ Nenhum endpoint funcionou para pack ${packId}`);
    return null;
  }
}
