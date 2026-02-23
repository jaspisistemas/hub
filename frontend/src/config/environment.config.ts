/**
 * Configuração dinâmica do Frontend
 * Lê a URL da API do arquivo config.js gerado em tempo de build
 */

// Funcao para obter a URL da API
export function getApiUrl(): string {
  // Tenta ler de uma variavel global setada em tempo de build
  if (typeof window !== 'undefined' && (window as any).API_URL) {
    return (window as any).API_URL;
  }

  const vitEnv = import.meta.env;
  if (vitEnv.VITE_API_URL) {
    return vitEnv.VITE_API_URL;
  }

  throw new Error('VITE_API_URL is required');
}

export const frontendConfig = {
  apiUrl: getApiUrl(),
};
