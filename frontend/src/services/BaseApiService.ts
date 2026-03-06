/**
 * Service base genérico para operações CRUD
 * Elimina duplicação de métodos CRUD em múltiplos services
 */

import { apiFetch } from './api';

/**
 * Opções para configuração do BaseApiService
 */
export interface BaseApiServiceOptions {
  /** Endpoint base da API (ex: '/products', '/orders') */
  endpoint: string;
  
  /** Se true, adiciona trailing slash nas URLs (padrão: false) */
  trailingSlash?: boolean;
}

/**
 * Service base genérico com operações CRUD
 * 
 * @example
 * ```typescript
 * // Criar service específico extendendo BaseApiService
 * class ProductsApiService extends BaseApiService<Product, CreateProductDto, UpdateProductDto> {
 *   constructor() {
 *     super({ endpoint: '/products' });
 *   }
 *   
 *   // Adicionar métodos específicos
 *   async syncWithMarketplace(id: string): Promise<Product> {
 *     return this.fetch<Product>(`/${id}/sync`, { method: 'POST' });
 *   }
 * }
 * 
 * // Ou criar instância diretamente
 * const ordersService = new BaseApiService<Order, CreateOrderDto, UpdateOrderDto>({
 *   endpoint: '/orders'
 * });
 * ```
 */
export class BaseApiService<T = any, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  protected endpoint: string;
  protected trailingSlash: boolean;

  constructor(options: BaseApiServiceOptions) {
    this.endpoint = options.endpoint;
    this.trailingSlash = options.trailingSlash || false;
  }

  /**
   * Constrói URL completa para o endpoint
   * @param path - Caminho adicional (opcional)
   * @returns URL completa
   */
  protected buildUrl(path: string = ''): string {
    const url = `${this.endpoint}${path}`;
    return this.trailingSlash && !url.endsWith('/') ? `${url}/` : url;
  }

  /**
   * Wrapper para apiFetch com o endpoint configurado
   * @param path - Caminho adicional
   * @param options - Opções do fetch
   * @returns Promise com dados tipados
   */
  protected async fetch<R = any>(path: string = '', options?: RequestInit): Promise<R> {
    return apiFetch<R>(this.buildUrl(path), options);
  }

  /**
   * Lista todos os recursos
   * @returns Promise com array de recursos
   * 
   * @example
   * ```typescript
   * const products = await productsService.getAll();
   * ```
   */
  async getAll(): Promise<T[]> {
    return this.fetch<T[]>('');
  }

  /**
   * Busca um recurso por ID
   * @param id - ID do recurso
   * @returns Promise com o recurso encontrado
   * 
   * @example
   * ```typescript
   * const product = await productsService.getOne('123');
   * ```
   */
  async getOne(id: string): Promise<T> {
    return this.fetch<T>(`/${id}`);
  }

  /**
   * Cria um novo recurso
   * @param data - Dados para criação
   * @returns Promise com o recurso criado
   * 
   * @example
   * ```typescript
   * const newProduct = await productsService.create({
   *   name: 'Produto Novo',
   *   price: 99.90
   * });
   * ``
`   */
  async create(data: CreateDto): Promise<T> {
    return this.fetch<T>('', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Atualiza um recurso existente
   * @param id - ID do recurso
   * @param data - Dados para atualização
   * @returns Promise com o recurso atualizado
   * 
   * @example
   * ```typescript
   * const updated = await productsService.update('123', {
   *   price: 89.90
   * });
   * ```
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    return this.fetch<T>(`/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Deleta um recurso
   * @param id - ID do recurso
   * @returns Promise void
   * 
   * @example
   * ```typescript
   * await productsService.delete('123');
   * ```
   */
  async delete(id: string): Promise<void> {
    return this.fetch<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Upload de arquivo (FormData)
   * @param path - Caminho do endpoint (ex: '/upload', '/:id/upload')
   * @param formData - FormData com o arquivo
   * @returns Promise com resposta
   * 
   * @example
   * ```typescript
   * const formData = new FormData();
   * formData.append('file', file);
   * formData.append('name', 'Produto');
   * 
   * const result = await productsService.uploadFile('/upload', formData);
   * ```
   */
  async uploadFile<R = any>(path: string, formData: FormData): Promise<R> {
    return this.fetch<R>(path, {
      method: 'POST',
      body: formData,
      // Não definir Content-Type - o browser define automaticamente com boundary
    });
  }

  /**
   * Busca com query parameters
   * @param params - Objeto com parâmetros de busca
   * @returns Promise com array de recursos filtrados
   * 
   * @example
   * ```typescript
   * const products = await productsService.query({
   *   category: 'electronics',
   *   minPrice: 100,
   *   maxPrice: 500
   * });
   * ```
   */
  async query(params: Record<string, any>): Promise<T[]> {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const path = queryString ? `?${queryString}` : '';
    return this.fetch<T[]>(path);
  }

  /**
   * Executa operação customizada (POST)
   * @param action - Nome da ação (ex: 'sync', 'export')
   * @param id - ID do recurso (opcional)
   * @param data - Dados adicionais (opcional)
   * @returns Promise com resposta
   * 
   * @example
   * ```typescript
   * // POST /products/123/sync
   * await productsService.action('sync', '123');
   * 
   * // POST /orders/export
   * const file = await ordersService.action<Blob>('export', undefined, {
   *   format: 'csv',
   *   startDate: '2024-01-01'
   * });
   * ```
   */
  async action<R = any>(action: string, id?: string, data?: any): Promise<R> {
    const path = id ? `/${id}/${action}` : `/${action}`;
    
    const options: RequestInit = {
      method: 'POST',
    };

    if (data) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    }

    return this.fetch<R>(path, options);
  }
}

/**
 * Helper para criar instâncias de BaseApiService rapidamente
 * 
 * @param endpoint - Endpoint da API
 * @returns Instância do BaseApiService
 * 
 * @example
 * ```typescript
 * const storesService = createApiService<Store>('/stores');
 * const stores = await storesService.getAll();
 * ```
 */
export function createApiService<T = any, CreateDto = Partial<T>, UpdateDto = Partial<T>>(
  endpoint: string
): BaseApiService<T, CreateDto, UpdateDto> {
  return new BaseApiService<T, CreateDto, UpdateDto>({ endpoint });
}
