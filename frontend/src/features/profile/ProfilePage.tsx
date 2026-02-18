import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { profileService } from '../../services/profileService';
import { companyService } from '../../services/companyService';
import { apiFetch } from '../../services/api';
import collaboratorsService from '../../services/collaboratorsService';
import PageHeader from '../../components/PageHeader';
import { useThemeMode } from '../../contexts/ThemeContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 1 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: string;
  theme?: string;
  language?: string;
  currency?: string;
  defaultDashboardPeriod?: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  loginHistory?: Array<{ date: string; ip: string }>;
}

export default function ProfilePage() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);

  // Colaboradores states
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);

  // Company modal states
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    cnpj: '',
    address: '',
    logoUrl: '',
  });
  const [companySaving, setCompanySaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    // Carregar membros quando aba de colaboradores é aberta
    if (tabValue === 3 && company?.id) {
      loadMembers();
    }
  }, [tabValue, company?.id]);

  const loadMembers = async () => {
    try {
      if (!company?.id) return;
      const data = await collaboratorsService.getMembers(company.id);
      setMembers(data);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar colaboradores');
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      
      // Carregar empresa do usuário
      try {
        const companyData = await apiFetch('/companies/my-company', { method: 'GET' });
        setCompany(companyData);
        setCompanyFormData({
          companyName: companyData.name || '',
          cnpj: companyData.cnpj || '',
          address: companyData.address || '',
          logoUrl: companyData.logoUrl || '',
        });
      } catch (err) {
        console.error('Erro ao carregar empresa:', err);
      }
      
      setFormData({
        name: data.name,
        phone: data.phone || '',
        role: data.role || '',
        avatarUrl: data.avatarUrl || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await profileService.updateProfile(formData);
      setSuccess('Perfil atualizado com sucesso!');
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!inviteEmail || !company?.id) {
      setError('Email obrigatório e empresa deve estar carregada');
      return;
    }

    try {
      setInviteSending(true);
      await collaboratorsService.inviteMember(company.id, {
        email: inviteEmail,
        role: inviteRole as any,
      });
      setSuccess('Convite enviado com sucesso!');
      setInviteEmail('');
      setInviteRole('member');
      setInviteDialogOpen(false);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar convite');
    } finally {
      setInviteSending(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    try {
      setSaving(true);
      await profileService.changePassword(passwordData);
      setSuccess('Senha alterada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setChangePasswordDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  // Validar URL
  const isValidUrl = (url: string) => {
    if (!url) return true; // Campo opcional
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validar telefone (formato brasileiro)
  const isValidPhone = (phone: string) => {
    if (!phone) return true; // Campo opcional
    const phoneRegex = /^(\(\d{2}\)\s)?9?\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  // Handler para empresa
  const handleCompanyInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const value = event.target.value;
    setCompanyFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveCompany = async () => {
    if (!companyFormData.companyName) {
      setError('Nome da empresa é obrigatório');
      return;
    }

    if (companyFormData.logoUrl && !isValidUrl(companyFormData.logoUrl)) {
      setError('URL da logo inválida');
      return;
    }

    try {
      setCompanySaving(true);
      
      if (company?.id) {
        // Atualizar empresa existente
        await companyService.updateCompany(company.id, {
          name: companyFormData.companyName,
          cnpj: companyFormData.cnpj,
          address: companyFormData.address,
          logoUrl: companyFormData.logoUrl,
        });
      } else {
        // Criar nova empresa
        const newCompany = await companyService.createCompany({
          name: companyFormData.companyName,
          cnpj: companyFormData.cnpj,
          address: companyFormData.address,
          logoUrl: companyFormData.logoUrl,
        });
        
        if (newCompany?.id) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.companyId = newCompany.id;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      }
      
      setSuccess('Dados da empresa atualizados com sucesso!');
      setCompanyModalOpen(false);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados da empresa');
    } finally {
      setCompanySaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
      minHeight: '100vh',
      py: 4,
    }}>
      <Container maxWidth="lg">
        <PageHeader
          title="Meu Perfil"
          subtitle="Gerencie suas informações, segurança e preferências"
          icon={SettingsIcon}
        />

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess('')}
            message={success}
          />
        )}

        <Box sx={{
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          borderRadius: 3,
          border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 10px 30px rgba(0,0,0,0.35)' : '0 10px 30px rgba(15,23,42,0.12)',
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="profile tabs"
            sx={{
              borderBottom: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
              '& .MuiTab-root': {
                color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
                '&.Mui-selected': {
                  color: (theme) => theme.palette.mode === 'dark' ? '#42A5F5' : '#3b82f6',
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#42A5F5' : '#3b82f6',
              },
            }}
          >
            <Tab label="Informações da Conta" id="profile-tab-0" />
            <Tab label="Segurança" id="profile-tab-1" />
            <Tab label="Preferências" id="profile-tab-2" />
            <Tab label="Colaboradores" id="profile-tab-3" />
          </Tabs>

          {/* Tab: Informações da Conta */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Avatar Section */}
              <Box sx={{
                p: { xs: 3, sm: 4 },
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                borderRadius: 3,
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                textAlign: 'center',
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.10)',
              }}>
                <Avatar
                  src={formData.avatarUrl}
                  alt={formData.name}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: (theme) => theme.palette.mode === 'dark' ? '3px solid #334155' : '3px solid #e2e8f0',
                  }}
                />
                <Button
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  variant="outlined"
                  sx={{
                    color: (theme) => theme.palette.mode === 'dark' ? '#42A5F5' : '#3b82f6',
                    borderColor: (theme) => theme.palette.mode === 'dark' ? '#42A5F5' : '#3b82f6',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(66,165,245,0.08)' : 'rgba(59,130,246,0.05)',
                    },
                  }}
                >
                  Alterar Avatar
                  <input type="file" hidden accept="image/*" />
                </Button>
              </Box>

              {/* Form Fields */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome Completo"
                    value={formData.name || ''}
                    onChange={handleInputChange('name')}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                        '& fieldset': {
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#cbd5e1',
                        },
                        '&:hover fieldset': {
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#475569' : '#94a3b8',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#42A5F5' : '#3b82f6',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profile?.email || ''}
                    disabled
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#64748b' : '#94a3b8',
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f1f5f9',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    value={formData.phone || ''}
                    onChange={handleInputChange('phone')}
                    placeholder="(00) 00000-0000"
                    error={!!formData.phone && !isValidPhone(formData.phone)}
                    helperText={formData.phone && !isValidPhone(formData.phone) ? 'Formato inválido. Use: (00) 00000-0000' : ''}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                        '& fieldset': {
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#cbd5e1',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cargo/Tipo de Conta"
                    value={formData.role || ''}
                    onChange={handleInputChange('role')}
                    placeholder="Ex: Admin, Vendedor, Estoque"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                        '& fieldset': {
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#cbd5e1',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* Company Section Button */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => setCompanyModalOpen(true)}
                  sx={{
                    color: (theme) => theme.palette.mode === 'dark' ? '#42A5F5' : '#3b82f6',
                    borderColor: (theme) => theme.palette.mode === 'dark' ? '#42A5F5' : '#3b82f6',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Editar Dados da Empresa
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving || (formData.phone ? !isValidPhone(formData.phone) : false) || (formData.avatarUrl ? !isValidUrl(formData.avatarUrl) : false)}
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' },
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.2,
                    px: 3,
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab: Segurança */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Última entrada e IP */}
              {profile?.lastLoginAt && (
                <Box sx={{
                  p: 3,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                  borderRadius: 3,
                  border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.10)',
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b' }}>
                    Último Acesso
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                        Data e Hora
                      </Typography>
                      <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#334155' }}>
                        {new Date(profile.lastLoginAt).toLocaleString('pt-BR')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                        Endereço IP
                      </Typography>
                      <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#334155', fontFamily: 'monospace' }}>
                        {profile.lastLoginIp || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Alterar Senha */}
              <Box sx={{
                p: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                borderRadius: 3,
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.10)',
              }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b' }}>
                  <LockIcon fontSize="small" sx={{ color: '#f59e0b' }} />
                  Alterar Senha
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setChangePasswordDialog(true)}
                  sx={{
                    bgcolor: '#f59e0b',
                    '&:hover': { bgcolor: '#d97706' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Alterar Senha
                </Button>
              </Box>

              {/* Histórico de Login */}
              {profile?.loginHistory && profile.loginHistory.length > 0 && (
                <Box sx={{
                  p: 3,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                  borderRadius: 3,
                  border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.10)',
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b' }}>
                    Histórico de Login (Últimos 10)
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                          <TableCell sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569' }}>Data e Hora</TableCell>
                          <TableCell sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569' }}>Endereço IP</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {profile.loginHistory.slice(-10).reverse().map((login, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                              '&:hover': {
                                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                              },
                            }}
                          >
                            <TableCell sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#334155' }}>
                              {new Date(login.date).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#334155', fontFamily: 'monospace' }}>
                              {login.ip}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Tab: Preferências */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box sx={{
                p: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                borderRadius: 3,
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.10)',
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b' }}>
                  Aparência
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                      Modo Escuro
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isDarkMode ? 'Tema escuro ativado' : 'Tema claro ativado'}
                    </Typography>
                  </Box>
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4F9CF9',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4F9CF9',
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{
                p: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                borderRadius: 3,
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.10)',
              }}>
                <Typography variant="h6" sx={{ mb: 1.5, color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b' }}>
                  Privacidade
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Controlamos a visibilidade dos seus dados e seguimos as melhores práticas de segurança para proteger suas informações.
                </Typography>
              </Box>

              <Box sx={{
                p: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                borderRadius: 3,
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.10)',
                textAlign: 'center',
              }}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  gutterBottom
                  sx={{
                    background: 'linear-gradient(135deg, #4F9CF9 0%, #357FD7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  JASPI HUB
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Sistema para gerenciamento de marketplaces
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Versão 1.0.0
                </Typography>
                <Divider sx={{ my: 3 }} />
                <Typography variant="body2" color="text.secondary" paragraph>
                  Desenvolvido por <strong>JASPI Sistemas</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  © 2026 Todos os direitos reservados
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  contato@jaspi.com.br | www.jaspi.com.br
                </Typography>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab: Colaboradores */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Members Table */}
              <TableContainer
                component={Paper}
                sx={{
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                  border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: 2,
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.10)',
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                        borderBottom: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>Nome/Email</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Função</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members && members.length > 0 ? (
                      members.map((member) => (
                        <TableRow
                          key={member.id}
                          sx={{
                            borderBottom: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                            '&:hover': {
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(79,156,249,0.05)' : 'rgba(79,156,249,0.03)',
                            },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {member.user?.name || member.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {member.user?.email || member.email}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {member.role}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="caption"
                              sx={{
                                bgcolor: member.acceptedAt ? '#d1fae5' : '#fef3c7',
                                color: member.acceptedAt ? '#065f46' : '#78350f',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                display: 'inline-block',
                                fontWeight: 500,
                              }}
                            >
                              {member.acceptedAt ? 'Ativo' : 'Convite Pendente'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              sx={{
                                color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
                              }}
                              disabled
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              sx={{
                                color: '#ef4444',
                                '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' },
                              }}
                              disabled
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Nenhum colaborador adicionado ainda
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Invite Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setInviteDialogOpen(true)}
                  sx={{
                    bgcolor: '#4F9CF9',
                    '&:hover': { bgcolor: '#357FD7' },
                  }}
                >
                  Convidar Colaborador
                </Button>
              </Box>
            </Box>
          </TabPanel>
        </Box>
      </Container>

      {/* Dialog: Convidar Colaborador */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            borderRadius: 3,
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 16px 40px rgba(0,0,0,0.45)' : '0 16px 40px rgba(15,23,42,0.16)',
          },
        }}
      >
        <DialogTitle sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b' }}>
          Convidar Colaborador
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            autoFocus
            label="Email do Colaborador"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                '& fieldset': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#cbd5e1',
                },
              },
            }}
          />
          <FormControl fullWidth>
            <InputLabel
              sx={{
                color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
                '&.Mui-focused': {
                  color: '#4F9CF9',
                },
              }}
            >
              Função
            </InputLabel>
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              label="Função"
              sx={{
                color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#cbd5e1',
                },
              }}
            >
              <MenuItem value="member">Membro</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setInviteDialogOpen(false)}
            variant="outlined"
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#cbd5e1',
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.05)',
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleInviteCollaborator}
            variant="contained"
            disabled={inviteSending || !inviteEmail}
            sx={{
              bgcolor: '#4F9CF9',
              '&:hover': { bgcolor: '#357FD7' },
            }}
          >
            {inviteSending ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Alterar Senha */}
      <Dialog
        open={changePasswordDialog}
        onClose={() => setChangePasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            borderRadius: 3,
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 16px 40px rgba(0,0,0,0.45)' : '0 16px 40px rgba(15,23,42,0.16)',
          },
        }}
      >
        <DialogTitle sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b' }}>
          Alterar Senha
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Senha Atual"
            type={showCurrentPassword ? 'text' : 'password'}
            value={passwordData.currentPassword}
            onChange={handlePasswordChange('currentPassword')}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
              },
            }}
          />
          <TextField
            fullWidth
            label="Nova Senha"
            type={showNewPassword ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={handlePasswordChange('newPassword')}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
              },
            }}
          />
          <TextField
            fullWidth
            label="Confirmar Nova Senha"
            type={showConfirmPassword ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange('confirmPassword')}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setChangePasswordDialog(false)}
            variant="outlined"
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#334155' : '#cbd5e1',
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.05)',
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={saving}
            sx={{
              bgcolor: '#f59e0b',
              '&:hover': { bgcolor: '#d97706' },
            }}
          >
            {saving ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Modal */}
      <Dialog
        open={companyModalOpen}
        onClose={() => !companySaving && setCompanyModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Dados da Empresa
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Atualize as informacoes principais para manter seu cadastro correto.
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            '& .MuiInputLabel-root': {
              lineHeight: 1.1,
            },
            '& .MuiInputLabel-shrink': {
              transform: 'translate(14px, -6px) scale(0.75)',
            },
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Nome da Empresa"
                value={companyFormData.companyName}
                onChange={handleCompanyInputChange('companyName')}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="CNPJ"
                value={companyFormData.cnpj}
                onChange={handleCompanyInputChange('cnpj')}
                placeholder="00.000.000/0000-00"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereco Comercial"
                value={companyFormData.address}
                onChange={handleCompanyInputChange('address')}
                multiline
                rows={3}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL da Logo"
                value={companyFormData.logoUrl}
                onChange={handleCompanyInputChange('logoUrl')}
                error={!!companyFormData.logoUrl && !isValidUrl(companyFormData.logoUrl)}
                helperText={companyFormData.logoUrl && !isValidUrl(companyFormData.logoUrl) ? 'URL invalida. Use: https://exemplo.com/logo.png' : ''}
                placeholder="https://exemplo.com/logo.png"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {companyFormData.logoUrl && isValidUrl(companyFormData.logoUrl) && (
              <Grid item xs={12}>
                <Box
                  component="img"
                  src={companyFormData.logoUrl}
                  alt="Preview Logo"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 160,
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setCompanyModalOpen(false)}
            disabled={companySaving}
            variant="text"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveCompany}
            variant="contained"
            disabled={companySaving || !companyFormData.companyName || (companyFormData.logoUrl ? !isValidUrl(companyFormData.logoUrl) : false)}
          >
            {companySaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
