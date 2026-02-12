import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
} from '@mui/material';
import { FilterList as FilterIcon, Download as DownloadIcon } from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

const COLORS = ['#4F9CF9', '#34C759', '#FF9F0A', '#FF3B30', '#8B5CF6'];

const mockOverview = {
  totalRevenue: 84320,
  totalOrders: 1248,
  averageOrderValue: 67.56,
  conversionRate: 2.9,
};

const mockSalesByPeriod = [
  { date: '01/02', revenue: 4200, orders: 62 },
  { date: '02/02', revenue: 5100, orders: 74 },
  { date: '03/02', revenue: 6800, orders: 88 },
  { date: '04/02', revenue: 5900, orders: 79 },
  { date: '05/02', revenue: 7400, orders: 96 },
  { date: '06/02', revenue: 6900, orders: 90 },
  { date: '07/02', revenue: 8200, orders: 108 },
];

const mockTopProducts = [
  { name: 'Camiseta Essentials', value: 312 },
  { name: 'Tênis Urban', value: 248 },
  { name: 'Mochila Pro', value: 190 },
  { name: 'Jaqueta Tech', value: 164 },
  { name: 'Boné Classic', value: 128 },
];

const mockMarketplace = [
  { name: 'Mercado Livre', value: 46 },
  { name: 'Shopee', value: 26 },
  { name: 'Amazon', value: 18 },
  { name: 'Magazine Luiza', value: 10 },
];

export default function ReportsPage() {
  return (
    <Box>
      <PageHeader
        title="Relatórios"
        subtitle="Acompanhe o desempenho das suas vendas com dados e gráficos em tempo real (mock)."
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Data Inicial"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Data Final"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Marketplace</InputLabel>
            <Select label="Marketplace" defaultValue="all">
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="ml">Mercado Livre</MenuItem>
              <MenuItem value="shopee">Shopee</MenuItem>
              <MenuItem value="amazon">Amazon</MenuItem>
              <MenuItem value="magalu">Magazine Luiza</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<FilterIcon />}>
            Aplicar filtros
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Exportar
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Receita" value={`R$ ${mockOverview.totalRevenue.toLocaleString('pt-BR')}`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pedidos" value={mockOverview.totalOrders} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Ticket Médio" value={`R$ ${mockOverview.averageOrderValue.toFixed(2)}`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Conversão" value={`${mockOverview.conversionRate}%`} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 360 }}>
            <Typography sx={{ mb: 2, fontWeight: 600 }}>Receita e pedidos</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockSalesByPeriod} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Receita" stroke="#4F9CF9" strokeWidth={3} />
                <Line type="monotone" dataKey="orders" name="Pedidos" stroke="#34C759" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 360 }}>
            <Typography sx={{ mb: 2, fontWeight: 600 }}>Marketplaces</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockMarketplace} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {mockMarketplace.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 360 }}>
            <Typography sx={{ mb: 2, fontWeight: 600 }}>Top produtos</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTopProducts} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4F9CF9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 360 }}>
            <Typography sx={{ mb: 2, fontWeight: 600 }}>Produtos mais vendidos</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {mockTopProducts.map((product, index) => (
                <Box key={product.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography>{product.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 120,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: 'rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.round((product.value / mockTopProducts[0].value) * 100)}%`,
                          height: '100%',
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontWeight: 600 }}>{product.value}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
