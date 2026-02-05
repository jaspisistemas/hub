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
  Autocomplete,
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
  Sync as SyncIcon,
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
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishStep, setPublishStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMarketplace, setSyncMarketplace] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [formData, setFormData] = useState<CreateProductInput>({
    sku: '',
    name: '',
    price: 0,
    quantity: 0,
    category: '',
    description: '',
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

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await productsService.getMercadoLivreCategories();
      setCategories(data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError('Erro ao carregar categorias do Mercado Livre');
    } finally {
      setLoadingCategories(false);
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
      brand: '',
      model: '',
      description: '',
    });
    setDialogOpen(true);
    loadCategories(); // Carregar categorias ao abrir o diálogo
  };

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    setImageFiles([]);
    const productImageUrls = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
    setImagePreviews(productImageUrls.map(url => `https://uneducated-georgiann-personifiant.ngrok-free.dev${url}`));
    setFormData({
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      brand: product.brand || '',
      model: product.model || '',
      description: product.description || '',
    });
    setDialogOpen(true);
    loadCategories(); // Carregar categorias ao editar também
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
      
      if (formData.brand) {
        formDataToSend.append('brand', formData.brand);
      }
      
      if (formData.model) {
        formDataToSend.append('model', formData.model);
      }
      
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      
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

  // Funções de publicação
  const handleOpenPublishDialog = () => {
    setPublishDialogOpen(true);
    setPublishStep(0);
    setSelectedProducts([]);
    setSelectedMarketplace('');
  };

  const handleClosePublishDialog = () => {
    setPublishDialogOpen(false);
    setPublishStep(0);
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
    if (publishStep === 0 && selectedProducts.length === 0) {
      setError('Selecione pelo menos um produto para publicar');
      return;
    }
    if (publishStep === 1 && !selectedMarketplace) {
      setError('Selecione um marketplace para continuar');
      return;
    }
    setPublishStep(prev => prev + 1);
  };

  const handleBackStep = () => {
    setPublishStep(prev => prev - 1);
  };

  const handlePublishProducts = async () => {
    if (!selectedMarketplace) {
      setError('Selecione um marketplace');
      return;
    }

    try {
      setPublishing(true);
      await productsService.publishToMarketplace(selectedProducts, selectedMarketplace);
      setNotification(`${selectedProducts.length} produto(s) publicado(s) em ${selectedMarketplace} com sucesso!`);
      handleClosePublishDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar produtos');
    } finally {
      setPublishing(false);
    }
  };

  const handleSyncProducts = async () => {
    if (!syncMarketplace) {
      setError('Selecione um marketplace');
      return;
    }

    try {
      setSyncing(true);
      // Chama endpoint de sincronização
      const response = await fetch(`https://uneducated-georgiann-personifiant.ngrok-free.dev/marketplace/${syncMarketplace.toLowerCase()}/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao sincronizar produtos');
      }

      const data = await response.json();
      setNotification(`${data.count || 0} produtos sincronizados com sucesso!`);
      setSyncDialogOpen(false);
      loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar produtos');
    } finally {
      setSyncing(false);
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
            color="success" 
            startIcon={<SyncIcon />} 
            onClick={() => setSyncDialogOpen(true)}
          >
            Sincronizar Produtos
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<UploadIcon />} 
            onClick={handleOpenPublishDialog}
          >
            Publicar Produtos
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
                    src={product.imageUrls?.[0] || product.imageUrl ? `https://uneducated-georgiann-personifiant.ngrok-free.dev${product.imageUrls?.[0] || product.imageUrl}` : undefined}
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
                    R$ {Number(product.price).toFixed(2)}
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
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
          {editingId ? 'Editar Produto' : 'Novo Produto'}
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
              <Autocomplete
                fullWidth
                options={categories}
                getOptionLabel={(option) => `${option.name} (${option.id})`}
                value={categories.find(c => c.id === formData.category) || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, category: newValue?.id || '' }));
                }}
                loading={loadingCategories}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoria"
                    required
                    placeholder="Selecione a categoria do Mercado Livre"
                    helperText="Escolha a categoria que melhor descreve seu produto"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingCategories ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marca"
                value={formData.brand || ''}
                onChange={handleInputChange('brand')}
                placeholder="Ex: Samsung, Apple, Xiaomi"
                helperText="Obrigatório para Mercado Livre"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modelo"
                value={formData.model || ''}
                onChange={handleInputChange('model')}
                placeholder="Ex: Galaxy S21, iPhone 13"
                helperText="Obrigatório para Mercado Livre"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição do Produto"
                value={formData.description || ''}
                onChange={handleInputChange('description')}
                multiline
                rows={4}
                placeholder="Descreva as características e detalhes do produto..."
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

      {/* Dialog de publicação de produtos */}
      <Dialog 
        open={publishDialogOpen} 
        onClose={handleClosePublishDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
          Publicar Produtos no Marketplace
          <IconButton onClick={handleClosePublishDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={publishStep} sx={{ mb: 3 }}>
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

          {publishStep === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Selecione os produtos para publicar
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
                        src={product.imageUrl ? `https://uneducated-georgiann-personifiant.ngrok-free.dev${product.imageUrl}` : undefined}
                        alt={product.name}
                        variant="rounded"
                        sx={{ width: 40, height: 40, mr: 2 }}
                      >
                        {!product.imageUrl && product.name[0]}
                      </Avatar>
                      <ListItemText
                        primary={product.name}
                        secondary={`SKU: ${product.sku} | R$ ${Number(product.price).toFixed(2)} | Estoque: ${product.quantity}`}
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

          {publishStep === 1 && (
            <Box>
              {stores.filter(s => s.status === 'active').length === 0 ? (
                <Alert severity="warning">
                  Nenhum marketplace conectado. Configure uma loja na seção de Lojas para poder publicar produtos.
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
                    {Array.from(new Set(stores.filter(s => s.status === 'active').map(s => s.marketplace))).map((marketplace) => {
                      const storesCount = stores.filter(s => s.status === 'active' && s.marketplace === marketplace).length;
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

          {publishStep === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Revise as informações antes de confirmar a publicação
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
          <Button onClick={handleClosePublishDialog} disabled={publishing}>
            Cancelar
          </Button>
          {publishStep > 0 && (
            <Button onClick={handleBackStep} disabled={publishing}>
              Voltar
            </Button>
          )}
          {publishStep < 2 ? (
            <Button 
              onClick={handleNextStep} 
              variant="contained"
            >
              Avançar
            </Button>
          ) : (
            <Button 
              onClick={handlePublishProducts} 
              variant="contained"
              disabled={publishing}
            >
              {publishing ? <CircularProgress size={24} /> : 'Confirmar Publicação'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de Sincronização */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
          <SyncIcon color="success" />
          Sincronizar Produtos do Marketplace
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Esta ação irá buscar todos os produtos do marketplace selecionado e importá-los para o sistema.
            </Typography>
            <FormControl fullWidth>
              <FormLabel sx={{ mb: 2, fontWeight: 600 }}>Selecione o Marketplace</FormLabel>
              <RadioGroup
                value={syncMarketplace}
                onChange={(e) => setSyncMarketplace(e.target.value)}
              >
                <FormControlLabel 
                  value="MercadoLivre" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>Mercado Livre</Typography>
                      {stores.some(s => s.marketplace === 'MercadoLivre') && (
                        <Chip label="Conectado" size="small" color="success" />
                      )}
                    </Box>
                  }
                  disabled={!stores.some(s => s.marketplace === 'MercadoLivre')}
                />
                <FormControlLabel 
                  value="Shopee" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>Shopee</Typography>
                      {stores.some(s => s.marketplace === 'Shopee') && (
                        <Chip label="Conectado" size="small" color="success" />
                      )}
                    </Box>
                  }
                  disabled={!stores.some(s => s.marketplace === 'Shopee')}
                />
              </RadioGroup>
            </FormControl>
            {!stores.some(s => s.marketplace === 'MercadoLivre' || s.marketplace === 'Shopee') && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Nenhum marketplace conectado. Configure uma loja primeiro.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)} disabled={syncing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSyncProducts} 
            variant="contained"
            color="success"
            disabled={syncing || !syncMarketplace}
            startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
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
