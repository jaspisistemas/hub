import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { apiFetch } from '../services/api';

interface ProductAttribute {
  id: string;
  name: string;
  value_type: string;
  values: Array<{ id: string; name: string }>;
  tags: {
    required?: boolean;
    read_only?: boolean;
    hidden?: boolean;
  };
}

interface DynamicProductFormProps {
  categoryId: string;
  storeId: string;
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export function DynamicProductForm({ categoryId, storeId, formData, onChange }: DynamicProductFormProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryId && storeId) {
      loadAttributes();
    }
  }, [categoryId, storeId]);

  const loadAttributes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<any>(
        `/marketplace/mercadolivre/categories/${categoryId}/attributes?categoryId=${categoryId}&storeId=${storeId}`
      );
      
      if (response.success) {
        setAttributes(response.attributes || []);
      } else {
        setError(response.message || 'Erro ao carregar atributos');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar atributos da categoria');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (attr: ProductAttribute) => {
    // Renderizar apenas atributos obrigatórios
    if (!attr.tags?.required) {
      return null;
    }

    const isRequired = attr.tags?.required === true;
    const label = `${attr.name}${isRequired ? ' *' : ''}`;
    const savedValue = formData[attr.id] || '';
    
    // Se foi salvo um valor (name), encontrar o ID correspondente
    let selectValue = '';
    if (attr.values && attr.values.length > 0) {
      // Se o valor salvo é um ID, usar diretamente
      if (attr.values.some(v => v.id === savedValue)) {
        selectValue = savedValue;
      } else if (savedValue) {
        // Se o valor salvo é um name, procurar o ID
        const matchingValue = attr.values.find(v => v.name === savedValue);
        selectValue = matchingValue?.id || savedValue;
      }
    } else {
      selectValue = savedValue;
    }

    // Campo com valores predefinidos (dropdown)
    if (attr.values && attr.values.length > 0) {
      const theme = useTheme();
      return (
        <FormControl fullWidth key={attr.id} required={isRequired}>
          <InputLabel>{label}</InputLabel>
          <Select
            value={selectValue}
            onChange={(e) => {
              const selectedValue = e.target.value;
              // Enviar o name do valor selecionado (não o ID)
              const selectedOption = attr.values.find(v => v.id === selectedValue);
              onChange(attr.id, selectedOption?.name || selectedValue);
            }}
            label={label}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
                '& fieldset': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? '#30363d' : '#e5e7eb',
                },
                '&:hover fieldset': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? '#444c56' : '#d1d5db',
                },
                '&.Mui-focused fieldset': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
                }
              },
              '& .MuiInputLabel-root': {
                color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : '#9ca3af',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
              }
            }}
          >
            <MenuItem value="">
              <em>Selecione...</em>
            </MenuItem>
            {attr.values.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Campo numérico
    if (attr.value_type === 'number' || attr.value_type === 'number_unit') {
      const theme = useTheme();
      return (
        <TextField
          key={attr.id}
          fullWidth
          required={isRequired}
          label={label}
          type="number"
          value={savedValue}
          onChange={(e) => onChange(attr.id, e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
              '& fieldset': {
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#30363d' : '#e5e7eb',
              },
              '&:hover fieldset': {
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#444c56' : '#d1d5db',
              },
              '&.Mui-focused fieldset': {
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
              }
            },
            '& .MuiInputLabel-root': {
              color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : '#9ca3af',
            }
          }}
        />
      );
    }

    // Campo de texto padrão
    const theme = useTheme();
    return (
      <TextField
        key={attr.id}
        fullWidth
        required={isRequired}
        label={label}
        value={savedValue}
        onChange={(e) => onChange(attr.id, e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            color: (theme) => theme.palette.mode === 'dark' ? '#c9d1d9' : '#1f2937',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#161b22' : '#ffffff',
            '& fieldset': {
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#30363d' : '#e5e7eb',
            },
            '&:hover fieldset': {
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#444c56' : '#d1d5db',
            },
            '&.Mui-focused fieldset': {
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
            }
          },
          '& .MuiInputLabel-root': {
            color: (theme) => theme.palette.mode === 'dark' ? '#8b949e' : '#9ca3af',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: (theme) => theme.palette.mode === 'dark' ? '#58a6ff' : '#3b82f6',
          }
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={() => setError('')}>
        {error}
      </Alert>
    );
  }

  if (attributes.length === 0) {
    return (
      <Alert severity="info">
        Esta categoria não possui atributos obrigatórios adicionais.
      </Alert>
    );
  }

  // Filtrar apenas atributos obrigatórios
  const requiredAttributes = attributes.filter(attr => attr.tags?.required === true);

  if (requiredAttributes.length === 0) {
    return (
      <Alert severity="success">
        Esta categoria não possui atributos obrigatórios adicionais.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {requiredAttributes.map((attr) => renderField(attr))}
    </Box>
  );
}
