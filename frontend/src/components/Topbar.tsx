import React from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, IconButton, Tooltip, Badge, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Switch, FormControlLabel, List, ListItem, ListItemText, ListItemAvatar, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  ExpandMore as ExpandMoreIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
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
          >
            <MenuItem onClick={() => {
              setPreferencesOpen(true);
              handleSettingsClose();
            }}>Preferências</MenuItem>
            <MenuItem onClick={handleSettingsClose}>Privacidade</MenuItem>
            <MenuItem onClick={() => {
              setAboutOpen(true);
              handleSettingsClose();
            }}>Sobre</MenuItem>
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
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem onClick={handleLogout}>Sair</MenuItem>
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
      <Dialog open={preferencesOpen} onClose={() => setPreferencesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Preferências</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={isDarkMode} onChange={toggleTheme} />}
              label="Modo Escuro"
            />
            <Divider />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Notificações de novos pedidos"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Notificações por e-mail"
            />
            <FormControlLabel
              control={<Switch />}
              label="Sincronização automática"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreferencesOpen(false)}>Cancelar</Button>
          <Button onClick={() => setPreferencesOpen(false)} variant="contained">Salvar</Button>
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
