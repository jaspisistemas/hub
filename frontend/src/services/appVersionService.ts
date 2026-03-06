import { apiFetch } from './api';

export interface VersaoStatus {
  hasNovaVersao: boolean;
  versaoDisponivel: string | null;
  podeAtualizar: boolean;
}

export interface BuscarAtualizacoesResult {
  temNova: boolean;
  versaoAtual: string;
  versaoDisponivel?: string;
  mensagem: string;
}

export const appVersionService = {
  getVersaoSistema: async (): Promise<{ version: string }> => {
    return apiFetch<{ version: string }>('/app-version/versao-sistema', { needsAuth: false });
  },

  getStatusAtualizacao: async (): Promise<{ concluida: boolean }> => {
    return apiFetch<{ concluida: boolean }>('/app-version/status-atualizacao', { needsAuth: false });
  },

  getVersaoNovaStatus: async (): Promise<VersaoStatus> => {
    return apiFetch<VersaoStatus>('/app-version/versao-nova-status');
  },

  buscarAtualizacoes: async (): Promise<BuscarAtualizacoesResult> => {
    return apiFetch<BuscarAtualizacoesResult>('/app-version/buscar-atualizacoes', {
      method: 'POST',
    });
  },

  executarAtualizacao: async (): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>('/app-version/executar-atualizacao', {
      method: 'POST',
    });
  },

  getChangelogUrl: (): string => {
    return `${window.location.origin}/CHANGELOG.md`;
  },

  fetchChangelog: async (): Promise<string> => {
    const url = appVersionService.getChangelogUrl();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Não foi possível carregar o histórico de alterações');
    return res.text();
  },
};
