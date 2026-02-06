import React from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, IconButton, Tooltip, Badge, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Switch, FormControlLabel, List, ListItem, ListItemText, ListItemAvatar, Paper, ListItemIcon } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  ExpandMore as ExpandMoreIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';

export default function Topbar() {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = React.useState<null | HTMLElement>(null);
  const [settingsAnchor, setSettingsAnchor] = React.useState<null | HTMLElement>(null);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [preferencesOpen, setPreferencesOpen] = React.useState(false);
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{"email":""}');
  const [notificationCount] = React.useState(0);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  const handleHelp = () => {
    setHelpOpen(true);
  };

  return (
    <AppBar 
      position="static" 
      color="default" 
      elevation={0} 
      sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
        <Box></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Ajuda">
            <IconButton 
              size="small"
              onClick={handleHelp}
              sx={{ color: 'text.secondary' }}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Configurações">
            <IconButton 
              size="small"
              onClick={handleSettingsOpen}
              sx={{ color: 'text.secondary' }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={settingsAnchor}
            open={Boolean(settingsAnchor)}
            onClose={handleSettingsClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                    : '0 8px 24px rgba(0, 0, 0, 0.12)',
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 20,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }
            }}
          >
            <MenuItem 
              onClick={() => {
                setPreferencesOpen(true);
                handleSettingsClose();
              }}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Preferências
            </MenuItem>
            <MenuItem 
              onClick={handleSettingsClose}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Privacidade
            </MenuItem>
            <MenuItem 
              onClick={() => {
                setAboutOpen(true);
                handleSettingsClose();
              }}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Sobre
            </MenuItem>
          </Menu>

          <Tooltip title="Notificações">
            <IconButton 
              size="small"
              onClick={handleNotificationsOpen}
              sx={{ color: 'text.secondary' }}
            >
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  width: 380,
                  maxHeight: 480,
                  borderRadius: 3,
                  mt: 1,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                }
              }
            }}
          >
            <Box sx={{ 
              px: 3, 
              py: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}>
              <Typography variant="h6" fontWeight={600}>
                Notificações
              </Typography>
            </Box>
            
            <Box sx={{ p: 2 }}>
              {notificationCount === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <NotificationsNoneIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={500} gutterBottom>
                      Tudo certo por aqui!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Você não tem novas notificações
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {/* Exemplo de notificação - substituir com dados reais */}
                  <ListItem 
                    sx={{ 
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                      cursor: 'pointer',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <NotificationsIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Novo pedido recebido"
                      secondary="Há 5 minutos"
                      primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                </List>
              )}
            </Box>

            {notificationCount > 0 && (
              <Box sx={{ 
                px: 3, 
                py: 1.5, 
                borderTop: 1, 
                borderColor: 'divider',
                textAlign: 'center',
              }}>
                <Button 
                  size="small" 
                  onClick={handleNotificationsClose}
                  sx={{ textTransform: 'none' }}
                >
                  Ver todas as notificações
                </Button>
              </Box>
            )}
          </Menu>

          <Box sx={{ width: 1, height: 24, bgcolor: 'divider', mx: 1 }}></Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={handleMenu}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: '#0099FF',
                fontSize: '0.9rem',
              }}
            >
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.email}
              </Typography>
            </Box>
            <ExpandMoreIcon sx={{ fontSize: '1.2rem' }} />
          </Box>
          <Menu 
            anchorEl={anchorEl} 
            open={Boolean(anchorEl)} 
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                    : '0 8px 24px rgba(0, 0, 0, 0.12)',
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 20,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                Conectado como
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.email}
              </Typography>
            </Box>
            
            <MenuItem 
              onClick={handleClose}
              sx={{
                py: 1.5,
                px: 2,
                gap: 1.5,
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </ListItemIcon>
              <Typography variant="body2">Meu Perfil</Typography>
            </MenuItem>
            
            <Divider sx={{ my: 0.5 }} />
            
            <MenuItem 
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                gap: 1.5,
                color: '#ef4444',
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(239, 68, 68, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                <LogoutIcon sx={{ fontSize: 20, color: '#ef4444' }} />
              </ListItemIcon>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Sair</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Dialog de Ajuda */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Central de Ajuda</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>Perguntas Frequentes</Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Como conectar uma loja?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Acesse o menu "Lojas", clique em "Nova Loja" e siga as instruções para conectar sua conta do marketplace.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Como exportar produtos?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Na página de Produtos, selecione os produtos desejados e clique em "Exportar". Escolha o marketplace de destino.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Os pedidos são sincronizados automaticamente?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sim, os pedidos dos marketplaces conectados são sincronizados em tempo real.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            Precisa de mais ajuda? Entre em contato: <strong>suporte@jaspi.com.br</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)} variant="contained">Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Preferências */}
      <Dialog 
        open={preferencesOpen} 
        onClose={() => setPreferencesOpen(false)} 
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
          alignItems: 'center', 
          justifyContent: 'space-between',
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
              <SettingsIcon sx={{ color: '#42A5F5', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Preferências
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Seção: Aparência */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Aparência
              </Typography>
              
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(66, 165, 245, 0.05)'
                    : 'rgba(66, 165, 245, 0.03)',
                  borderColor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(66, 165, 245, 0.2)'
                    : 'rgba(66, 165, 245, 0.3)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                      {isDarkMode ? (
                        <DarkModeIcon sx={{ color: '#42A5F5', fontSize: 20 }} />
                      ) : (
                        <LightModeIcon sx={{ color: '#42A5F5', fontSize: 20 }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                        Modo Escuro
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isDarkMode ? 'Tema escuro ativado' : 'Tema claro ativado'}
                      </Typography>
                    </Box>
                  </Box>
                  <Switch 
                    checked={isDarkMode} 
                    onChange={toggleTheme}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#42A5F5',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#42A5F5',
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Seção: Notificações */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Notificações
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                      Novos pedidos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receba alertas de novos pedidos
                    </Typography>
                  </Box>
                  <Switch defaultChecked />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                      Notificações por e-mail
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enviar resumos diários por e-mail
                    </Typography>
                  </Box>
                  <Switch defaultChecked />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Seção: Sincronização */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sincronização
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                    Sincronização automática
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Atualizar produtos e pedidos automaticamente
                  </Typography>
                </Box>
                <Switch />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button 
            onClick={() => setPreferencesOpen(false)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => setPreferencesOpen(false)} 
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#42A5F5',
              px: 3,
              py: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#1E88E5',
              },
            }}
          >
            Salvar Preferências
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Sobre */}
      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sobre o JASPI HUB</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{
              background: 'linear-gradient(135deg, #0099FF 0%, #0066CC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              JASPI HUB
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sistema para gerenciamento de marketplaces
            </Typography>
            <Typography variant="h6" gutterBottom>Versão 1.0.0</Typography>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutOpen(false)} variant="contained">Fechar</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
