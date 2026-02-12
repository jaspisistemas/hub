/**
 * Configuração dinâmica do Frontend
 * Lê a URL da API do arquivo config.js gerado em tempo de build
 */

// Função para obter a URL da API
export function getApiUrl(): string {
  // Tenta ler de uma variável global setada em tempo de build
  if (typeof window !== 'undefined' && (window as any).API_URL) {
    return (window as any).API_URL;
  }

  // Fallback para variáveis de ambiente do Vite
  const vitEnv = import.meta.env;
  if (vitEnv.VITE_API_URL) {
    return vitEnv.VITE_API_URL;
  }

  // Fallback para ambiente de desenvolvimento
  if (vitEnv.DEV) {
    return 'http://localhost:3000';
  }

  // Fallback para ambiente de produção (usar a mesma origem)
  return window.location.origin;
}

export const frontendConfig = {
  apiUrl: getApiUrl(),
};
