import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  Alert,
  DialogContentText,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { appVersionService, BuscarAtualizacoesResult } from '../../services/appVersionService';
import { useAtualizacao } from '../../contexts/AtualizacaoContext';

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
  versaoAtual?: string;
  podeAtualizar?: boolean;
  onAtualizar?: () => void;
}

export default function ChangelogModal({ open, onClose, versaoAtual, podeAtualizar = false, onAtualizar }: ChangelogModalProps) {
  const { iniciarAtualizacao } = useAtualizacao();
  const [changelog, setChangelog] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [buscarLoading, setBuscarLoading] = useState(false);
  const [buscarResult, setBuscarResult] = useState<BuscarAtualizacoesResult | null>(null);
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmarAberto, setConfirmarAberto] = useState(false);

  useEffect(() => {
    if (open) {
      setChangelog('');
      setBuscarResult(null);
      setErro(null);
      setLoading(true);
      appVersionService
        .fetchChangelog()
        .then(setChangelog)
        .catch(() => setErro('Não foi possível carregar o histórico de alterações'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handlePesquisar = async () => {
    setBuscarLoading(true);
    setErro(null);
    try {
      const result = await appVersionService.buscarAtualizacoes();
      setBuscarResult(result);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao pesquisar versão');
    } finally {
      setBuscarLoading(false);
    }
  };

  const handleConfirmarAtualizar = () => {
    setConfirmarAberto(true);
  };

  const handleAtualizar = async () => {
    setConfirmarAberto(false);
    setExecutando(true);
    setErro(null);
    try {
      await appVersionService.executarAtualizacao();
      iniciarAtualizacao();
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao executar atualização');
    } finally {
      setExecutando(false);
    }
  };

  const versao = buscarResult?.versaoAtual ?? versaoAtual ?? '—';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Histórico de alterações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Versão atual: {versao}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 320 }}>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro(null)}>
            {erro}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              '& h1': { fontSize: '1.25rem', mt: 2, mb: 1 },
              '& h2': { fontSize: '1.1rem', mt: 2, mb: 1 },
              '& h3': { fontSize: '1rem', mt: 1.5, mb: 0.5 },
              '& ul': { pl: 3 },
              '& li': { mb: 0.5 },
              '& p': { mb: 1 },
              '& hr': { my: 2 },
            }}
          >
            <ReactMarkdown>{changelog || '_Nenhum conteúdo disponível._'}</ReactMarkdown>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
        {podeAtualizar && (
          <>
            <Button
              variant="outlined"
              onClick={handlePesquisar}
              disabled={buscarLoading}
              startIcon={buscarLoading ? <CircularProgress size={16} /> : null}
            >
              {buscarLoading ? 'Pesquisando...' : 'Pesquisar versão'}
            </Button>
            {buscarResult?.temNova && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmarAtualizar}
                disabled={executando}
                startIcon={executando ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {executando ? 'Atualizando...' : `Atualizar para ${buscarResult.versaoDisponivel}`}
              </Button>
            )}
          </>
        )}
      </DialogActions>

      <Dialog
        open={confirmarAberto}
        onClose={() => !executando && setConfirmarAberto(false)}
        aria-labelledby="confirmar-atualizacao-title"
        aria-describedby="confirmar-atualizacao-desc"
      >
        <DialogTitle id="confirmar-atualizacao-title">Confirmar atualização</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirmar-atualizacao-desc">
            O sistema será reiniciado para aplicar a nova versão. Isso pode levar alguns minutos. Deseja continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarAberto(false)} disabled={executando}>
            Cancelar
          </Button>
          <Button onClick={handleAtualizar} variant="contained" color="primary" disabled={executando} autoFocus>
            {executando ? 'Iniciando...' : 'Sim, atualizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
