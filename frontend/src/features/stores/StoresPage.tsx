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
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { storesService, Store } from '../../services/storesService';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storesService.getAll();
      setStores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Lojas Conectadas
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Gerenciar integrações com marketplaces
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Conectar Loja
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {stores.map((store) => (
          <Grid item xs={12} sm={6} md={4} key={store.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px rgba(0, 153, 255, 0.15)',
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
                  <Chip
                    label={getStatusLabel(store.status)}
                    color={getStatusColor(store.status) as any}
                    size="small"
                    variant="filled"
                  />
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
                        R$ {((store.revenue || 0) / 1000).toFixed(1)}k
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                  Última sincronização: {store.updatedAt || 'Nunca'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<SyncIcon />}
                    fullWidth
                  >
                    Sincronizar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<SettingsIcon />}
                    fullWidth
                  >
                    Config
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Conectar Nova Loja</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Selecione o marketplace que deseja conectar:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button variant="outlined" color="primary" fullWidth sx={{ p: 2, textAlign: 'left' }}>
              MercadoLivre
            </Button>
            <Button variant="outlined" color="primary" fullWidth sx={{ p: 2, textAlign: 'left' }}>
              Shopee
            </Button>
            <Button variant="outlined" color="primary" fullWidth sx={{ p: 2, textAlign: 'left' }}>
              Amazon
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
