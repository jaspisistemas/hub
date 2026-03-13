import { apiFetch, getApiBaseUrl } from './api';

export interface Store {
  id: string;
  name: string;
  marketplace: string;
  status: string;
  productsCount?: number;
  ordersCount?: number;
  revenue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStoreInput {
  name: string;
  marketplace: string;
  status: string;
  productsCount?: number;
  ordersCount?: number;
  revenue?: number;
}

export const storesService = {
  getAll: async (): Promise<Store[]> => {
    return apiFetch<Store[]>('/stores');
  },

  getOne: async (id: string): Promise<Store> => {
    return apiFetch<Store>(`/stores/${id}`);
  },

  create: async (store: CreateStoreInput): Promise<Store> => {
    return apiFetch<Store>('/stores', {
      method: 'POST',
      body: JSON.stringify(store),
    });
  },

  update: async (id: string, store: Partial<CreateStoreInput>): Promise<Store> => {
    return apiFetch<Store>(`/stores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(store),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/stores/${id}`, {
      method: 'DELETE',
    });
  },

  connectMercadoLivre: async () => {
    // Pegar o userId do usuário logado
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      throw new Error('Usuário não autenticado');
    }
    
    let user = JSON.parse(userStr);
    
    // Se companyId está null, buscar dados atualizados do servidor
    if (!user.companyId) {
      try {
        const profileData = await apiFetch('/auth/profile', { method: 'GET' });
        if (profileData && profileData.companyId) {
          user.companyId = profileData.companyId;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (err) {
        console.error('Erro ao buscar dados atualizados do usuário:', err);
      }
    }
    
    if (!user.id || !user.companyId) {
      throw new Error('Dados do usuário incompletos. Faça login novamente ou crie uma empresa.');
    }
    
    // Instruções para conectar conta diferente
    const conectarContaDiferente = window.confirm(
      '⚠️ ATENÇÃO: Para conectar uma CONTA DIFERENTE do Mercado Livre:\n\n' +
      '1. Abra uma aba anônima/privada do navegador\n' +
      '2. Vá para https://www.mercadolivre.com.br e faça LOGOUT\n' +
      '3. Volte aqui e clique novamente em "Conectar"\n\n' +
      'Ou se quiser conectar a MESMA conta que já está logada, clique OK para continuar.'
    );
    
    if (!conectarContaDiferente) {
      return;
    }
    
    // Limpar cookies do ML antes de fazer redirect
    document.cookie.split(";").forEach(c => {
      const cookieData = c.split("=");
      const cookieName = cookieData[0].trim();
      if (cookieName && !cookieName.includes('auth')) {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.mercadolivre.com.br`;
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=mercadolivre.com.br`;
      }
    });
    
    // Abrir autenticação na mesma aba para evitar popups que podem não fechar automaticamente
    const timestamp = Date.now();
    const baseUrl = getApiBaseUrl();
    const authUrl = `${baseUrl}/marketplace/mercadolivre/auth?userId=${user.id}&companyId=${user.companyId}&t=${timestamp}`;

    window.location.assign(authUrl);
  },

  disconnectMercadoLivre: async (storeId: string): Promise<void> => {
    return apiFetch<void>(`/stores/${storeId}/disconnect`, {
      method: 'POST',
    });
  },

  getMercadoLivreStores: async (): Promise<Store[]> => {
    return apiFetch<Store[]>('/stores/marketplace/mercadolivre');
  },
};
