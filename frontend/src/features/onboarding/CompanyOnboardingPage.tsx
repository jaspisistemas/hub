import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  useTheme,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { companyService } from '../../services/companyService';
import { profileService } from '../../services/profileService';
import { useNavigate } from 'react-router-dom';

interface CompanyForm {
  name: string;
  cnpj: string;
  address: string;
  logoUrl: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export default function CompanyOnboardingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<CompanyForm>({
    name: '',
    cnpj: '',
    address: '',
    logoUrl: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
      });
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as {
            id?: string;
            name?: string;
            email?: string;
            avatarUrl?: string;
          };
          if (parsed?.name && parsed?.email) {
            setUser({
              id: parsed.id || '',
              name: parsed.name,
              email: parsed.email,
              avatarUrl: parsed.avatarUrl,
            });
          }
        }
      } catch (storageError) {
        console.error('Erro ao ler usuário do storage:', storageError);
      }
    } finally {
      setLoadingUser(false);
    }
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: keyof CompanyForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome da empresa é obrigatório');
      return;
    }

    if (formData.logoUrl && !isValidUrl(formData.logoUrl)) {
      setError('URL da logo inválida');
      return;
    }

    try {
      setLoading(true);
      const newCompany = await companyService.createCompany({
        name: formData.name,
        cnpj: formData.cnpj,
        address: formData.address,
        logoUrl: formData.logoUrl,
      });

      // Atualizar localStorage com o novo companyId
      if (newCompany?.id) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.companyId = newCompany.id;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }

      // Redirecionar para dashboard após criar empresa
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'
              }`,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 10px 30px rgba(0,0,0,0.35)'
                : '0 10px 30px rgba(15,23,42,0.12)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '50%',
                  bgcolor: 'rgba(79, 156, 249, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BusinessIcon
                  sx={{
                    fontSize: 40,
                    color: '#4F9CF9',
                  }}
                />
              </Box>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
              }}
            >
              Cadastre sua Empresa
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Preencha as informações da sua empresa para começar a usar o
              JASPI HUB
            </Typography>
          </Box>

          {/* Administrator Info */}
          {!loadingUser && user && (
            <Box
              sx={{
                p: 2.5,
                mb: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(79, 156, 249, 0.1)'
                    : 'rgba(79, 156, 249, 0.05)',
                border: (theme) =>
                  `1px solid ${
                    theme.palette.mode === 'dark'
                      ? 'rgba(79, 156, 249, 0.3)'
                      : 'rgba(79, 156, 249, 0.2)'
                  }`,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar
                src={user.avatarUrl}
                alt={user.name}
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: '#4F9CF9',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? '#cbd5e1' : '#334155',
                    mb: 0.5,
                  }}
                >
                  Administrador da Empresa
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                    fontWeight: 600,
                    mb: 0.25,
                  }}
                >
                  {user.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
                  }}
                >
                  {user.email}
                </Typography>
              </Box>
              <Chip
                icon={<ShieldIcon />}
                label="Admin"
                sx={{
                  bgcolor: '#4F9CF9',
                  color: '#ffffff',
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: '#ffffff !important',
                  },
                }}
              />
            </Box>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome da Empresa *"
                  placeholder="Sua Empresa LTDA"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#e2e8f0'
                          : '#1e293b',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#0f172a'
                          : '#ffffff',
                      '& fieldset': {
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#334155'
                            : '#cbd5e1',
                      },
                      '&:hover fieldset': {
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#475569'
                            : '#94a3b8',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4F9CF9',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#94a3b8'
                          : '#64748b',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CNPJ"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={handleInputChange('cnpj')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#e2e8f0'
                          : '#1e293b',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#0f172a'
                          : '#ffffff',
                      '& fieldset': {
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#334155'
                            : '#cbd5e1',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço Comercial"
                  placeholder="Rua, número, cidade, estado"
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  multiline
                  rows={3}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#e2e8f0'
                          : '#1e293b',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#0f172a'
                          : '#ffffff',
                      '& fieldset': {
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#334155'
                            : '#cbd5e1',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL da Logo"
                  placeholder="https://exemplo.com/logo.png"
                  value={formData.logoUrl}
                  onChange={handleInputChange('logoUrl')}
                  error={!!formData.logoUrl && !isValidUrl(formData.logoUrl)}
                  helperText={
                    formData.logoUrl && !isValidUrl(formData.logoUrl)
                      ? 'URL inválida'
                      : ''
                  }
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#e2e8f0'
                          : '#1e293b',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#0f172a'
                          : '#ffffff',
                      '& fieldset': {
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#334155'
                            : '#cbd5e1',
                      },
                    },
                  }}
                />
              </Grid>

              {formData.logoUrl && isValidUrl(formData.logoUrl) && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Preview da Logo
                  </Typography>
                  <Box
                    component="img"
                    src={formData.logoUrl}
                    alt="Preview"
                    sx={{
                      width: '100%',
                      maxHeight: 200,
                      mt: 1,
                      borderRadius: 1,
                      border: (theme) =>
                        `1px solid ${
                          theme.palette.mode === 'dark'
                            ? '#334155'
                            : '#cbd5e1'
                        }`,
                      objectFit: 'contain',
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={
                    loading ||
                    !formData.name ||
                    (formData.logoUrl
                      ? !isValidUrl(formData.logoUrl)
                      : false)
                  }
                  sx={{
                    bgcolor: '#4F9CF9',
                    color: '#ffffff',
                    fontWeight: 600,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: '#357FD7',
                    },
                    '&:disabled': {
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#334155'
                          : '#cbd5e1',
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#94a3b8'
                          : '#94a3b8',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Criar Empresa'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Footer */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 3,
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
            }}
          >
            Os campos marcados com * são obrigatórios
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
