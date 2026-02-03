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
} from '@mui/material';
import {
  Search as SearchIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { ordersService, Order } from '../../services/ordersService';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadOrders();
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

  const filteredOrders = orders.filter((o) =>
    o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.marketplace?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Acompanhe e gerencie todos os pedidos
          </Typography>
        </Box>
        <Button variant="contained" color="primary">
          Exportar
        </Button>
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
        <TextField
          fullWidth
          placeholder="Buscar por ID do pedido ou marketplace..."
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
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">Nenhum pedido encontrado</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((o) => (
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
                      <Button size="small" color="primary" onClick={() => handleOpenDetails(o)}>
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
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
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedOrder.status)}
                    color={getStatusColor(selectedOrder.status)}
                    size="small"
                  />
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
    </Box>
  );
}
