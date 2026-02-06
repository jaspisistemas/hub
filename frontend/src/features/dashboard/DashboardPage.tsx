import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  Store as StoreIcon,
  TrendingUp as RevenueIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';
import { ordersService } from '../../services/ordersService';
import { productsService } from '../../services/productsService';
import { storesService } from '../../services/storesService';
import PageHeader from '../../components/PageHeader';

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalStores: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
  activeStores: number;
}

export default function DashboardPage() {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalStores: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    lowStockProducts: 0,
    activeStores: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [orders, products, stores] = await Promise.all([
        ordersService.getAll(),
        productsService.getAll(),
        storesService.getAll(),
      ]);

      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
      const lowStockProducts = products.filter(p => (p.quantity || 0) < 10).length;
      const activeStores = stores.filter(s => s.status === 'active').length;

      setStats({
        totalOrders: orders.length,
        totalProducts: products.length,
        totalStores: stores.length,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
        lowStockProducts,
        activeStores,
      });
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total de Pedidos',
      value: stats.totalOrders,
      icon: <OrdersIcon sx={{ fontSize: '2rem' }} />,
      color: '#0099FF',
      bgColor: '#dbeafe',
    },
    {
      title: 'Produtos Cadastrados',
      value: stats.totalProducts,
      icon: <ProductsIcon sx={{ fontSize: '2rem' }} />,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
    {
      title: 'Lojas Conectadas',
      value: stats.totalStores,
      icon: <StoreIcon sx={{ fontSize: '2rem' }} />,
      color: '#ec4899',
      bgColor: '#fce7f3',
    },
    {
      title: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      icon: <RevenueIcon sx={{ fontSize: '2rem' }} />,
      color: '#10b981',
      bgColor: '#dcfce7',
    },
  ];

  const secondaryStats = [
    {
      title: 'Pedidos Pendentes',
      value: stats.pendingOrders,
      total: stats.totalOrders,
      icon: <ShippingIcon sx={{ color: '#f59e0b' }} />,
      color: '#f59e0b',
    },
    {
      title: 'Pedidos Entregues',
      value: stats.deliveredOrders,
      total: stats.totalOrders,
      icon: <CompletedIcon sx={{ color: '#10b981' }} />,
      color: '#10b981',
    },
    {
      title: 'Produtos Estoque Baixo',
      value: stats.lowStockProducts,
      total: stats.totalProducts,
      icon: <ProductsIcon sx={{ color: '#ef4444' }} />,
      color: '#ef4444',
    },
    {
      title: 'Lojas Ativas',
      value: stats.activeStores,
      total: stats.totalStores,
      icon: <StoreIcon sx={{ color: '#10b981' }} />,
      color: '#10b981',
    },
  ];

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', p: 3 }}>
      {/* Page Header */}
      <PageHeader 
        title="Dashboard"
        subtitle="Visão geral do seu negócio"
      />

      {/* Principais Métricas */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        mb: 1.5,
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.text.primary,
                        fontSize: '1.875rem',
                      }}
                    >
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: card.bgColor,
                      borderRadius: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {React.cloneElement(card.icon, { sx: { color: card.color, fontSize: '2rem' } })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Métricas Secundárias */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          Detalhamento
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          Análise detalhada das métricas
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {secondaryStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                {stat.icon}
                <Typography 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {stat.title}
                </Typography>
              </Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.text.primary,
                  mb: 2,
                  fontSize: '2.25rem',
                }}
              >
                {stat.value}
              </Typography>
              <Box sx={{ mb: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={stat.total > 0 ? (stat.value / stat.total) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: stat.color,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {stat.total > 0 ? `${((stat.value / stat.total) * 100).toFixed(0)}%` : '0%'} do total
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Resumo Rápido */}
      <Paper 
        sx={{ 
          p: 4,
          borderRadius: 3,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.text.primary,
            mb: 3,
          }}
        >
          Resumo Rápido
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#f9fafb',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : '#f3f4f6',
                },
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#3b82f6', 
                  mb: 0.5,
                  fontSize: '2.5rem',
                }}
              >
                {stats.totalOrders}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Pedidos Totais
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#f9fafb',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#f3f4f6',
                },
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#10b981', 
                  mb: 0.5,
                  fontSize: '2.5rem',
                }}
              >
                {stats.deliveredOrders}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Entregues
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#f9fafb',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : '#f3f4f6',
                },
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#f59e0b', 
                  mb: 0.5,
                  fontSize: '2.5rem',
                }}
              >
                {stats.pendingOrders}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Pendentes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : '#f9fafb',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : '#f3f4f6',
                },
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#8b5cf6', 
                  mb: 0.5,
                  fontSize: '2.5rem',
                }}
              >
                {stats.totalProducts}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Produtos Ativos
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
