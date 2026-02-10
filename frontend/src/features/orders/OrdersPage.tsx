import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
  CircularProgress,
  InputAdornment,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Menu,
  ListItemIcon,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  ShoppingBag as ShoppingBagIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ordersService, Order } from '../../services/ordersService';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import DataTable, { Column } from '../../components/DataTable';
import { storesService, Store } from '../../services/storesService';
import * as websocket from '../../services/websocket';

export default function OrdersPage() {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrderForMenu, setSelectedOrderForMenu] = useState<Order | null>(null);
  const [syncing, setSyncing] = useState(false);

  console.log('OrdersPage renderizando', { loading, ordersCount: orders?.length });

  useEffect(() => {
    console.log('OrdersPage montado');
    loadOrders();
    loadStores();
    
    // Conectar ao WebSocket
    websocket.connect();
    
    // Escutar eventos de pedidos
    websocket.onOrderCreated((order) => {
      console.log('Novo pedido recebido:', order);
      setOrders((prev) => [order.orderId ? { id: order.orderId, ...order } : order, ...prev]);
      setNotification('Novo pedido criado!');
    });
    
    websocket.onOrderUpdated((order) => {
      console.log('Pedido atualizado:', order);
      setOrders((prev) => 
        prev.map((o) => (o.id === order.id ? { ...o, ...order } : o))
      );
      setNotification('Pedido atualizado!');
    });
    
    websocket.onOrderDeleted((payload) => {
      console.log('Pedido removido:', payload);
      setOrders((prev) => prev.filter((o) => o.id !== payload.id));
      setNotification('Pedido removido!');
    });
    
    return () => {
      websocket.disconnect();
    };
  }, []);

  const loadOrders = async () => {
    console.log('loadOrders iniciado');
    try {
      setLoading(true);
      setError(null);
      console.log('Chamando ordersService.getAll()');
      const data = await ordersService.getAll();
      console.log('Pedidos recebidos:', data);
      setOrders(data || []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
      setOrders([]);
    } finally {
      console.log('loadOrders finalizado');
      setLoading(false);
    }
  };

  const handleSyncOrders = async () => {
    try {
      setSyncing(true);
      setError(null);
      const result = await ordersService.sync();
      setNotification(`Sincronização concluída: ${result.imported} novos, ${result.updated} atualizados`);
      await loadOrders();
    } catch (err) {
      console.error('Erro ao sincronizar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar pedidos');
    } finally {
      setSyncing(false);
    }
  };

  const loadStores = async () => {
    try {
      const data = await storesService.getAll();
      setStores(data || []);
    } catch (err) {
      console.error('Erro ao carregar lojas:', err);
      setStores([]);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      created: 'Criado',
      pending: 'Pendente',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const handleOpenDetails = async (order: Order) => {
    try {
      const fullOrder = await ordersService.getOne(order.id);
      setSelectedOrder(fullOrder);
      setDetailsOpen(true);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do pedido');
    }
  };

  const getParsedRawData = (rawData?: string) => {
    if (!rawData) return null;
    try {
      return JSON.parse(rawData);
    } catch {
      return rawData;
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await ordersService.update(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setNotification(`Status atualizado para: ${getStatusLabel(newStatus)}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  };

  const handleMenuOpen = (order: Order, event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderForMenu(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderForMenu(null);
  };

  const handleMenuViewDetails = () => {
    if (selectedOrderForMenu) {
      handleOpenDetails(selectedOrderForMenu);
    }
    handleMenuClose();
  };

  const handleMenuProcessOrder = () => {
    if (selectedOrderForMenu && selectedOrderForMenu.status === 'pending') {
      handleUpdateStatus(selectedOrderForMenu.id, 'processing');
    }
    handleMenuClose();
  };

  const handleMenuShipOrder = () => {
    if (selectedOrderForMenu && selectedOrderForMenu.status === 'processing') {
      handleUpdateStatus(selectedOrderForMenu.id, 'shipped');
    }
    handleMenuClose();
  };

  const filteredOrders = (orders || [])
    .filter((o) => {
      if (!o) return false;
      const matchesSearch = o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.marketplace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesMarketplace = marketplaceFilter === 'all' || o.marketplace === marketplaceFilter;
      return matchesSearch && matchesStatus && matchesMarketplace;
    });

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const uniqueMarketplaces = Array.from(new Set((orders || []).map((o) => o?.marketplace).filter(Boolean)));

  // Estatísticas
  const stats = {
    total: (orders || []).length || 0,
    pending: (orders || []).filter((o) => o?.status === 'pending').length || 0,
    revenue: (orders || []).reduce((sum, o) => sum + (Number(o?.total) || 0), 0) || 0,
  };

  if (loading) {
    console.log('Renderizando loading spinner');
    return (
      <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  console.log('Renderizando página principal', { ordersCount: orders?.length, loading });

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <PageHeader 
        title="Pedidos"
        subtitle="Acompanhe e gerencie todos os pedidos sincronizados dos marketplaces"
        action={
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleSyncOrders}
            disabled={syncing}
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      mb: 1.5,
                    }}
                  >
                    Total de Pedidos
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.text.primary,
                      fontSize: '1.875rem',
                    }}
                  >
                    {stats.total}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#dbeafe',
                    borderRadius: 2.5,
                  }}
                >
                  <ShoppingBagIcon sx={{ color: '#3b82f6', fontSize: '2rem' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      mb: 1.5,
                    }}
                  >
                    Pendentes
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.text.primary,
                      fontSize: '1.875rem',
                    }}
                  >
                    {stats.pending}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#fef3c7',
                    borderRadius: 2.5,
                  }}
                >
                  <InfoIcon sx={{ color: '#f59e0b', fontSize: '2rem' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      mb: 1.5,
                    }}
                  >
                    Receita Total
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.text.primary,
                      fontSize: '1.875rem',
                    }}
                  >
                    R$ {stats.revenue.toFixed(2)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#d1fae5',
                    borderRadius: 2.5,
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#10b981', fontSize: '2rem' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper 
        sx={{ 
          mb: 3, 
          p: 3,
          borderRadius: 3,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar por ID, marketplace ou nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: 'white',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  height: 48,
                  '& fieldset': {
                    borderColor: '#e5e7eb',
                  },
                  '&:hover fieldset': {
                    borderColor: '#3b82f6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6',
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ 
                  borderRadius: 2,
                  height: 48,
                  bgcolor: 'white',
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="processing">Processando</MenuItem>
                <MenuItem value="shipped">Enviado</MenuItem>
                <MenuItem value="delivered">Entregue</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Marketplace</InputLabel>
              <Select
                value={marketplaceFilter}
                label="Marketplace"
                onChange={(e) => setMarketplaceFilter(e.target.value)}
                sx={{ 
                  borderRadius: 2,
                  height: 48,
                  bgcolor: 'white',
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                {uniqueMarketplaces.map((mp) => (
                  <MenuItem key={mp} value={mp}>
                    {mp}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <DataTable<Order>
        columns={[
          {
            id: 'id',
            label: 'ID Pedido',
            minWidth: 150,
            format: (value) => (
              <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                {value}
              </Typography>
            ),
          },
          {
            id: 'marketplace',
            label: 'Marketplace',
            format: (value) => (
              <Chip 
                label={value} 
                size="small" 
                variant="outlined"
                sx={{ 
                  height: 24,
                  fontSize: '0.75rem',
                  textTransform: 'capitalize',
                }}
              />
            ),
          },
          {
            id: 'status',
            label: 'Status',
            format: (value) => (
              <Chip
                label={value === 'paid' ? 'Pago' : value === 'pending' ? 'Pendente' : value === 'shipped' ? 'Enviado' : value === 'delivered' ? 'Entregue' : 'Cancelado'}
                color={value === 'paid' || value === 'delivered' ? 'success' : value === 'pending' ? 'warning' : value === 'shipped' ? 'info' : 'error'}
                size="small"
                variant="filled"
                sx={{ 
                  height: 24,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: 90,
                }}
              />
            ),
          },
          {
            id: 'total',
            label: 'Total',
            align: 'right',
            numeric: true,
            format: (value) => (
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(value) || 0)}
              </Typography>
            ),
          },
        ]}
        data={paginatedOrders.filter((o) => o && o.id)}
        loading={loading}
        emptyMessage="Nenhum pedido encontrado"
        emptyIcon={<ShoppingBagIcon sx={{ fontSize: 60 }} />}
        pagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredOrders.length}
        onPageChange={setPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setPage(0);
        }}
        showActions
        onRowAction={handleMenuOpen}
      />

      {/* Kebab Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            borderRadius: 2,
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <MenuItem 
          onClick={handleMenuViewDetails} 
          sx={{ 
            py: 1.5,
            gap: 1.5,
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto' }}>
            <VisibilityIcon fontSize="small" sx={{ color: '#3b82f6' }} />
          </ListItemIcon>
          <Typography variant="body2">Ver Detalhes</Typography>
        </MenuItem>
        {selectedOrderForMenu?.status === 'pending' && (
          <MenuItem 
            onClick={handleMenuProcessOrder} 
            sx={{ 
              py: 1.5,
              gap: 1.5,
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <CheckCircleIcon fontSize="small" sx={{ color: '#10b981' }} />
            </ListItemIcon>
            <Typography variant="body2">Processar</Typography>
          </MenuItem>
        )}
        {selectedOrderForMenu?.status === 'processing' && (
          <MenuItem 
            onClick={handleMenuShipOrder} 
            sx={{ 
              py: 1.5,
              gap: 1.5,
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <LocalShippingIcon fontSize="small" sx={{ color: '#3b82f6' }} />
            </ListItemIcon>
            <Typography variant="body2">Enviar</Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de detalhes do pedido */}
      <Dialog 
        open={detailsOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
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
              <ShoppingBagIcon sx={{ color: '#42A5F5', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalhes do Pedido
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          {selectedOrder && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    ID do Pedido
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedOrder.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    ID Externo
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedOrder.externalId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    Marketplace
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedOrder.marketplace}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Status
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Atualizar Status</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status-select"
                      value={selectedOrder.status || ''}
                      label="Atualizar Status"
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as string)}
                    >
                      <MenuItem value="created">Criado</MenuItem>
                      <MenuItem value="pending">Pendente</MenuItem>
                      <MenuItem value="processing">Processando</MenuItem>
                      <MenuItem value="shipped">Enviado</MenuItem>
                      <MenuItem value="delivered">Entregue</MenuItem>
                      <MenuItem value="cancelled">Cancelado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    Valor Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#10b981' }}>
                    R$ {(Number(selectedOrder.total) || 0).toFixed(2)}
                  </Typography>
                </Grid>
                {selectedOrder.createdAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Data de Criação
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Dados do Cliente */}
              {(selectedOrder.customerName || selectedOrder.customerEmail) && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonIcon sx={{ color: '#0099FF' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Dados do Cliente
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {selectedOrder.customerName && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Nome
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrder.customerName}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrder.customerEmail && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Email
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrder.customerEmail}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrder.customerPhone && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Telefone
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrder.customerPhone}
                        </Typography>
                      </Grid>
                    )}
                    {(selectedOrder.customerCity || selectedOrder.customerState) && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Cidade/Estado
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrder.customerCity}, {selectedOrder.customerState}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrder.customerAddress && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Endereço
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrder.customerAddress}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrder.customerZipCode && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          CEP
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrder.customerZipCode}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {selectedOrder.rawData && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Dados Brutos (JSON)
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      maxHeight: 300, 
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {JSON.stringify(getParsedRawData(selectedOrder.rawData), null, 2)}
                    </pre>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} variant="contained">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificações em tempo real */}
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
