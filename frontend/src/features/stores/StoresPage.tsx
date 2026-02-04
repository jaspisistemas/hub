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
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { storesService, Store } from '../../services/storesService';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
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

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      marketplace: '',
      status: 'pending',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (store: Store) => {
    setEditingId(store.id);
    setFormData({
      name: store.name,
      marketplace: store.marketplace,
      status: store.status,
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
          onClick={handleOpenCreate}
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
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEdit(store)}
                    sx={{ flex: 1 }}
                  >
                    Editar
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteStore(store.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingId ? 'Editar Loja' : 'Conectar Nova Loja'}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
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
