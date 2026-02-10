import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
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
            products.push({
              sku: item.id,
              name: item.title,
              price: item.price,
              quantity: item.available_quantity,
              category: item.category_id,
              imageUrl: item.pictures?.[0]?.url || item.thumbnail || null,
              imageUrls: item.pictures?.map((pic: any) => pic.url || pic.secure_url).filter(Boolean) || [],
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
  async getQuestions(storeId: string) {
    // Buscar a store para obter o accessToken
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
        } catch (error) {
          console.error(`❌ Erro ao renovar token ML: ${error.message}`);
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    try {
      // Buscar perguntas dos últimos 60 dias com paginação
      let offset = 0;
      const limit = 50;
      let hasMore = true;
      const allQuestions = [];

      // Buscar até 200 perguntas (4 páginas)
      while (hasMore && offset < 200) {
        const response = await fetch(
          `https://api.mercadolibre.com/questions/search?seller_id=${Store.mlUserId}&status=UNANSWERED&limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          const error = await response.text();
          console.error('❌ Erro ao buscar perguntas do ML:', error);
          break;
        }

        const data = await response.json();
        const questions = data.questions || [];
        
        if (questions.length === 0) {
          hasMore = false;
          break;
        }

        allQuestions.push(...questions);
        offset += limit;

        // Se retornou menos que o limite, não há mais páginas
        if (questions.length < limit) {
          hasMore = false;
        }
      }

      console.log(`✅ Total de ${allQuestions.length} perguntas não respondidas encontradas`);
      
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
    } catch (error) {
      console.error('❌ Erro ao buscar perguntas do ML:', error);
      throw new HttpException(
        'Erro ao buscar perguntas do Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Responde uma pergunta no Mercado Livre
   */
  async answerQuestion(storeId: string, questionId: string, answer: string) {
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
        } catch (error) {
          console.error(`❌ Erro ao renovar token ML: ${error.message}`);
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    try {
      const response = await fetch(
        `https://api.mercadolibre.com/answers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question_id: parseInt(questionId),
            text: answer,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao responder pergunta no ML:', error);
        throw new HttpException(
          'Erro ao responder pergunta no Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao responder pergunta no ML:', error);
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
        } catch (error) {
          console.error(`❌ Erro ao renovar token ML: ${error.message}`);
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    try {
      // Buscar pedidos dos últimos 60 dias (limite do ML)
      const messages = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;
      let totalOrdersProcessed = 0;

      console.log(`\n🔍 Iniciando busca de mensagens de pós-venda para loja: ${Store.name} (userId: ${Store.mlUserId})`);

      // Buscar até 200 pedidos (4 páginas) para cobrir mais histórico
      while (hasMore && offset < 200) {
        console.log(`  📄 Buscando página ${Math.floor(offset / limit) + 1}...`);
        
        const ordersResponse = await fetch(
          `https://api.mercadolibre.com/orders/search?seller=${Store.mlUserId}&limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          },
          );

        if (!ordersResponse.ok) {
          const error = await ordersResponse.text();
          console.error('❌ Erro ao buscar pedidos do ML:', error);
          break;
        }

        const ordersData = await ordersResponse.json();
        const orders = ordersData.results || [];
        
        if (orders.length === 0) {
          console.log(`  ℹ️ Nenhum pedido encontrado nesta página`);
          hasMore = false;
          break;
        }

        console.log(`  📦 Processando ${orders.length} pedidos (offset: ${offset})`);
        
        // Para cada pedido, buscar o pack de mensagens
        for (const order of orders) {
          totalOrdersProcessed++;
          try {
            const packResponse = await fetch(
              `https://api.mercadolibre.com/messages/packs/${order.id}/sellers/${Store.mlUserId}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              },
            );

            if (packResponse.ok) {
              const pack = await packResponse.json();
              console.log(`    🔗 Pack encontrado para pedido ${order.id}: ${pack.id}`);
              
              // Buscar mensagens do pack
              const messagesResponse = await fetch(
                `https://api.mercadolibre.com/messages/packs/${pack.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                },
              );

              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                const lastMessage = messagesData.messages?.[messagesData.messages.length - 1];
                
                if (lastMessage && lastMessage.from?.user_id !== Store.mlUserId) {
                  // Só adicionar se a última mensagem for do comprador
                  console.log(`    💬 Mensagem encontrada! Cliente: ${lastMessage.from.nickname}, Mensagem: "${lastMessage.text.substring(0, 50)}..."`);
                  messages.push({
                    packId: pack.id,
                    orderId: order.id.toString(),
                    orderTitle: order.order_items?.[0]?.item?.title || 'Pedido',
                    customerId: lastMessage.from.user_id,
                    customerName: lastMessage.from.nickname || 'Cliente',
                    lastMessage: lastMessage.text,
                    lastMessageDate: lastMessage.date_created,
                    origin: SupportOrigin.MERCADO_LIVRE,
                  });
                } else {
                  console.log(`    ✋ Pack sem mensagens do comprador (ou última mensagem foi do vendedor)`);
                }
              } else {
                console.log(`    ⚠️ Erro ao buscar mensagens do pack: ${messagesResponse.status}`);
              }
            } else {
              console.log(`    ⚠️ Pack não encontrado para pedido ${order.id}`);
            }
          } catch (error) {
            console.error(`    ❌ Erro ao buscar mensagens do pedido ${order.id}:`, error);
          }
        }

        offset += limit;
        
        // Se retornou menos que o limite, não há mais páginas
        if (orders.length < limit) {
          hasMore = false;
        }
      }

      console.log(`\n✅ Total de ${messages.length} mensagens de vendas encontradas (processados ${totalOrdersProcessed} pedidos)\n`);
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
        } catch (error) {
          console.error(`❌ Erro ao renovar token ML: ${error.message}`);
          throw new HttpException(
            'Token expirado. Por favor, reconecte a loja do Mercado Livre.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    }

    try {
      const response = await fetch(
        `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${Store.mlUserId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: {
              user_id: Store.mlUserId,
            },
            to: {
              user_id: 'buyer', // O comprador
            },
            text: message,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao enviar mensagem no ML:', error);
        throw new HttpException(
          'Erro ao enviar mensagem no Mercado Livre',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem no ML:', error);
      throw new HttpException(
        'Erro ao enviar mensagem no Mercado Livre',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
