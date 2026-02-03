import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Avatar,
  AvatarGroup,
  InputAdornment,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';
import { customersService, Customer } from '../../services/customersService';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customersService.getAll();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Clientes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Gerencie seus clientes e relacionamento
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />}>
          Novo Cliente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nome ou email..."
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Telefone</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Localização</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow
                key={customer.id}
                sx={{
                  '&:hover': { backgroundColor: '#f5f7fa' },
                  borderBottom: '1px solid #e8eef5',
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#0099FF', width: 36, height: 36 }}>
                      {getInitials(customer.name)}
                    </Avatar>
                    <Typography sx={{ fontWeight: 500 }}>{customer.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#555555' }}>{customer.email}</TableCell>
                <TableCell sx={{ color: '#555555' }}>{customer.phone || '-'}</TableCell>
                <TableCell>
                  {customer.city ? `${customer.city}, ${customer.state}` : '-'}
                </TableCell>
                <TableCell align="center">
                  <Button size="small" color="primary">
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
