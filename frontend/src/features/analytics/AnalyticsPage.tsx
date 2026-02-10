import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  useTheme,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Stack,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import analyticsService, { AnalyticsDashboard } from '../../services/analyticsService';
import { storesService, Store } from '../../services/storesService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
    loadAnalytics();
  }, []);

  const loadStores = async () => {
    try {
      const storesData = await storesService.getAll();
      setStores(storesData);
    } catch (err) {
      console.error('Erro ao carregar lojas:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const analytics = await analyticsService.getDashboard({
        startDate,
        endDate,
        storeId: selectedStore || undefined,
      });
      setData(analytics);
    } catch (err: any) {
      console.error('Erro ao carregar analytics:', err);
      setError(err.message || 'Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadAnalytics();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={3}>
        <Alert severity="info">Nenhum dado disponível</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Relatórios e Analytics"
        subtitle="Análise detalhada de vendas, produtos e performance"
        icon={<ChartIcon />}
      />

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Data Inicial"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="Data Final"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Loja</InputLabel>
            <Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              label="Loja"
            >
              <MenuItem value="">Todas as lojas</MenuItem>
              {stores.map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<FilterIcon />}
            onClick={handleApplyFilters}
          >
            Aplicar Filtros
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAnalytics}
          >
            Atualizar
          </Button>
        </Stack>
      </Paper>

      {/* Cards de Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Receita Total"
            value={formatCurrency(data.salesOverview.totalRevenue)}
            icon={<ChartIcon />}
            trend={
              data.salesOverview.revenueGrowth !== 0
                ? {
                    value: formatPercentage(data.salesOverview.revenueGrowth),
                    isPositive: data.salesOverview.revenueGrowth > 0,
                  }
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Pedidos"
            value={data.salesOverview.totalOrders.toString()}
            icon={<ChartIcon />}
            trend={
              data.salesOverview.ordersGrowth !== 0
                ? {
                    value: formatPercentage(data.salesOverview.ordersGrowth),
                    isPositive: data.salesOverview.ordersGrowth > 0,
                  }
                : undefined
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(data.salesOverview.averageOrderValue)}
            icon={<ChartIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taxa de Crescimento"
            value={formatPercentage(data.salesOverview.revenueGrowth)}
            icon={
              data.salesOverview.revenueGrowth >= 0 ? (
                <TrendingUpIcon />
              ) : (
                <TrendingDownIcon />
              )
            }
            color={data.salesOverview.revenueGrowth >= 0 ? 'success' : 'error'}
          />
        </Grid>
      </Grid>

      {/* Gráfico de Vendas por Período */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vendas por Período
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {data.salesByPeriod.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.salesByPeriod}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                formatter={(value: any, name: string) =>
                  name === 'revenue'
                    ? [formatCurrency(value), 'Receita']
                    : [value, 'Pedidos']
                }
              />
              <Legend
                formatter={(value) => (value === 'revenue' ? 'Receita' : 'Pedidos')}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Alert severity="info">Nenhuma venda no período selecionado</Alert>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Top Produtos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Top Produtos Mais Vendidos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) =>
                      name === 'revenue'
                        ? [formatCurrency(value), 'Receita']
                        : [value, 'Quantidade']
                    }
                  />
                  <Legend />
                  <Bar dataKey="totalSold" fill={theme.palette.primary.main} name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info">Nenhum produto vendido no período</Alert>
            )}
          </Paper>
        </Grid>

        {/* Performance por Marketplace */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Performance por Marketplace
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.marketplacePerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.marketplacePerformance}
                    dataKey="revenue"
                    nameKey="marketplace"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.marketplace} (${entry.percentage}%)`}
                  >
                    {data.marketplacePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info">Nenhum marketplace com vendas</Alert>
            )}
          </Paper>
        </Grid>

        {/* Pedidos por Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pedidos por Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.ordersByStatus.length > 0 ? (
              <Stack spacing={2}>
                {data.ordersByStatus.map((status, index) => (
                  <Box key={status.status}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" fontWeight="medium">
                        {status.status}
                      </Typography>
                      <Chip
                        label={`${status.count} (${status.percentage}%)`}
                        size="small"
                        color="primary"
                      />
                    </Stack>
                    <Box
                      sx={{
                        mt: 1,
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${status.percentage}%`,
                          bgcolor: COLORS[index % COLORS.length],
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">Nenhum pedido no período</Alert>
            )}
          </Paper>
        </Grid>

        {/* Lista de Top Produtos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detalhes dos Produtos Mais Vendidos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {data.topProducts.length > 0 ? (
              <Stack spacing={1.5}>
                {data.topProducts.slice(0, 5).map((product, index) => (
                  <Box key={product.productId}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {index + 1}. {product.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {product.sku}
                        </Typography>
                      </Box>
                      <Stack direction="column" alignItems="flex-end" spacing={0.5}>
                        <Chip
                          label={`${product.totalSold} vendidos`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="caption" fontWeight="medium">
                          {formatCurrency(product.revenue)}
                        </Typography>
                      </Stack>
                    </Stack>
                    {index < data.topProducts.slice(0, 5).length - 1 && (
                      <Divider sx={{ mt: 1.5 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">Nenhum produto vendido no período</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
