import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Send as SendIcon,
  QuestionAnswer as QuestionIcon,
  Star as StarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { supportService, Support, SupportFilters } from '../../services/supportService';
import { storesService } from '../../services/storesService';
import PageHeader from '../../components/PageHeader';

const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [supports, setSupports] = useState<Support[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<SupportFilters>({ daysRange: 30 });
  const [selectedSupport, setSelectedSupport] = useState<Support | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSupports();
    loadStores();
  }, [filters]);

  const loadSupports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[LOADSUPP] Filtros completos:', filters);
      console.log('[LOADSUPP] daysRange:', filters.daysRange, 'type:', typeof filters.daysRange);
      const data = await supportService.getAll(filters);
      console.log('Atendimentos carregados:', data);
      console.log('Filtros aplicados:', filters);
      setSupports(data);
    } catch (err: any) {
      console.error('Erro ao carregar atendimentos:', err);
      setError(err.response?.data?.message || 'Erro ao carregar atendimentos');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const data = await storesService.getAll();
      setStores(data);
    } catch (err) {
      console.error('Erro ao carregar lojas:', err);
    }
  };

  const handleSync = async () => {
    if (!filters.storeId) {
      setError('Selecione uma loja para sincronizar');
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      console.log('Sincronizando loja:', filters.storeId);
      const result = await supportService.sync(filters.storeId);
      console.log('Resultado da sincronização:', result);
      setSuccess(`Sincronização concluída: ${result.imported} novos, ${result.updated} atualizados`);
      
      // Aguardar um pouco para o backend processar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      loadSupports();
    } catch (err: any) {
      console.error('Erro ao sincronizar:', err);
      setError(err.response?.data?.message || 'Erro ao sincronizar atendimentos');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenAnswerDialog = (support: Support) => {
    setSelectedSupport(support);
    setAnswerText('');
    setAnswerDialogOpen(true);
  };

  const handleCloseAnswerDialog = () => {
    setSelectedSupport(null);
    setAnswerText('');
    setAnswerDialogOpen(false);
  };

  const handleAnswer = async () => {
    if (!selectedSupport || !answerText.trim()) {
      return;
    }

    try {
      setError(null);
      await supportService.answer(selectedSupport.id, { answer: answerText });
      setSuccess('Resposta enviada com sucesso!');
      handleCloseAnswerDialog();
      loadSupports();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar resposta');
    }
  };

  const getOriginLabel = (origin: string) => {
    const labels: Record<string, string> = {
      mercado_livre: 'Mercado Livre',
      shopee: 'Shopee',
      amazon: 'Amazon',
      outros: 'Outros',
    };
    return labels[origin] || origin;
  };

  const getTypeIcon = (type: string) => {
    if (type === 'mensagem_venda') return <SendIcon />;
    return type === 'pergunta' ? <QuestionIcon /> : <StarIcon />;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'mensagem_venda') return 'Mensagem de Venda';
    return type === 'pergunta' ? 'Pergunta' : 'Avaliação';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'success' | 'warning'> = {
      nao_respondido: 'warning',
      respondido: 'success',
      fechado: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      nao_respondido: 'Não Respondido',
      respondido: 'Respondido',
      fechado: 'Fechado',
    };
    return labels[status] || status;
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Atendimentos"
        subtitle="Gerencie perguntas, avaliações e dúvidas frequentes"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filtros */}
      <Card 
        sx={{ 
          mb: 3,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0d1117' : '#ffffff',
        }}
      >
        <CardContent sx={{ py: 2, px: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{ 
                    color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : 'rgba(0, 0, 0, 0.6)',
                    '&.Mui-focused': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                  }}
                >
                  Loja
                </InputLabel>
                <Select
                  value={filters.storeId === undefined ? '0' : filters.storeId}
                  label="Loja"
                  onChange={(e) => setFilters({ ...filters, storeId: e.target.value === '0' ? undefined : e.target.value })}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                        '& .MuiMenuItem-root': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                          '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#21262d' : '#f3f4f6',
                          },
                          '&.Mui-selected': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1f6feb' : '#e0f2fe',
                            '&:hover': {
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1f6feb' : '#bae6fd',
                            },
                          },
                        },
                      },
                    },
                  }}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                    color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#30363d' : undefined,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                    '& .MuiSelect-icon': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : undefined,
                    },
                  }}
                >
                  <MenuItem value="0">Todas</MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.type || ''}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) return 'Todos';
                    const typeMap: Record<string, string> = {
                      pergunta: 'Pergunta',
                      avaliacao: 'Avaliação',
                      mensagem_venda: 'Mensagem de Venda',
                    };
                    return typeMap[value] || value;
                  }}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                        '& .MuiMenuItem-root': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                          '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#21262d' : '#f3f4f6',
                          },
                          '&.Mui-selected': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1f6feb' : '#e0f2fe',
                            '&:hover': {
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1f6feb' : '#bae6fd',
                            },
                          },
                        },
                      },
                    },
                  }}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                    color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#30363d' : undefined,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                    '& .MuiSelect-icon': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : undefined,
                    },
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pergunta">Pergunta</MenuItem>
                  <MenuItem value="avaliacao">Avaliação</MenuItem>
                  <MenuItem value="mensagem_venda">Mensagem de Venda</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.status || ''}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) return 'Todos';
                    const statusMap: Record<string, string> = {
                      nao_respondido: 'Não Respondido',
                      respondido: 'Respondido',
                      fechado: 'Fechado',
                    };
                    return statusMap[value] || value;
                  }}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                        '& .MuiMenuItem-root': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                          '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#21262d' : '#f3f4f6',
                          },
                          '&.Mui-selected': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1f6feb' : '#e0f2fe',
                            '&:hover': {
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1f6feb' : '#bae6fd',
                            },
                          },
                        },
                      },
                    },
                  }}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                    color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#30363d' : undefined,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                    '& .MuiSelect-icon': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : undefined,
                    },
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="nao_respondido">Não Respondido</MenuItem>
                  <MenuItem value="respondido">Respondido</MenuItem>
                  <MenuItem value="fechado">Fechado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{ 
                    color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : 'rgba(0, 0, 0, 0.6)',
                    '&.Mui-focused': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                  }}
                >
                  Período
                </InputLabel>
                <Select
                  value={filters.daysRange === undefined ? '30' : filters.daysRange.toString()}
                  label="Período"
                  onChange={(e) => setFilters({ ...filters, daysRange: parseInt(e.target.value) })}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                        '& .MuiMenuItem-root': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                          '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#21262d' : '#f3f4f6',
                          },
                          '&.Mui-selected': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1f6feb' : '#e0f2fe',
                            '&:hover': {
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1f6feb' : '#bae6fd',
                            },
                          },
                        },
                      },
                    },
                  }}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                    color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#30363d' : undefined,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : undefined,
                    },
                    '& .MuiSelect-icon': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : undefined,
                    },
                  }}
                >
                  <MenuItem value="0">Todos</MenuItem>
                  <MenuItem value="3">Últimos 3 dias</MenuItem>
                  <MenuItem value="7">Últimos 7 dias</MenuItem>
                  <MenuItem value="30">Últimos 30 dias</MenuItem>
                  <MenuItem value="90">Últimos 90 dias</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={syncing ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={handleSync}
                disabled={syncing || !filters.storeId}
              >
                Sincronizar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Atendimentos */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : supports.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Nenhum atendimento encontrado
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {supports.map((support) => (
            <Grid item xs={12} key={support.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTypeIcon(support.type)}
                      <Chip
                        label={getTypeLabel(support.type)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Chip
                      label={getOriginLabel(support.origin)}
                      size="small"
                      color="info"
                    />
                    <Chip
                      label={getStatusLabel(support.status)}
                      size="small"
                      color={getStatusColor(support.status)}
                    />
                    {support.store && (
                      <Chip
                        label={support.store.name}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(support.questionDate).toLocaleString('pt-BR')}
                    </Typography>
                  </Box>

                  {support.productTitle && (
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Produto: {support.productTitle}
                    </Typography>
                  )}

                  <Typography variant="body2" gutterBottom>
                    <strong>{support.customerName}:</strong> {support.question}
                  </Typography>

                  {support.answer && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" color="success.main">
                        <strong>Sua resposta:</strong> {support.answer}
                      </Typography>
                      {support.answerDate && (
                        <Typography variant="caption" color="text.secondary">
                          Respondido em {new Date(support.answerDate).toLocaleString('pt-BR')}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {support.canAnswer && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenAnswerDialog(support)}
                        sx={{
                          textTransform: 'none',
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#30363d' : '#e5e7eb',
                          color: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                          '&:hover': {
                            borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : '#93c5fd',
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(88, 166, 255, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          },
                        }}
                      >
                        Ver Detalhes & Responder
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de Detalhes e Resposta */}
      <Dialog
        open={answerDialogOpen}
        onClose={handleCloseAnswerDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        <DialogTitle>
          Detalhes & Respostas
          <IconButton
            onClick={handleCloseAnswerDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ overflowY: 'auto' }}>
          {selectedSupport && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Informações da Mensagem */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Cliente:</strong> {selectedSupport.customerName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Tipo:</strong> {getTypeLabel(selectedSupport.type)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Status:</strong>{' '}
                  <Chip
                    label={getStatusLabel(selectedSupport.status)}
                    size="small"
                    variant="outlined"
                    color={selectedSupport.status === 'respondido' ? 'success' : 'warning'}
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Enviada em:</strong> {new Date(selectedSupport.questionDate).toLocaleString('pt-BR')}
                </Typography>
              </Box>

              {/* Pergunta/Mensagem Original */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: '4px solid',
                  borderColor: 'info.main',
                }}
              >
                <Typography variant="body2" gutterBottom>
                  <strong>{selectedSupport.type === 'mensagem_venda' ? 'Mensagem Original:' : 'Pergunta Original:'}:</strong>
                </Typography>
                <Typography variant="body2">{selectedSupport.question}</Typography>
              </Box>

              {/* Resposta Anterior (se existir) */}
              {selectedSupport.answer && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'success.lighter',
                    borderRadius: 1,
                    borderLeft: '4px solid',
                    borderColor: 'success.main',
                  }}
                >
                  <Typography variant="body2" color="success.main" gutterBottom>
                    <strong>✓ Sua Resposta Anterior:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {selectedSupport.answer}
                  </Typography>
                  {selectedSupport.answerDate && (
                    <Typography variant="caption" color="text.secondary">
                      Enviada em {new Date(selectedSupport.answerDate).toLocaleString('pt-BR')}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Campo Para Nova Resposta */}
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>
                    {selectedSupport.answer ? 'Enviar Resposta Adicional:' : 'Enviar Resposta:'}
                  </strong>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={7}
                  placeholder={selectedSupport.answer ? 'Digite uma resposta adicional...' : 'Digite sua resposta...'}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.95rem',
                    },
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnswerDialog}>Fechar</Button>
          <Button
            variant="contained"
            onClick={handleAnswer}
            disabled={!answerText.trim()}
            startIcon={<SendIcon />}
          >
            Enviar Resposta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportPage;
