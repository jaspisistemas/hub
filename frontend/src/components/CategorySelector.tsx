import { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { apiFetch } from '../services/api';

interface Category {
  id: string;
  name: string;
}

interface CategorySelectorProps {
  storeId: string;
  onCategorySelected: (categoryId: string) => void;
}

export function CategorySelector({ storeId, onCategorySelected }: CategorySelectorProps) {
  const [level1Categories, setLevel1Categories] = useState<Category[]>([]);
  const [level2Categories, setLevel2Categories] = useState<Category[]>([]);
  const [level3Categories, setLevel3Categories] = useState<Category[]>([]);
  
  const [selectedLevel1, setSelectedLevel1] = useState('');
  const [selectedLevel2, setSelectedLevel2] = useState('');
  const [selectedLevel3, setSelectedLevel3] = useState('');
  
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  
  const [error, setError] = useState('');

  // Carregar categorias principais ao montar
  useEffect(() => {
    loadMainCategories();
  }, [storeId]);

  const loadMainCategories = async () => {
    setLoading1(true);
    setError('');
    try {
      const response = await apiFetch<any>(
        `/marketplace/mercadolivre/categories?storeId=${storeId}`
      );
      
      if (response.success) {
        setLevel1Categories(response.categories || []);
      } else {
        setError(response.message || 'Erro ao carregar categorias');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar categorias principais');
    } finally {
      setLoading1(false);
    }
  };

  const loadSubcategories = async (categoryId: string, level: number) => {
    const setLoading = level === 2 ? setLoading2 : setLoading3;
    const setCategories = level === 2 ? setLevel2Categories : setLevel3Categories;
    
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<any>(
        `/marketplace/mercadolivre/categories/${categoryId}?categoryId=${categoryId}&storeId=${storeId}`
      );
      
      if (response.success) {
        const subcats = response.subcategories || [];
        setCategories(subcats);
        
        // Se não houver subcategorias, essa é a categoria final
        if (subcats.length === 0 || (subcats.length === 1 && subcats[0].id === categoryId)) {
          onCategorySelected(categoryId);
        }
      } else {
        setError(response.message || 'Erro ao carregar subcategorias');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar subcategorias');
    } finally {
      setLoading(false);
    }
  };

  const handleLevel1Change = (categoryId: string) => {
    setSelectedLevel1(categoryId);
    setSelectedLevel2('');
    setSelectedLevel3('');
    setLevel2Categories([]);
    setLevel3Categories([]);
    
    if (categoryId) {
      loadSubcategories(categoryId, 2);
    }
  };

  const handleLevel2Change = (categoryId: string) => {
    setSelectedLevel2(categoryId);
    setSelectedLevel3('');
    setLevel3Categories([]);
    
    if (categoryId) {
      loadSubcategories(categoryId, 3);
    }
  };

  const handleLevel3Change = (categoryId: string) => {
    setSelectedLevel3(categoryId);
    
    if (categoryId) {
      onCategorySelected(categoryId);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Categoria Principal */}
      <FormControl fullWidth disabled={loading1}>
        <InputLabel>Categoria Principal *</InputLabel>
        <Select
          value={selectedLevel1}
          onChange={(e) => handleLevel1Change(e.target.value)}
          label="Categoria Principal *"
        >
          {loading1 ? (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Carregando...
            </MenuItem>
          ) : (
            level1Categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Subcategoria (Nível 2) */}
      {level2Categories.length > 0 && (
        <FormControl fullWidth disabled={loading2}>
          <InputLabel>Subcategoria *</InputLabel>
          <Select
            value={selectedLevel2}
            onChange={(e) => handleLevel2Change(e.target.value)}
            label="Subcategoria *"
          >
            {loading2 ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Carregando...
              </MenuItem>
            ) : (
              level2Categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      )}

      {/* Subcategoria (Nível 3) */}
      {level3Categories.length > 0 && (
        <FormControl fullWidth disabled={loading3}>
          <InputLabel>Categoria Específica *</InputLabel>
          <Select
            value={selectedLevel3}
            onChange={(e) => handleLevel3Change(e.target.value)}
            label="Categoria Específica *"
          >
            {loading3 ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Carregando...
              </MenuItem>
            ) : (
              level3Categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
