import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { appVersionService } from '../services/appVersionService';

interface AtualizacaoContextValue {
  emAtualizacao: boolean;
  versaoAtual: string | null;
  iniciarAtualizacao: () => void;
}

const AtualizacaoContext = createContext<AtualizacaoContextValue>({
  emAtualizacao: false,
  versaoAtual: null,
  iniciarAtualizacao: () => {},
});

const POLL_INTERVAL_MS = 15000;

export function AtualizacaoContextProvider({ children }: { children: React.ReactNode }) {
  const [emAtualizacao, setEmAtualizacao] = useState(false);
  const [versaoAtual, setVersaoAtual] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const { concluida } = await appVersionService.getStatusAtualizacao();
      if (concluida) {
        setEmAtualizacao(false);
        window.location.reload();
        return;
      }
      setEmAtualizacao(true);
    } catch {
      setEmAtualizacao(false);
    }
  }, []);

  const iniciarAtualizacao = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setEmAtualizacao(true);
    pollIntervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
  }, [checkStatus]);

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      try {
        const { concluida } = await appVersionService.getStatusAtualizacao();
        if (!mounted) return;
        if (concluida) {
          setEmAtualizacao(false);
          const { version } = await appVersionService.getVersaoSistema();
          setVersaoAtual(version);
        } else {
          setEmAtualizacao(true);
          intervalId = setInterval(checkStatus, POLL_INTERVAL_MS);
        }
      } catch {
        if (mounted) setEmAtualizacao(false);
      }
    };

    init();
    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [checkStatus]);

  return (
    <AtualizacaoContext.Provider value={{ emAtualizacao, versaoAtual, iniciarAtualizacao }}>
      {children}
    </AtualizacaoContext.Provider>
  );
}

export function useAtualizacao() {
  return useContext(AtualizacaoContext);
}
