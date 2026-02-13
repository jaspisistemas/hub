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
  Tab,
  Tabs,
  Chip,
  Avatar,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
  BarChart as EmptyChartIcon,
  Info as InfoIcon,
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService, DashboardMetrics, StoreMetrics } from '../../services/dashboardService';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import DataTable, { Column } from '../../components/DataTable';
import { useCompanyCheck } from '../../hooks/useCompanyCheck';

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

export default function DashboardPage() {
  const theme = useTheme();
  useCompanyCheck();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [storeMetrics, setStoreMetrics] = useState<StoreMetrics | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  useEffect(() => {
    if (selectedStore !== 'all' && selectedStore) {
      loadStoreMetrics(selectedStore);
    } else {
      setStoreMetrics(null);
    }
  }, [selectedStore, period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardMetrics(period);
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreMetrics = async (storeId: string) => {
    try {
      const data = await dashboardService.getStoreMetrics(storeId, period);
      setStoreMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar métricas da loja:', err);
      setStoreMetrics(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3 }}>
        <PageHeader title="Dashboard" subtitle="Visão geral do seu negócio" />
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)' }}>
          <InfoIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Não foi possível carregar os dados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verifique sua conexão e tente novamente
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Métricas principais
  const primaryMetric = {
    label: 'Receita Total',
    value: metrics.overview.totalRevenue,
    formatted: `R$ ${metrics.overview.totalRevenue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`,
    color: '#10b981',
    bgColor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#dcfce7',
  };

  const secondaryMetrics = [
    {
      label: 'Pedidos',
      value: metrics.overview.totalOrders,
      color: '#3b82f6',
    },
    {
      label: 'Ticket Médio',
      value: `R$ ${metrics.overview.averageOrderValue.toFixed(2)}`,
      color: '#f59e0b',
    },
    {
      label: 'Lojas',
      value: metrics.overview.totalStores,
      color: '#8b5cf6',
    },
  ];

  const CHART_COLORS = {
    primary: '#10b981',
    secondary: '#3b82f6',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    quinary: '#8b5cf6',
    senary: '#ec4899',
  };

  const PIE_COLORS = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.tertiary,
    CHART_COLORS.quaternary,
    CHART_COLORS.quinary,
    CHART_COLORS.senary,
  ];

  const hasSalesData = metrics.salesByPeriod.some(d => d.revenue > 0 || d.orders > 0);
  const hasOrdersData = metrics.ordersByStatus.length > 0;

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            mb: 1,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral do seu negócio
        </Typography>
      </Box>

      {/* Filtro de Período */}
      <Box sx={{ mb: 4 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={period}
            label="Período"
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            <MenuItem value={7}>7 dias</MenuItem>
            <MenuItem value={15}>15 dias</MenuItem>
            <MenuItem value={30}>30 dias</MenuItem>
            <MenuItem value={60}>60 dias</MenuItem>
            <MenuItem value={90}>90 dias</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Métrica Principal - Receita Total */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 3,
          borderRadius: 3,
          border: `2px solid ${primaryMetric.color}`,
          outline: '1px solid rgba(15, 23, 42, 0.08)',
          bgcolor: primaryMetric.bgColor,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600,
                color: 'text.secondary',
                mb: 1
              }}
            >
              {primaryMetric.label}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: primaryMetric.color,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              {primaryMetric.formatted}
            </Typography>
          </Box>
          <TrendingUpIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: primaryMetric.color, opacity: 0.5 }} />
        </Stack>
      </Paper>

      {/* Métricas Secundárias */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {secondaryMetrics.map((metric, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: metric.color,
                  boxShadow: `0 0 0 1px ${metric.color}`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1.5
                  }}
                >
                  {metric.label}
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', sm: '2rem' }
                  }}
                >
                  {metric.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem'
            }
          }}
        >
          <Tab label="Visão Geral" />
          <Tab label="Por Loja" />
          <Tab label="Comparativo" />
        </Tabs>
      </Paper>

      {/* Tab 0: Visão Geral */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Gráfico de Vendas por Período */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
                Vendas nos últimos {period} dias
              </Typography>
              {hasSalesData ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={metrics.salesByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}
                      tick={{ fontSize: 12 }}
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fontSize: 12 }}
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      stroke={theme.palette.text.secondary}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 4,
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'Receita') return [`R$ ${value.toFixed(2)}`, 'Receita'];
                        return [value, 'Pedidos'];
                      }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={CHART_COLORS.primary}
                      strokeWidth={3}
                      name="Receita"
                      dot={{ r: 3, fill: CHART_COLORS.primary }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="orders" 
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={3}
                      name="Pedidos"
                      dot={{ r: 3, fill: CHART_COLORS.secondary }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: 320,
                  color: 'text.secondary'
                }}>
                  <EmptyChartIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Sem dados para o período selecionado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Ajuste o período ou aguarde a sincronização
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Gráfico de Pedidos por Status */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
                Distribuição por Status
              </Typography>
              {hasOrdersData ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={metrics.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.count}`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {metrics.ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 4,
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '0.75rem' }}
                      formatter={(value, entry) => {
                        const status = entry?.payload?.status;
                        return status ? status.charAt(0).toUpperCase() + status.slice(1) : value;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: 320,
                  color: 'text.secondary'
                }}>
                  <EmptyChartIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="body2" align="center">
                    Sem pedidos no período
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Tabela de Pedidos Recentes */}
          {metrics.recentOrders.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
                  Pedidos Recentes
                </Typography>
                <DataTable
                  columns={[
                    {
                      id: 'externalId',
                      label: 'ID',
                      format: (value) => (
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'monospace', color: '#6366f1' }}>
                          {value}
                        </Typography>
                      ),
                    },
                    {
                      id: 'customerName',
                      label: 'Cliente',
                      format: (value) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: '#3b82f6' }}>
                            {value ? String(value).charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                            {value || 'Sem nome'}
                          </Typography>
                        </Box>
                      ),
                    },
                    {
                      id: 'marketplace',
                      label: 'Loja',
                      align: 'center',
                      format: (value) => {
                        const badge = getMarketplaceBadge(value);
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
                      label: 'Valor',
                      align: 'right',
                      numeric: true,
                      format: (value) => (
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(value)}
                        </Typography>
                      ),
                    },
                    {
                      id: 'createdAt',
                      label: 'Data',
                      align: 'center',
                      format: (_value, row) => {
                        const dateValue = (row as any).orderDate || (row as any).createdAt;
                        return (
                          <Typography sx={{ fontSize: '0.8125rem' }}>
                            {dateValue ? new Date(dateValue).toLocaleString('pt-BR', {
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
                  data={metrics.recentOrders}
                  hover
                />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab 1: Por Loja */}
      {tabValue === 1 && (
        <>
          <Box sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Selecione uma loja</InputLabel>
              <Select
                value={selectedStore}
                label="Selecione uma loja"
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <MenuItem value="all">Todas as lojas</MenuItem>
                {metrics.salesByStore.map((store) => (
                  <MenuItem key={store.storeId} value={store.storeId}>
                    {store.storeName} ({store.marketplace})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedStore === 'all' ? (
            <Grid container spacing={2}>
              {metrics.salesByStore.map((store) => (
                <Grid item xs={12} sm={6} md={4} key={store.storeId}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%',
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: CHART_COLORS.primary,
                        boxShadow: `0 0 0 1px ${CHART_COLORS.primary}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {store.storeName}
                          </Typography>
                          <Chip 
                            label={store.marketplace} 
                            size="small"
                            color={store.marketplace === 'mercadolivre' ? 'warning' : 'primary'}
                          />
                        </Box>
                        
                        <Divider />
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Receita
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: CHART_COLORS.primary }}>
                            R$ {store.revenue.toFixed(2)}
                          </Typography>
                        </Box>
                        
                        <Stack direction="row" spacing={3}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Pedidos
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {store.orders}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Produtos
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {store.products}
                            </Typography>
                          </Box>
                        </Stack>
                        
                        {store.lastSync && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Última sincronização: {new Date(store.lastSync).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : storeMetrics ? (
            <Grid container spacing={3}>
              {/* Métricas da Loja */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {[
                    { label: 'Receita Total', value: `R$ ${storeMetrics.totalRevenue.toFixed(2)}`, color: CHART_COLORS.primary },
                    { label: 'Pedidos', value: storeMetrics.totalOrders, color: CHART_COLORS.secondary },
                    { label: 'Ticket Médio', value: `R$ ${storeMetrics.averageOrderValue.toFixed(2)}`, color: CHART_COLORS.tertiary },
                    { label: 'Produtos', value: storeMetrics.totalProducts, color: CHART_COLORS.quinary },
                  ].map((item, idx) => (
                    <Grid item xs={6} sm={3} key={idx}>
                      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {item.label}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
                            {item.value}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Gráfico de Vendas Diárias */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
                    Vendas Diárias
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={storeMetrics.salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                        }}
                        formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                        labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                      />
                      <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Top Produtos */}
              {storeMetrics.topProducts.length > 0 && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
                      Top 5 Produtos
                    </Typography>
                    <DataTable
                      columns={[
                        {
                          id: 'name',
                          label: 'Produto',
                          format: (value) => (
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {value}
                            </Typography>
                          ),
                        },
                        {
                          id: 'sales',
                          label: 'Vendas',
                          align: 'center',
                          numeric: true,
                          format: (value) => (
                            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                              {value}
                            </Typography>
                          ),
                        },
                        {
                          id: 'revenue',
                          label: 'Receita',
                          align: 'right',
                          numeric: true,
                          format: (value) => (
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(value)}
                            </Typography>
                          ),
                        },
                      ]}
                      data={storeMetrics.topProducts}
                      hover
                    />
                  </Paper>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: 300
            }}>
              <CircularProgress />
            </Box>
          )}
        </>
      )}

      {/* Tab 2: Comparativo entre Lojas */}
      {tabValue === 2 && (
        <>
          {metrics.salesByStore.length > 1 ? (
            <Grid container spacing={3}>
              {/* Comparativo de Receita */}
              <Grid item xs={12} lg={6}>
                <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
                    Receita por Loja
                  </Typography>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={metrics.salesByStore} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
                      <YAxis 
                        dataKey="storeName" 
                        type="category"
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                        width={120}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                        }}
                        formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                      />
                      <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Comparativo de Pedidos */}
              <Grid item xs={12} lg={6}>
                <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
                    Pedidos por Loja
                  </Typography>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={metrics.salesByStore} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
                      <YAxis 
                        dataKey="storeName" 
                        type="category"
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                        width={120}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                        }}
                        formatter={(value: any) => [value, 'Pedidos']}
                      />
                      <Bar dataKey="orders" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Tabela Comparativa */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, fontSize: '1rem' }}>
                    Comparativo Detalhado
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Loja</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Marketplace</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Receita</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Pedidos</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Produtos</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Ticket Médio</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Última Sinc.</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {metrics.salesByStore.map((store) => (
                          <TableRow 
                            key={store.storeId}
                            sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              {store.storeName}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={store.marketplace} 
                                size="small"
                                color={store.marketplace === 'mercadolivre' ? 'warning' : 'primary'}
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 600, color: CHART_COLORS.primary }}>
                              R$ {store.revenue.toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              {store.orders}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              {store.products}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              R$ {store.orders > 0 ? (store.revenue / store.orders).toFixed(2) : '0.00'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              {store.lastSync 
                                ? new Date(store.lastSync).toLocaleString('pt-BR', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : '—'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
              <ChartIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Comparativo indisponível
              </Typography>
              <Typography variant="body2" color="text.secondary">
                É necessário ter 2 ou mais lojas conectadas para visualizar o comparativo
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
