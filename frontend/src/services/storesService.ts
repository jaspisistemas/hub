import { apiFetch } from './api';

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

  connectMercadoLivre: () => {
    // Pegar o userId do usuário logado
    const userStr = localStorage.getItem('user');
    console.log('User no localStorage:', userStr);
    
    if (!userStr) {
      throw new Error('Usuário não autenticado');
    }
    
    const user = JSON.parse(userStr);
    console.log('User parseado:', user);
    console.log('User ID:', user.id);
    
    if (!user.id) {
      throw new Error('ID do usuário não encontrado');
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
    
    // Abrir autenticação em uma POPUP separada
    const timestamp = Date.now();
    const authUrl = `https://uneducated-georgiann-personifiant.ngrok-free.dev/marketplace/mercadolivre/auth?userId=${user.id}&t=${timestamp}`;
    
    console.log('Abrindo popup de autenticação:', authUrl);
    
    // Abrir em popup (força novo contexto isolado)
    const popup = window.open(
      authUrl,
      'MercadoLivreAuth',
      'width=800,height=600,left=200,top=200'
    );
    
    if (!popup) {
      throw new Error('Não foi possível abrir a janela de autenticação. Verifique as permissões de popup do navegador.');
    }
    
    // Aguardar resposta da popup
    const checkPopup = setInterval(() => {
      try {
        // Verificar se popup foi fechada
        if (popup.closed) {
          clearInterval(checkPopup);
          console.log('Popup fechada. Recarregando lojas...');
        }
      } catch (e) {
        console.error('Erro ao monitorar popup:', e);
      }
    }, 1000);
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
