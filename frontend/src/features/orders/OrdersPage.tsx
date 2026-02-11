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
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { ordersService, Order } from '../../services/ordersService';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import DataTable, { Column } from '../../components/DataTable';
import { storesService, Store } from '../../services/storesService';
import * as websocket from '../../services/websocket';
import invoicesService, { Invoice } from '../../services/invoicesService';

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
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [issuingInvoice, setIssuingInvoice] = useState(false);

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
      
      // Carregar nota fiscal se existir
      loadInvoiceForOrder(fullOrder.id);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do pedido');
    }
  };

  const loadInvoiceForOrder = async (orderId: string) => {
    try {
      setLoadingInvoice(true);
      const invoiceData = await invoicesService.getByOrderId(orderId);
      setInvoice(invoiceData);
    } catch (err) {
      console.error('Erro ao carregar nota fiscal:', err);
      setInvoice(null);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleAttachInvoice = async () => {
    if (!selectedOrder) return;

    // Criar input file invisível
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.xml';
    input.multiple = false;

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;

      // Validar tipo de arquivo
      const validTypes = ['application/pdf', 'text/xml', 'application/xml'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|xml)$/i)) {
        setNotification('Por favor, selecione um arquivo PDF ou XML');
        return;
      }

      try {
        setIssuingInvoice(true);
        const newInvoice = await invoicesService.uploadFile(selectedOrder.id, file);
        setInvoice(newInvoice);
        setNotification('Nota fiscal anexada com sucesso!');
      } catch (err: any) {
        console.error('Erro ao anexar nota fiscal:', err);
        const errorMsg = err.message || 'Erro ao anexar nota fiscal';
        setNotification(errorMsg);
      } finally {
        setIssuingInvoice(false);
      }
    };

    // Abrir seletor de arquivos
    input.click();
  };

  const getParsedRawData = (rawData?: string) => {
    if (!rawData) return null;
    try {
      return JSON.parse(rawData);
    } catch {
      return rawData;
    }
  };

  const toNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const formatMoney = (value?: number) =>
    value !== undefined ? `R$ ${value.toFixed(2)}` : 'N/A';

  const getOrderItems = (raw: any) => {
    if (!raw) return [] as any[];
    const items = raw.items || raw.order_items || raw.orderItems || raw?.order?.items;
    return Array.isArray(items) ? items : [];
  };

  const getItemTitle = (item: any) =>
    item?.title || item?.item?.title || item?.item?.name || 'Produto';

  const getItemQuantity = (item: any) => toNumber(item?.quantity) ?? 1;

  const getMarketplaceFee = (item: any) =>
    toNumber(item?.sale_fee) ??
    toNumber(item?.sale_fee_amount) ??
    toNumber(item?.marketplace_fee) ??
    toNumber(item?.fees?.marketplace);

  const getShippingFee = (item: any, raw: any) =>
    toNumber(item?.shipping_cost) ??
    toNumber(item?.shipping?.cost) ??
    toNumber(item?.shipping?.shipping_cost) ??
    toNumber(raw?.shipping?.cost) ??
    toNumber(raw?.shipping?.shipping_cost);

  const getAddressJson = (order: Order, raw: any) => {
    const addr = raw?.shipping?.receiver_address || raw?.receiver_address || {};
    const hasRawAddress = addr && Object.keys(addr).length > 0;

    const composed = {
      address_line: order.customerAddress || addr.address_line,
      city: order.customerCity || addr.city?.name || addr.city,
      state: order.customerState || addr.state?.id || addr.state,
      zip_code: order.customerZipCode || addr.zip_code || addr.zipcode,
      country: addr.country?.id || addr.country,
      neighborhood: addr.neighborhood?.name || addr.neighborhood,
      receiver_name: addr.receiver_name || order.customerName,
    };

    const hasComposed = Object.values(composed).some((v) => v);
    return hasRawAddress || hasComposed ? composed : null;
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

  const selectedOrderRaw = selectedOrder?.rawData
    ? getParsedRawData(selectedOrder.rawData)
    : null;
  const selectedOrderItems = selectedOrder ? getOrderItems(selectedOrderRaw) : [];
  const selectedOrderAddressJson = selectedOrder
    ? getAddressJson(selectedOrder, selectedOrderRaw)
    : null;

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
    revenue: (orders || [])
      .filter((o) => {
        const status = (o?.status || '').toLowerCase();
        return status !== 'cancelled' && status !== 'canceled' && status !== 'cancelado';
      })
      .reduce((sum, o) => sum + (Number(o?.total) || 0), 0) || 0,
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
          bgcolor: theme.palette.mode === 'dark' ? '#0d1117' : '#ffffff',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
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
                    <SearchIcon sx={{ color: theme.palette.mode === 'dark' ? '#8b949e' : '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  height: 48,
                  bgcolor: theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                  color: theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? '#30363d' : '#e5e7eb',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                  },
                  '& input::placeholder': {
                    color: theme.palette.mode === 'dark' ? '#8b949e' : '#9ca3af',
                    opacity: 1,
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel 
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#8b949e' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                  },
                }}
              >
                Status
              </InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                      '& .MuiMenuItem-root': {
                        color: theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? '#21262d' : '#f3f4f6',
                        },
                        '&.Mui-selected': {
                          bgcolor: theme.palette.mode === 'dark' ? '#1f6feb' : '#e0f2fe',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? '#1f6feb' : '#bae6fd',
                          },
                        },
                      },
                    },
                  },
                }}
                sx={{ 
                  borderRadius: 2,
                  height: 48,
                  bgcolor: theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                  color: theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? '#30363d' : '#e5e7eb',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                  },
                  '& .MuiSelect-icon': {
                    color: theme.palette.mode === 'dark' ? '#8b949e' : '#9ca3af',
                  },
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
              <InputLabel
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#8b949e' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                  },
                }}
              >
                Marketplace
              </InputLabel>
              <Select
                value={marketplaceFilter}
                label="Marketplace"
                onChange={(e) => setMarketplaceFilter(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                      '& .MuiMenuItem-root': {
                        color: theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? '#21262d' : '#f3f4f6',
                        },
                        '&.Mui-selected': {
                          bgcolor: theme.palette.mode === 'dark' ? '#1f6feb' : '#e0f2fe',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? '#1f6feb' : '#bae6fd',
                          },
                        },
                      },
                    },
                  },
                }}
                sx={{ 
                  borderRadius: 2,
                  height: 48,
                  bgcolor: theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                  color: theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? '#30363d' : '#e5e7eb',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                  },
                  '& .MuiSelect-icon': {
                    color: theme.palette.mode === 'dark' ? '#8b949e' : '#9ca3af',
                  },
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

              {/* Produtos e Taxas */}
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ShoppingBagIcon sx={{ color: '#10b981' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Produtos e Taxas
                  </Typography>
                </Box>
                {selectedOrderItems.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    Nenhum item encontrado no pedido.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {selectedOrderItems.map((item, idx) => (
                      <Grid item xs={12} key={`${selectedOrder?.id}-item-${idx}`}>
                        <Paper sx={{ p: 2, border: '1px solid #e5e7eb' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {getItemTitle(item)}
                          </Typography>
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="textSecondary">
                                Quantidade
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {getItemQuantity(item)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="textSecondary">
                                Taxa Mercado Livre
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {formatMoney(getMarketplaceFee(item))}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2" color="textSecondary">
                                Taxa de Envio
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {formatMoney(getShippingFee(item, selectedOrderRaw))}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>

              {/* Nota Fiscal */}
              <Divider sx={{ my: 3 }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon sx={{ fontSize: 20 }} />
                    Nota Fiscal
                  </Typography>
                </Box>

                {loadingInvoice && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}

                {!loadingInvoice && !invoice && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Nenhuma nota fiscal emitida para este pedido.
                  </Alert>
                )}

                {!loadingInvoice && invoice && (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2.5, 
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(76, 175, 80, 0.08)'
                        : 'rgba(76, 175, 80, 0.04)',
                      border: '1px solid',
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(76, 175, 80, 0.3)'
                        : 'rgba(76, 175, 80, 0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Número
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                          {invoice.number || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Série
                        </Typography>

                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                          {invoice.series || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Chave de Acesso
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.8rem',
                            mt: 0.5,
                            wordBreak: 'break-all',
                          }}
                        >
                          {invoice.accessKey || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Status
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={invoice.status === 'generated' ? 'Gerada' : 
                                   invoice.status === 'sent' ? 'Enviada' : 
                                   invoice.status === 'failed' ? 'Erro' : 
                                   invoice.status}
                            size="small"
                            color={invoice.status === 'generated' ? 'success' : 
                                   invoice.status === 'sent' ? 'primary' : 
                                   invoice.status === 'failed' ? 'error' : 
                                   'default'}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Data de Emissão
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                          {invoice.issueDate 
                            ? new Date(invoice.issueDate).toLocaleString('pt-BR')
                            : 'N/A'}
                        </Typography>
                      </Grid>
                      {invoice.sentToMarketplace && (
                        <Grid item xs={12}>
                          <Alert severity="success" sx={{ mt: 1 }}>
                            Nota fiscal enviada ao marketplace em {' '}
                            {invoice.sentAt 
                              ? new Date(invoice.sentAt).toLocaleString('pt-BR')
                              : 'data desconhecida'}
                          </Alert>
                        </Grid>
                      )}
                      {invoice.errorMessage && (
                        <Grid item xs={12}>
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {invoice.errorMessage}
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                )}
              </Box>

              {/* Endereço (JSON) */}
              {selectedOrderAddressJson && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    {!invoice && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={issuingInvoice ? <CircularProgress size={16} color="inherit" /> : <ReceiptIcon />}
                        onClick={handleAttachInvoice}
                        disabled={issuingInvoice || loadingInvoice}
                      >
                        {issuingInvoice ? 'Anexando...' : 'Anexar Nota Fiscal'}
                      </Button>
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Endereço (JSON)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#f5f5f5',
                      maxHeight: 200,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {JSON.stringify(selectedOrderAddressJson, null, 2)}
                    </pre>
                  </Paper>
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
                      {JSON.stringify(selectedOrderRaw, null, 2)}
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
