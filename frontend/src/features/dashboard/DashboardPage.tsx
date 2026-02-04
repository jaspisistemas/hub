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
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Visão geral do seu negócio
        </Typography>
      </Box>

      {/* Principais Métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: card.bgColor,
                      borderRadius: 2,
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
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Detalhamento
      </Typography>
      <Grid container spacing={3}>
        {secondaryStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {stat.icon}
                <Typography variant="body2" color="textSecondary">
                  {stat.title}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {stat.value}
              </Typography>
              <Box sx={{ mb: 1 }}>
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
              <Typography variant="caption" color="textSecondary">
                {stat.total > 0 ? `${((stat.value / stat.total) * 100).toFixed(0)}%` : '0%'} do total
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Resumo Rápido */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Resumo Rápido
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#0099FF', mb: 0.5 }}>
                {stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pedidos Totais
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#10b981', mb: 0.5 }}>
                {stats.deliveredOrders}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Entregues
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                {stats.pendingOrders}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pendentes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#8b5cf6', mb: 0.5 }}>
                {stats.totalProducts}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Produtos Ativos
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
