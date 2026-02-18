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
  Collapse,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Menu,
  ListItemIcon,
  Avatar,
  Tooltip,
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
  Sync as SyncIcon,
  Receipt as ReceiptIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { ordersService, Order } from '../../services/ordersService';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import DataTable, { Column } from '../../components/DataTable';
import { storesService, Store } from '../../services/storesService';
import * as websocket from '../../services/websocket';
import invoicesService, { Invoice } from '../../services/invoicesService';

// Helper para formatar ID curto
const formatOrderId = (id: string) => `#${id.substring(0, 6)}`;

// Helper para copiar texto
const copyToClipboard = (text: string, message: string, setNotification: (msg: string) => void) => {
  navigator.clipboard.writeText(text).then(() => {
    setNotification(message);
  });
};

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
  const [showTechnicalData, setShowTechnicalData] = useState(false);

  const isPlaceholderEmail = (email?: string) => {
    if (!email) return true;
    return /@marketplace\.com$/i.test(email) || email === 'teste@example.com';
  };
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
      waiting_payment: 'warning',
      pending: 'warning',
      created: 'warning',
      paid: 'success',
      approved: 'success',
      preparing_shipment: 'info',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      completed: 'success',
      cancelled: 'error',
      canceled: 'error',
      cancelado: 'error',
      claim_open: 'warning',
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      waiting_payment: 'Aguardando pagamento',
      pending: 'Aguardando pagamento',
      created: 'Aguardando pagamento',
      paid: 'Pago',
      approved: 'Pago',
      preparing_shipment: 'Preparar envio',
      processing: 'Preparar envio',
      shipped: 'Enviado',
      delivered: 'Entregue',
      completed: 'Finalizado',
      cancelled: 'Cancelado',
      canceled: 'Cancelado',
      cancelado: 'Cancelado',
      claim_open: 'Em reclamação',
    };
    return labels[status] || status;
  };

  const handleOpenDetails = async (order: Order) => {
    try {
      const fullOrder = await ordersService.getOne(order.id);
      setSelectedOrder(fullOrder);
      setShowTechnicalData(false);
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

  const formatDateTime = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('pt-BR');
  };

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

  const getAddressSummary = (address: any) => {
    if (!address) return null;
    const line = [address.address_line, address.neighborhood].filter(Boolean).join(', ');
    const cityState = [address.city, address.state].filter(Boolean).join(' - ');
    return {
      recipient: address.receiver_name,
      line,
      cityState,
      zipCode: address.zip_code,
      country: address.country,
    };
  };

  const getOrderTotal = (order: Order, raw: any) =>
    toNumber(order.total) ??
    toNumber(raw?.total_amount) ??
    toNumber(raw?.total_paid_amount) ??
    toNumber(raw?.total_amount_with_shipping) ??
    toNumber(raw?.order?.total_amount);

  const getPaymentDate = (raw: any) =>
    raw?.date_approved ||
    raw?.payment?.date_approved ||
    raw?.payment?.date_created ||
    raw?.payments?.[0]?.date_approved ||
    raw?.payments?.[0]?.date_created ||
    raw?.order?.payments?.[0]?.date_approved ||
    raw?.order?.payments?.[0]?.date_created;

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
    setShowTechnicalData(false);
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
    if (selectedOrderForMenu) {
      const current = selectedOrderForMenu.status;
      if (current === 'paid' || current === 'approved') {
        handleUpdateStatus(selectedOrderForMenu.id, 'preparing_shipment');
      }
    }
    handleMenuClose();
  };

  const handleMenuShipOrder = () => {
    if (selectedOrderForMenu) {
      const current = selectedOrderForMenu.status;
      if (current === 'preparing_shipment' || current === 'processing') {
        handleUpdateStatus(selectedOrderForMenu.id, 'shipped');
      }
    }
    handleMenuClose();
  };

  const normalizeOrderStatus = (status?: string) => {
    const value = (status || '').toLowerCase();
    if (value === 'pending' || value === 'created') return 'waiting_payment';
    if (value === 'processing') return 'preparing_shipment';
    if (value === 'approved') return 'paid';
    if (value === 'canceled' || value === 'cancelado') return 'cancelled';
    return value;
  };

  const selectedOrderRaw = selectedOrder?.rawData
    ? getParsedRawData(selectedOrder.rawData)
    : null;
  const selectedOrderItems = selectedOrder ? getOrderItems(selectedOrderRaw) : [];
  const selectedOrderAddressJson = selectedOrder
    ? getAddressJson(selectedOrder, selectedOrderRaw)
    : null;
  const selectedOrderAddressSummary = getAddressSummary(selectedOrderAddressJson);
  const selectedOrderTotal = selectedOrder ? getOrderTotal(selectedOrder, selectedOrderRaw) : undefined;
  const selectedOrderPaymentDate = selectedOrder ? getPaymentDate(selectedOrderRaw) : undefined;
  const selectedOrderPaymentStatus = selectedOrder
    ? getStatusLabel(normalizeOrderStatus(selectedOrder.status))
    : 'N/A';

  const filteredOrders = (orders || [])
    .filter((o) => {
      if (!o) return false;
      const matchesSearch = o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.marketplace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const normalizedStatus = normalizeOrderStatus(o.status);
      const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
      const matchesMarketplace = marketplaceFilter === 'all' || o.marketplace === marketplaceFilter;
      return matchesSearch && matchesStatus && matchesMarketplace;
    });

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const uniqueMarketplaces = Array.from(new Set((orders || []).map((o) => o?.marketplace).filter(Boolean)));

  const getMarketplaceBadge = (marketplace?: string) => {
    const key = (marketplace || '').toLowerCase();
    if (key.includes('mercado')) {
      return { label: 'Mercado Livre', text: 'ML', bg: '#fff3c2', color: '#1e3a8a', border: '#facc15', logo: '/marketplace-logos/mercadolivre.png' };
    }
    if (key.includes('shopee')) {
      return { label: 'Shopee', text: 'SH', bg: '#ffe1d6', color: '#9a3412', border: '#fb923c', logo: '/marketplace-logos/shopee.png' };
    }
    if (key.includes('amazon')) {
      return { label: 'Amazon', text: 'AM', bg: '#e5e7eb', color: '#111827', border: '#9ca3af', logo: '/marketplace-logos/amazon.png' };
    }
    if (key.includes('magalu')) {
      return { label: 'Magalu', text: 'MG', bg: '#dbeafe', color: '#1d4ed8', border: '#60a5fa', logo: '/marketplace-logos/magalu.png' };
    }

    const fallback = marketplace || 'Outro';
    return { label: fallback, text: fallback.slice(0, 2).toUpperCase(), bg: '#e2e8f0', color: '#334155', border: '#cbd5e1' };
  };

  // Estatísticas
  const stats = {
    total: (orders || []).length || 0,
    pending: (orders || []).filter((o) => {
      const status = (o?.status || '').toLowerCase();
      return ['waiting_payment', 'pending', 'created'].includes(status);
    }).length || 0,
    revenue: (orders || [])
      .filter((o) => {
        const status = (o?.status || '').toLowerCase();
        return !['cancelled', 'canceled', 'cancelado', 'claim_open', 'waiting_payment', 'pending', 'created'].includes(status);
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
            variant="outlined"
            color="success"
            startIcon={<SyncIcon />}
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
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid #1f2937' : '1px solid #e5e7eb',
              boxShadow: (theme) => theme.palette.mode === 'dark'
                ? '0 10px 28px rgba(0, 0, 0, 0.45)'
                : '0 10px 28px rgba(15, 23, 42, 0.12)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 16px 36px rgba(0, 0, 0, 0.55)'
                  : '0 16px 36px rgba(15, 23, 42, 0.18)',
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
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid #1f2937' : '1px solid #e5e7eb',
              boxShadow: (theme) => theme.palette.mode === 'dark'
                ? '0 10px 28px rgba(0, 0, 0, 0.45)'
                : '0 10px 28px rgba(15, 23, 42, 0.12)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 16px 36px rgba(0, 0, 0, 0.55)'
                  : '0 16px 36px rgba(15, 23, 42, 0.18)',
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
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid #1f2937' : '1px solid #e5e7eb',
              boxShadow: (theme) => theme.palette.mode === 'dark'
                ? '0 10px 28px rgba(0, 0, 0, 0.45)'
                : '0 10px 28px rgba(15, 23, 42, 0.12)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 16px 36px rgba(0, 0, 0, 0.55)'
                  : '0 16px 36px rgba(15, 23, 42, 0.18)',
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
                <MenuItem value="waiting_payment">Aguardando pagamento</MenuItem>
                <MenuItem value="paid">Pago</MenuItem>
                <MenuItem value="preparing_shipment">Preparar envio</MenuItem>
                <MenuItem value="shipped">Enviado</MenuItem>
                <MenuItem value="delivered">Entregue</MenuItem>
                <MenuItem value="completed">Finalizado</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
                <MenuItem value="claim_open">Em reclamação</MenuItem>
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
            label: 'ID',
            width: 90,
            format: (value) => (
              <Tooltip title="Clique para copiar o ID completo" arrow>
                <Box
                  onClick={() => copyToClipboard(String(value), 'ID copiado!', setNotification)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'monospace', color: '#6366f1' }}>
                    {formatOrderId(String(value))}
                  </Typography>
                  <ContentCopyIcon sx={{ fontSize: 14, color: '#6366f1', opacity: 0.6 }} />
                </Box>
              </Tooltip>
            ),
          },
          {
            id: 'customerName',
            label: 'Cliente',
            width: 240,
            format: (value) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: '#3b82f6' }}>
                  {value ? String(value).charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {value || 'Sem nome'}
                </Typography>
              </Box>
            ),
          },
          {
            id: 'marketplace',
            label: 'Loja',
            align: 'center',
            width: 70,
            format: (value) => {
              const badge = getMarketplaceBadge(String(value || ''));
              return (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Tooltip title={badge.label} arrow>
                    <Avatar
                      src={badge.logo}
                      imgProps={{ style: { objectFit: 'contain' } }}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'transparent',
                        color: badge.color,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        border: 'none',
                      }}
                    >
                      {badge.text}
                    </Avatar>
                  </Tooltip>
                </Box>
              );
            },
          },
          {
            id: 'status',
            label: 'Status',
            align: 'center',
            width: 110,
            format: (value) => (
              <Chip
                label={getStatusLabel(String(value || ''))}
                color={getStatusColor(String(value || ''))}
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
            label: 'Valor',
            align: 'right',
            numeric: true,
            width: 110,
            format: (value) => (
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(value) || 0)}
              </Typography>
            ),
          },
          {
            id: 'orderCreatedAt',
            label: 'Data',
            align: 'center',
            width: 120,
            format: (value, row) => {
              // Usa orderCreatedAt se disponível, senão cai para createdAt
              const dateToUse = value || (row as any)?.createdAt;
              return (
                <Typography sx={{ fontSize: '0.8125rem' }}>
                  {dateToUse ? new Date(dateToUse).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : '-'}
                </Typography>
              );
            },
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
        {(selectedOrderForMenu?.status === 'paid' || selectedOrderForMenu?.status === 'approved') && (
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
            <Typography variant="body2">Preparar envio</Typography>
          </MenuItem>
        )}
        {(selectedOrderForMenu?.status === 'preparing_shipment' || selectedOrderForMenu?.status === 'processing') && (
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                      {formatOrderId(selectedOrder.id)}
                    </Typography>
                    <Tooltip title="Copiar ID completo" arrow>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(selectedOrder.id, 'ID copiado!', setNotification)}
                        sx={{ p: 0.5 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedOrder.status || ''}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as string)}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                      }}
                    >
                      <MenuItem value="waiting_payment">Aguardando pagamento</MenuItem>
                      <MenuItem value="paid">Pago</MenuItem>
                      <MenuItem value="preparing_shipment">Preparar envio</MenuItem>
                      <MenuItem value="shipped">Enviado</MenuItem>
                      <MenuItem value="delivered">Entregue</MenuItem>
                      <MenuItem value="completed">Finalizado</MenuItem>
                      <MenuItem value="cancelled">Cancelado</MenuItem>
                      <MenuItem value="claim_open">Em reclamação</MenuItem>
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
                {((selectedOrder as any).orderCreatedAt || selectedOrder.createdAt) && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Data do Pedido
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date((selectedOrder as any).orderCreatedAt || selectedOrder.createdAt).toLocaleString('pt-BR')}
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
                    {selectedOrder.customerEmail && !isPlaceholderEmail(selectedOrder.customerEmail) && (
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
                  </Grid>
                </Box>
              )}

              {/* Endereço de Entrega */}
              {selectedOrderAddressSummary && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocalShippingIcon sx={{ color: '#3b82f6' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Endereço de Entrega
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {selectedOrderAddressSummary.recipient && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Destinatário
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrderAddressSummary.recipient}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrderAddressSummary.line && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Endereço
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrderAddressSummary.line}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrderAddressSummary.cityState && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Cidade
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrderAddressSummary.cityState}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrderAddressSummary.zipCode && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          CEP
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrderAddressSummary.zipCode}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrderAddressSummary.country && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          País
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrderAddressSummary.country}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Pagamento */}
              {(selectedOrderTotal !== undefined || selectedOrderPaymentDate || selectedOrderPaymentStatus) && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon sx={{ color: '#16a34a' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Pagamento
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Valor total
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatMoney(selectedOrderTotal)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Data do pagamento
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDateTime(selectedOrderPaymentDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Status
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedOrderPaymentStatus}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Produtos e Taxas */}
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <ShoppingBagIcon sx={{ color: '#10b981', mr: 1, verticalAlign: 'middle' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'inline' }}>
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
                        <Box sx={{ pb: 2 }}>
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
                        </Box>
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
                            Nota fiscal enviada ao marketplace em{' '}
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

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {(selectedOrderAddressJson || selectedOrder.rawData) && (
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => setShowTechnicalData((prev) => !prev)}
                  >
                    {showTechnicalData ? 'Ocultar dados técnicos' : 'Ver dados técnicos'}
                  </Button>
                )}
              </Box>

              <Collapse in={showTechnicalData} timeout="auto" unmountOnExit>
                {selectedOrderAddressJson && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Endereço (JSON)
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                        color: (theme) => theme.palette.mode === 'dark' ? '#d4d4d4' : '#333333',
                        maxHeight: 200,
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'inherit' }}>
                        {JSON.stringify(selectedOrderAddressJson, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}

                {selectedOrder.rawData && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Dados Brutos (JSON)
                    </Typography>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                        color: (theme) => theme.palette.mode === 'dark' ? '#d4d4d4' : '#333333',
                        maxHeight: 300, 
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}
                    >
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'inherit' }}>
                        {JSON.stringify(selectedOrderRaw, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Collapse>
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
