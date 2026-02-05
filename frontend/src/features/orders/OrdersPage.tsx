import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Paper,
  Typography,
  TableContainer,
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
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { ordersService, Order } from '../../services/ordersService';
import { storesService, Store } from '../../services/storesService';
import * as websocket from '../../services/websocket';

export default function OrdersPage() {
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

  useEffect(() => {
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
    try {
      setLoading(true);
      setError(null);
      const data = await ordersService.getAll();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
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
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do pedido');
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

  const filteredOrders = orders
    .filter((o) => {
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

  const uniqueMarketplaces = Array.from(new Set(orders.map((o) => o.marketplace).filter(Boolean)));

  // Estatísticas
  const stats = {
    total: orders.length || 0,
    pending: orders.filter((o) => o.status === 'pending').length || 0,
    revenue: orders.reduce((sum, o) => sum + (o.total || 0), 0) || 0,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Pedidos
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Acompanhe e gerencie todos os pedidos sincronizados dos marketplaces
          </Typography>
        </Box>

      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ mb: 0.5 }}>
                    Total de Pedidos
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {stats.total}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#dbeafe',
                    borderRadius: 1.5,
                  }}
                >
                  <InfoIcon sx={{ color: '#0099FF' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ mb: 0.5 }}>
                    Pendentes
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {stats.pending}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#fef08a',
                    borderRadius: 1.5,
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#f59e0b' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2" sx={{ mb: 0.5 }}>
                    Receita Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    R$ {stats.revenue.toFixed(2)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#dcfce7',
                    borderRadius: 1.5,
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#10b981' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3, p: 2 }}>
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
                    <SearchIcon sx={{ color: '#555555' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
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
                sx={{ borderRadius: 2 }}
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
                sx={{ borderRadius: 2 }}
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

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>ID Pedido</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Marketplace</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Total
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">Nenhum pedido encontrado</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((o) => (
                  <TableRow
                    key={o.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f5f7fa' },
                      borderBottom: '1px solid #e8eef5',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{o.id}</TableCell>
                    <TableCell>{o.marketplace}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(o.status)}
                        color={getStatusColor(o.status)}
                        size="small"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      R$ {(o.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleOpenDetails(o)}
                        >
                          Detalhes
                        </Button>
                        {o.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            onClick={() => handleUpdateStatus(o.id, 'processing')}
                          >
                            Processar
                          </Button>
                        )}
                        {o.status === 'processing' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleUpdateStatus(o.id, 'shipped')}
                          >
                            Enviar
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        <TablePagination
          component="div"
          count={filteredOrders.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>

      {/* Dialog de detalhes do pedido */}
      <Dialog 
        open={detailsOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Detalhes do Pedido
          </Typography>
          <Button onClick={handleCloseDetails} color="inherit" size="small">
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
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
                    R$ {(selectedOrder.total || 0).toFixed(2)}
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
                      {JSON.stringify(JSON.parse(selectedOrder.rawData), null, 2)}
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
