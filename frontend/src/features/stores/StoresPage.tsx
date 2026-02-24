import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Storefront as StorefrontIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { storesService, Store } from '../../services/storesService';
import { productsService } from '../../services/productsService';
import { ordersService } from '../../services/ordersService';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import InlineError from '../../components/InlineError';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    marketplace: '',
    status: 'pending',
  });

  useEffect(() => {
    loadStores();
    
    // Verificar se veio do callback do ML
    const params = new URLSearchParams(window.location.search);
    const mlAuth = params.get('ml_auth');
    const storeId = params.get('store_id');
    const reason = params.get('reason');
    
    if (mlAuth === 'success') {
      setNotification(`✅ Mercado Livre conectado com sucesso! Loja ID: ${storeId}`);
      // Limpar URL
      window.history.replaceState({}, '', '/lojas');
      // Recarregar stores
      loadStores();
    } else if (mlAuth === 'error') {
      let errorMessage = '❌ Erro ao conectar Mercado Livre';
      
      if (reason === 'store_already_connected') {
        errorMessage = '❌ Esta conta do Mercado Livre já está conectada em outra conta do sistema';
      } else if (reason && reason.includes('já está conectada')) {
        errorMessage = '⚠️ Esta conta do Mercado Livre já está conectada. Para adicionar uma nova loja, faça logout da sua conta do Mercado Livre no navegador e entre com outra conta.';
      } else if (reason) {
        errorMessage = `❌ Erro ao conectar Mercado Livre: ${decodeURIComponent(reason)}`;
      }
      
      setErrorDialogMessage(errorMessage);
      setOpenErrorDialog(true);
      // Limpar URL
      window.history.replaceState({}, '', '/lojas');
    }
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storesService.getAll();
      
      // Buscar dados agregados (produtos, pedidos, receita) para cada loja
      const storesWithData = await Promise.all(
        data.map(async (store) => {
          try {
            const [products, orders] = await Promise.all([
              productsService.getAll({ storeId: store.id }).catch(() => []),
              ordersService.getAll({ storeId: store.id }).catch(() => []),
            ]);
            
            // Calcular receita total dos pedidos
            const revenue = orders.reduce((total: number, order: any) => {
              const orderTotal = Number(order.total) || 0;
              return total + (isNaN(orderTotal) ? 0 : orderTotal);
            }, 0);
            
            return {
              ...store,
              productsCount: products.length || 0,
              ordersCount: orders.length || 0,
              revenue: isNaN(revenue) ? 0 : revenue,
            };
          } catch (err) {
            console.error(`Erro ao carregar dados da loja ${store.id}:`, err);
            return {
              ...store,
              productsCount: 0,
              ordersCount: 0,
              revenue: 0,
            };
          }
        })
      );
      
      setStores(storesWithData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      marketplace: '',
      status: 'pending',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveStore = async () => {
    try {
      if (!formData.name || !formData.marketplace) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      setSaving(true);
      
      if (editingId) {
        await storesService.update(editingId, formData);
        setNotification('Loja atualizada com sucesso!');
      } else {
        await storesService.create(formData);
        setNotification('Loja criada com sucesso!');
      }
      
      await loadStores();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar loja');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta loja?')) {
      return;
    }

    try {
      await storesService.delete(id);
      setNotification('Loja excluída com sucesso!');
      await loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir loja');
    }
  };

  const handleDisconnectMercadoLivre = async (id: string, storeName: string) => {
    if (!window.confirm(`Tem certeza que deseja desconectar ${storeName}? Você terá que reconectar para sincronizar produtos e pedidos.`)) {
      return;
    }

    try {
      await storesService.disconnectMercadoLivre(id);
      setNotification(`${storeName} desconectada com sucesso!`);
      await loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar loja');
    }
  };

  const handleConnectMercadoLivre = () => {
    storesService.connectMercadoLivre();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      case 'disconnected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Ativa',
      inactive: 'Inativa',
      pending: 'Pendente',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader 
        title="Integrações"
        subtitle="Gerenciar integrações com marketplaces"
      />

      {error && (
        <Box sx={{ mb: 3 }}>
          <InlineError message={error} onClose={() => setError(null)} />
        </Box>
      )}

      {stores.length === 0 ? (
        <EmptyState 
          icon={<StorefrontIcon sx={{ fontSize: 64 }} />}
          title="Nenhuma integração conectada"
          description="Conecte sua primeira loja para começar a sincronizar produtos e pedidos dos marketplaces"
        />
      ) : (
      <Grid container spacing={3}>
        {stores.map((store) => (
          <Grid item xs={12} sm={6} md={4} key={store.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #1f2937' : '1px solid #e5e7eb',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 10px 28px rgba(0, 0, 0, 0.45)'
                  : '0 10px 28px rgba(15, 23, 42, 0.12)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 16px 36px rgba(0, 0, 0, 0.55)'
                    : '0 16px 36px rgba(15, 23, 42, 0.18)',
                },
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {store.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {store.marketplace}
                    </Typography>
                  </Box>
                  <StorefrontIcon sx={{ color: '#0099FF', fontSize: '1.8rem' }} />
                </Box>

                <Box sx={{ mb: 2.5 }}>
                  <StatusBadge status={store.status} size="small" />
                </Box>

                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Produtos
                      </Typography>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {store.productsCount || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Pedidos
                      </Typography>
                      <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {store.ordersCount || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Receita
                      </Typography>
                      <Typography sx={{ fontWeight: 600, color: '#10b981' }}>
                        {(() => {
                          const revenue = Number(store.revenue) || 0;
                          if (revenue === 0) return 'R$ 0.0k';
                          return `R$ ${(revenue / 1000).toFixed(1)}k`;
                        })()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                  Última sincronização: {store.updatedAt || 'Nunca'}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    fullWidth
                    onClick={() => {
                      const isMLActive = store.marketplace === 'MercadoLivre' && store.status === 'active';
                      if (isMLActive) {
                        handleDisconnectMercadoLivre(store.id, store.name);
                      } else {
                        handleDeleteStore(store.id);
                      }
                    }}
                  >
                    {store.marketplace === 'MercadoLivre' && store.status === 'active'
                      ? 'Desconectar'
                      : 'Excluir'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}

      {/* Floating Action Button - Mercado Livre (sempre visível) */}
      <Button
        variant="contained"
        onClick={handleConnectMercadoLivre}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#FFE600',
          color: '#333',
          fontWeight: 600,
          py: 1.5,
          px: 3,
          borderRadius: 3,
          opacity: 0.9,
          boxShadow: '0 4px 12px rgba(255, 230, 0, 0.3)',
          '&:hover': {
            bgcolor: '#FFD000',
            opacity: 1,
            boxShadow: '0 6px 16px rgba(255, 230, 0, 0.4)',
          },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          textTransform: 'none',
          fontSize: '1rem',
        }}
      >
        Conecte sua loja
        <Box
          component="img"
          src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years_v2.png"
          alt="Mercado Livre"
          sx={{
            height: 24,
            width: 'auto',
          }}
        />
      </Button>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          px: 3,
          pt: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(66, 165, 245, 0.15)'
                : 'rgba(66, 165, 245, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <StorefrontIcon sx={{ color: '#42A5F5', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingId ? 'Editar Loja' : 'Conectar Nova Loja'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Loja"
                required
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Ex: Minha Loja MercadoLivre"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Marketplace</InputLabel>
                <Select
                  value={formData.marketplace}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketplace: e.target.value }))}
                  label="Marketplace"
                >
                  <MenuItem value="MercadoLivre">MercadoLivre</MenuItem>
                  <MenuItem value="Shopee">Shopee</MenuItem>
                  <MenuItem value="Amazon">Amazon</MenuItem>
                  <MenuItem value="Magalu">Magalu</MenuItem>
                  <MenuItem value="Outro">Outro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="active">Ativa</MenuItem>
                  <MenuItem value="inactive">Inativa</MenuItem>
                  <MenuItem value="pending">Pendente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveStore} 
            variant="contained" 
            color="primary"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : editingId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Erro */}
      <Dialog
        open={openErrorDialog}
        onClose={() => setOpenErrorDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          pt: 3,
        }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'error.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
            }}
          >
            <CloseIcon sx={{ fontSize: 40, color: 'error.main' }} />
          </Box>
          <Typography variant="h6" fontWeight="bold">
            Erro ao Conectar Loja
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            {errorDialogMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenErrorDialog(false)} 
            variant="contained" 
            color="primary"
            fullWidth
            size="large"
          >
            OK, Entendi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificações */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        message={notification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
}
