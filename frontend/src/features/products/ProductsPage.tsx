import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  Tooltip,
  Menu,
  MenuItem,
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
  Inventory as ProductsIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import DataTable, { Column, TableImage, TruncatedText } from '../../components/DataTable';
import { productsService, Product, CreateProductInput } from '../../services/productsService';
import { storesService, Store } from '../../services/storesService';
import * as websocket from '../../services/websocket';
import { CategorySelector } from '../../components/CategorySelector';
import { DynamicProductForm } from '../../components/DynamicProductForm';

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuProductId, setMenuProductId] = useState<string | null>(null);
  
  // Wizard de criação de produto
  const [productStep, setProductStep] = useState(0); // 0 = selecionar categoria, 1 = preencher dados
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [mlAttributes, setMlAttributes] = useState<Record<string, any>>({});
  
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

  // Helper para construir URL de imagem
  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    // Se já é uma URL absoluta (começa com http ou https), retorna como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Se é um caminho relativo de uploads, adiciona o prefixo do backend
    if (url.startsWith('/')) {
      return `https://uneducated-georgiann-personifiant.ngrok-free.dev${url}`;
    }
    // Caso padrão: adiciona o prefixo
    return `https://uneducated-georgiann-personifiant.ngrok-free.dev${url}`;
  };

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    setImageFiles([]);
    const productImageUrls = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
    setImagePreviews(productImageUrls.map(url => getImageUrl(url)));
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
    // Carregar atributos do ML se existirem
    if (product.mlCategoryId) {
      setSelectedCategoryId(product.mlCategoryId);
    }
    if (product.mlAttributes) {
      // Limpar índices numéricos do mlAttributes
      const cleanedAttrs: Record<string, any> = {};
      Object.keys(product.mlAttributes).forEach(key => {
        if (isNaN(Number(key))) {
          cleanedAttrs[key] = product.mlAttributes![key];
        }
      });
      setMlAttributes(cleanedAttrs);
    }
    setDialogOpen(true);
    loadCategories(); // Carregar categorias ao editar também
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setImageFiles([]);
    setImagePreviews([]);
    setProductStep(0);
    setSelectedCategoryId('');
    setMlAttributes({});
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

  const handleCategorySelected = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setFormData(prev => ({ ...prev, mlCategoryId: categoryId } as any));
  };

  const handleMlAttributeChange = (field: string, value: any) => {
    setMlAttributes(prev => ({ ...prev, [field]: value }));
  };

  const handleNextProductStep = () => {
    if (productStep === 0 && selectedCategoryId) {
      setProductStep(1);
    }
  };

  const handlePreviousProductStep = () => {
    if (productStep === 1) {
      setProductStep(0);
    }
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
      if (!formData.sku || !formData.name) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      setSaving(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('quantity', formData.quantity.toString());
      
      if (formData.category) {
        formDataToSend.append('category', formData.category);
      }
      
      if (formData.brand) {
        formDataToSend.append('brand', formData.brand);
      }
      
      if (formData.model) {
        formDataToSend.append('model', formData.model);
      }
      
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }

      // Adicionar campos do Mercado Livre
      if (selectedCategoryId) {
        formDataToSend.append('mlCategoryId', selectedCategoryId);
      }

      if (Object.keys(mlAttributes).length > 0) {
        // Limpar mlAttributes para remover índices numéricos (se houver)
        const cleanedAttributes: Record<string, any> = {};
        Object.keys(mlAttributes).forEach(key => {
          // Ignorar índices numéricos, manter apenas chaves válidas
          if (isNaN(Number(key))) {
            cleanedAttributes[key] = mlAttributes[key];
          }
        });
        
        formDataToSend.append('mlAttributes', JSON.stringify(cleanedAttributes));
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
      <PageHeader 
        title="Produtos"
        subtitle="Gerencie o catálogo de produtos"
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="success" 
              startIcon={<SyncIcon />} 
              onClick={() => setSyncDialogOpen(true)}
            >
              Sincronizar
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<UploadIcon />} 
              onClick={handleOpenPublishDialog}
            >
              Publicar
            </Button>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenDialog}>
              Novo Produto
            </Button>
          </Box>
        }
      />

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

      <DataTable<Product>
        columns={[
          {
            id: 'image',
            label: 'Imagem',
            width: 80,
            format: (_, row) => (
              <TableImage
                src={getImageUrl(row.imageUrls?.[0] || row.imageUrl)}
                alt={row.name}
              />
            ),
          },
          {
            id: 'name',
            label: 'Produto',
            minWidth: 200,
            format: (value) => <TruncatedText maxLength={50}>{value}</TruncatedText>,
          },
          {
            id: 'sku',
            label: 'SKU',
            format: (value) => (
              <Chip 
                label={value} 
                variant="outlined" 
                size="small" 
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            ),
          },
          {
            id: 'price',
            label: 'Preço',
            align: 'right',
            numeric: true,
            format: (value) => (
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(Number(value))}
              </Typography>
            ),
          },
          {
            id: 'quantity',
            label: 'Estoque',
            align: 'center',
            numeric: true,
            format: (value) => (
              <Typography
                sx={{
                  fontWeight: value < 10 ? 600 : 500,
                  fontSize: '0.9375rem',
                  color: value === 0 
                    ? 'text.secondary' 
                    : value < 10 
                      ? '#f59e0b' 
                      : '#10b981',
                }}
              >
                {value}
              </Typography>
            ),
          },
          {
            id: 'category',
            label: 'Categoria',
            format: (value) => (
              <Chip 
                label={value} 
                variant="outlined" 
                size="small"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            ),
          },
          {
            id: 'status',
            label: 'Status',
            format: (_, row) => (
              <Chip
                label={row.quantity > 0 ? 'Ativo' : 'Sem Estoque'}
                color={row.quantity > 0 ? 'success' : 'error'}
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
        ]}
        data={filteredProducts}
        loading={loading}
        emptyMessage={searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
        emptyIcon={<ProductsIcon sx={{ fontSize: 60 }} />}
        showActions
        onRowAction={(product, event) => {
          setAnchorEl(event.currentTarget);
          setMenuProductId(product.id);
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setMenuProductId(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem 
          onClick={() => {
            const product = filteredProducts.find(p => p.id === menuProductId);
            if (product) {
              handleEditProduct(product);
            }
            setAnchorEl(null);
            setMenuProductId(null);
          }}
        >
          Editar
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuProductId) {
              handleDeleteProduct(menuProductId);
            }
            setAnchorEl(null);
            setMenuProductId(null);
          }}
          sx={{ color: '#ef4444' }}
        >
          Deletar
        </MenuItem>
      </Menu>

      {/* Dialog de adicionar/editar produto */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          px: 3,
          pt: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(66, 165, 245, 0.15)'
                : 'rgba(66, 165, 245, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ProductsIcon sx={{ color: '#42A5F5', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingId ? 'Editar Produto' : 'Novo Produto'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        {!editingId && (
          <Box sx={{ px: 3, pt: 2, pb: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0d1117' : '#f5f7fa', borderBottom: (theme) => theme.palette.mode === 'dark' ? '1px solid #30363d' : 'none' }}>
            <Stepper activeStep={productStep} alternativeLabel>
              <Step>
                <StepLabel>Categoria</StepLabel>
              </Step>
              <Step>
                <StepLabel>Dados Básicos</StepLabel>
              </Step>
            </Stepper>
          </Box>
        )}

        <DialogContent sx={{ px: 3, py: 3 }}>
          {/* Step 0: Seleção de Categoria */}
          {!editingId && productStep === 0 && stores.length > 0 && (
            <Box sx={{ py: 2 }}>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} icon={<SearchIcon />}>
                <strong>Selecione a categoria</strong> do Mercado Livre para cadastrar o produto
              </Alert>
              <CategorySelector
                storeId={stores[0]?.id || ''}
                onCategorySelected={handleCategorySelected}
              />
            </Box>
          )}

          {/* Step 1: Formulário do Produto */}
          {(editingId || productStep === 1) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Seção de Imagens */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUploadIcon color="primary" />
                  Imagens do Produto
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {imagePreviews.length > 0 && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, width: '100%' }}>
                      {imagePreviews.map((preview, index) => (
                        <Box key={index} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                          <Avatar
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            variant="rounded"
                            sx={{ width: '100%', height: 120 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.main' },
                              backdropFilter: 'blur(4px)'
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
                    variant={imagePreviews.length === 0 ? 'contained' : 'outlined'}
                    startIcon={<CloudUploadIcon />}
                    disabled={imagePreviews.length >= 5}
                    sx={{ minWidth: 250 }}
                  >
                    {imagePreviews.length >= 5 ? 'Máximo de 5 imagens' : imagePreviews.length === 0 ? 'Adicionar Imagens' : `Adicionar Mais (${imagePreviews.length}/5)`}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                    />
                  </Button>
                  {imagePreviews.length === 0 && (
                    <Typography variant="caption" color="textSecondary">
                      Adicione até 5 imagens do produto
                    </Typography>
                  )}
                </Box>
              </Paper>

              {/* Seção de Informações Básicas */}
              <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EditIcon color="primary" />
                  Informações Básicas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SKU"
                      value={formData.sku}
                      onChange={handleInputChange('sku')}
                      required
                      placeholder="Ex: PROD001"
                      helperText="Código único do produto"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nome do Produto"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      required
                      placeholder="Ex: Smartphone Samsung Galaxy S21"
                      variant="outlined"
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
                      variant="outlined"
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
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Descrição"
                      value={formData.description || ''}
                      onChange={handleInputChange('description')}
                      multiline
                      rows={4}
                      placeholder="Descreva as características, benefícios e detalhes técnicos do produto..."
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Atributos obrigatórios do Mercado Livre */}
              {selectedCategoryId && stores.length > 0 && (
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                    <img 
                      src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.1/mercadolibre/logo__large_plus.png" 
                      alt="ML" 
                      style={{ height: 24 }}
                    />
                    Atributos Obrigatórios do Mercado Livre
                  </Typography>
                  <DynamicProductForm
                    categoryId={selectedCategoryId}
                    storeId={stores[0]?.id || ''}
                    formData={mlAttributes}
                    onChange={handleMlAttributeChange}
                  />
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0d1117' : '#f5f7fa', borderTop: (theme) => theme.palette.mode === 'dark' ? '1px solid #30363d' : 'none', gap: 1 }}>
          {!editingId && productStep === 1 && (
            <Button 
              onClick={handlePreviousProductStep} 
              disabled={saving}
              startIcon={<SearchIcon />}
              sx={{ mr: 'auto' }}
            >
              Voltar
            </Button>
          )}
          <Button onClick={handleCloseDialog} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          {!editingId && productStep === 0 ? (
            <Button 
              onClick={handleNextProductStep} 
              variant="contained"
              disabled={!selectedCategoryId}
              sx={{ minWidth: 120 }}
            >
              Avançar
            </Button>
          ) : (
            <Button 
              onClick={handleSaveProduct} 
              variant="contained" 
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
              sx={{ minWidth: 120 }}
            >
              {saving ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de publicação de produtos */}
      <Dialog 
        open={publishDialogOpen} 
        onClose={handleClosePublishDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          px: 3,
          pt: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(66, 165, 245, 0.15)'
                : 'rgba(66, 165, 245, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UploadIcon sx={{ color: '#42A5F5', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Publicar Produtos no Marketplace
            </Typography>
          </Box>
          <IconButton onClick={handleClosePublishDialog} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
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
                        src={getImageUrl(product.imageUrl)}
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
      <Dialog 
        open={syncDialogOpen} 
        onClose={() => setSyncDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          px: 3,
          pt: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <SyncIcon sx={{ color: '#10b981', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Sincronizar Produtos do Marketplace
            </Typography>
          </Box>
          <IconButton onClick={() => setSyncDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
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
