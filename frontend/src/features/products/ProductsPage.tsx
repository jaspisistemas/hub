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
  InputAdornment,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { productsService, Product, CreateProductInput } from '../../services/productsService';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateProductInput>({
    sku: '',
    name: '',
    price: 0,
    quantity: 0,
    category: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsService.getAll();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      sku: '',
      name: '',
      price: 0,
      quantity: 0,
      category: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (field: keyof CreateProductInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'price' || field === 'quantity' 
      ? parseFloat(e.target.value) || 0 
      : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProduct = async () => {
    try {
      if (!formData.sku || !formData.name || !formData.category) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      setSaving(true);
      await productsService.create(formData);
      await loadProducts();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Produtos
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Gerencie o catálogo de produtos
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Novo Produto
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
          placeholder="Buscar por nome ou SKU..."
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
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Produto</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>SKU</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                Preço
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                Estoque
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Categoria</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow
                key={product.id}
                sx={{
                  '&:hover': { backgroundColor: '#f5f7fa' },
                  borderBottom: '1px solid #e8eef5',
                }}
              >
                <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                <TableCell sx={{ color: '#555555' }}>{product.sku}</TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    R$ {product.price.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography
                    sx={{
                      fontWeight: 500,
                      color: product.quantity === 0 ? '#ef4444' : '#10b981',
                    }}
                  >
                    {product.quantity}
                  </Typography>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  <Chip
                    label={product.quantity > 0 ? 'Ativo' : 'Sem Estoque'}
                    color={product.quantity > 0 ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Button size="small" color="primary" startIcon={<EditIcon />}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de adicionar produto */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Novo Produto
          </Typography>
          <Button onClick={handleCloseDialog} color="inherit" size="small">
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={handleInputChange('sku')}
                required
                placeholder="Ex: PROD001"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Produto"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
                placeholder="Ex: Smartphone XYZ"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preço"
                type="number"
                value={formData.price}
                onChange={handleInputChange('price')}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantidade em Estoque"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange('quantity')}
                required
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Categoria"
                value={formData.category}
                onChange={handleInputChange('category')}
                required
                placeholder="Ex: Eletrônicos"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveProduct} 
            variant="contained" 
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
