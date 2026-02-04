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
  Snackbar,
  IconButton,
  Avatar,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Close as CloseIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Upload as UploadIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { productsService, Product, CreateProductInput } from '../../services/productsService';
import { storesService, Store } from '../../services/storesService';
import * as websocket from '../../services/websocket';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStep, setExportStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [exporting, setExporting] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [formData, setFormData] = useState<CreateProductInput>({
    sku: '',
    name: '',
    price: 0,
    quantity: 0,
    category: '',
  });

  useEffect(() => {
    loadProducts();
    loadStores();
    
    // Conectar ao WebSocket
    websocket.connect();
    
    // Escutar eventos de produtos
    websocket.onProductCreated((product) => {
      console.log('Novo produto recebido:', product);
      setProducts((prev) => [product, ...prev]);
      setNotification('Novo produto criado!');
    });
    
    websocket.onProductUpdated((product) => {
      console.log('Produto atualizado:', product);
      setProducts((prev) => 
        prev.map((p) => (p.id === product.id ? { ...p, ...product } : p))
      );
      setNotification('Produto atualizado!');
    });
    
    websocket.onProductDeleted((payload) => {
      console.log('Produto removido:', payload);
      setProducts((prev) => prev.filter((p) => p.id !== payload.id));
      setNotification('Produto removido!');
    });
    
    return () => {
      websocket.disconnect();
    };
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

  const loadStores = async () => {
    try {
      const data = await storesService.getAll();
      setStores(data);
    } catch (err) {
      console.error('Erro ao carregar lojas:', err);
    }
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setImageFiles([]);
    setImagePreviews([]);
    setFormData({
      sku: '',
      name: '',
      price: 0,
      quantity: 0,
      category: '',
    });
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    setImageFiles([]);
    const productImageUrls = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
    setImagePreviews(productImageUrls.map(url => `http://localhost:3000${url}`));
    setFormData({
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalImages = imageFiles.length + newFiles.length;
      
      if (totalImages > 5) {
        setError('Máximo de 5 imagens permitidas');
        return;
      }

      setImageFiles(prev => [...prev, ...newFiles]);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
      
      const formDataToSend = new FormData();
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('quantity', formData.quantity.toString());
      formDataToSend.append('category', formData.category);
      
      // Adicionar múltiplas imagens
      imageFiles.forEach((file, index) => {
        formDataToSend.append('images', file);
      });
      
      if (editingId) {
        await productsService.updateWithImage(editingId, formDataToSend);
        setNotification('Produto atualizado com sucesso!');
      } else {
        await productsService.createWithImage(formDataToSend);
        setNotification('Produto criado com sucesso!');
      }
      
      await loadProducts();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      await productsService.delete(id);
      setNotification('Produto excluído com sucesso!');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  };

  // Funções de exportação
  const handleOpenExportDialog = () => {
    setExportDialogOpen(true);
    setExportStep(0);
    setSelectedProducts([]);
    setSelectedMarketplace('');
  };

  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
    setExportStep(0);
    setSelectedProducts([]);
    setSelectedMarketplace('');
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleNextStep = () => {
    if (exportStep === 0 && selectedProducts.length === 0) {
      setError('Selecione pelo menos um produto para exportar');
      return;
    }
    if (exportStep === 1 && !selectedMarketplace) {
      setError('Selecione um marketplace para continuar');
      return;
    }
    setExportStep(prev => prev + 1);
  };

  const handleBackStep = () => {
    setExportStep(prev => prev - 1);
  };

  const handleExportProducts = async () => {
    if (!selectedMarketplace) {
      setError('Selecione um marketplace');
      return;
    }

    try {
      setExporting(true);
      await productsService.exportToMarketplace(selectedProducts, selectedMarketplace);
      setNotification(`${selectedProducts.length} produto(s) exportado(s) para ${selectedMarketplace} com sucesso!`);
      handleCloseExportDialog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar produtos');
    } finally {
      setExporting(false);
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<UploadIcon />} 
            onClick={handleOpenExportDialog}
          >
            Exportar Produtos
          </Button>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenDialog}>
            Novo Produto
          </Button>
        </Box>
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
              <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Imagem</TableCell>
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
                <TableCell>
                  <Avatar
                    src={product.imageUrls?.[0] || product.imageUrl ? `http://localhost:3000${product.imageUrls?.[0] || product.imageUrl}` : undefined}
                    alt={product.name}
                    variant="rounded"
                    sx={{ width: 50, height: 50 }}
                  >
                    {!product.imageUrls?.[0] && !product.imageUrl && product.name[0]}
                  </Avatar>
                </TableCell>
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
                  <IconButton size="small" color="primary" onClick={() => handleEditProduct(product)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteProduct(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de adicionar/editar produto */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingId ? 'Editar Produto' : 'Novo Produto'}
          </Typography>
          <Button onClick={handleCloseDialog} color="inherit" size="small">
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {imagePreviews.length > 0 && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, width: '100%' }}>
                    {imagePreviews.map((preview, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <Avatar
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          variant="rounded"
                          sx={{ width: '100%', height: 100 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: -10,
                            right: -10,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  disabled={imagePreviews.length >= 5}
                >
                  {imagePreviews.length >= 5 ? 'Máximo de 5 imagens' : `Adicionar Imagem (${imagePreviews.length}/5)`}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                </Button>
                {imagePreviews.length > 0 && (
                  <Typography variant="caption" color="textSecondary">
                    Clique no X para remover uma imagem
                  </Typography>
                )}
              </Box>
            </Grid>
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

      {/* Dialog de exportação de produtos */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={handleCloseExportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Exportar Produtos para Marketplace
          </Typography>
          <IconButton onClick={handleCloseExportDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={exportStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Selecionar Produtos</StepLabel>
            </Step>
            <Step>
              <StepLabel>Escolher Marketplace</StepLabel>
            </Step>
            <Step>
              <StepLabel>Confirmar</StepLabel>
            </Step>
          </Stepper>

          {exportStep === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Selecione os produtos para exportar
                </Typography>
                <Button 
                  size="small" 
                  onClick={handleSelectAllProducts}
                >
                  {selectedProducts.length === filteredProducts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </Box>
              <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                <List>
                  {filteredProducts.map((product) => (
                    <ListItem 
                      key={product.id}
                      button
                      onClick={() => handleToggleProduct(product.id)}
                      sx={{ 
                        borderBottom: '1px solid #e0e0e0',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <Avatar
                        src={product.imageUrl ? `http://localhost:3000${product.imageUrl}` : undefined}
                        alt={product.name}
                        variant="rounded"
                        sx={{ width: 40, height: 40, mr: 2 }}
                      >
                        {!product.imageUrl && product.name[0]}
                      </Avatar>
                      <ListItemText
                        primary={product.name}
                        secondary={`SKU: ${product.sku} | R$ ${product.price.toFixed(2)} | Estoque: ${product.quantity}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                {selectedProducts.length} produto(s) selecionado(s)
              </Typography>
            </Box>
          )}

          {exportStep === 1 && (
            <Box>
              {stores.filter(s => s.active).length === 0 ? (
                <Alert severity="warning">
                  Nenhum marketplace conectado. Configure uma loja na seção de Lojas para poder exportar produtos.
                </Alert>
              ) : (
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                    Escolha o marketplace de destino (apenas marketplaces conectados)
                  </FormLabel>
                  <RadioGroup
                    value={selectedMarketplace}
                    onChange={(e) => setSelectedMarketplace(e.target.value)}
                  >
                    {Array.from(new Set(stores.filter(s => s.active).map(s => s.marketplace))).map((marketplace) => {
                      const storesCount = stores.filter(s => s.active && s.marketplace === marketplace).length;
                      return (
                        <FormControlLabel 
                          key={marketplace}
                          value={marketplace} 
                          control={<Radio />} 
                          label={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {marketplace}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {storesCount} loja(s) conectada(s)
                              </Typography>
                            </Box>
                          }
                        />
                      );
                    })}
                  </RadioGroup>
                </FormControl>
              )}
            </Box>
          )}

          {exportStep === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Revise as informações antes de confirmar a exportação
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Produtos selecionados: {selectedProducts.length}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    {products
                      .filter(p => selectedProducts.includes(p.id))
                      .map((product) => (
                        <Typography key={product.id} variant="body2" sx={{ mb: 0.5 }}>
                          • {product.name} (SKU: {product.sku})
                        </Typography>
                      ))}
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Marketplace de destino
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedMarketplace}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog} disabled={exporting}>
            Cancelar
          </Button>
          {exportStep > 0 && (
            <Button onClick={handleBackStep} disabled={exporting}>
              Voltar
            </Button>
          )}
          {exportStep < 2 ? (
            <Button 
              onClick={handleNextStep} 
              variant="contained"
            >
              Avançar
            </Button>
          ) : (
            <Button 
              onClick={handleExportProducts} 
              variant="contained"
              disabled={exporting}
            >
              {exporting ? <CircularProgress size={24} /> : 'Confirmar Exportação'}
            </Button>
          )}
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
