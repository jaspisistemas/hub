import React from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, IconButton, Tooltip, Badge, Divider, List, ListItem, ListItemText, ListItemAvatar, Paper, ListItemIcon, Button, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  BugReportOutlined as BugReportOutlinedIcon,
} from '@mui/icons-material';

export default function Topbar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = React.useState<null | HTMLElement>(null);
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

  const handleSimulateSessionExpired = () => {
    handleClose();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login?reason=expired');
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  return (
    <AppBar 
      position="static" 
      color="default" 
      elevation={0} 
      sx={{ 
        bgcolor: theme.palette.background.paper,
        borderBottom: theme.palette.mode === 'dark'
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: 'none',
        borderRadius: 0,
        '& .MuiIconButton-root': {
          width: 40,
          height: 40,
          borderRadius: 2,
          color: theme.palette.text.secondary,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.08)'
              : '#F2F2F7',
          },
        },
        '& .MuiBadge-badge': {
          minWidth: 8,
          height: 8,
          padding: 0,
          backgroundColor: '#FF3B30',
        },
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: 4, py: 2 }}>
        <Box></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              onClick={() => {
                handleClose();
                navigate('/perfil');
              }}
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

            {import.meta.env.MODE === 'development' && (
              <MenuItem
                onClick={handleSimulateSessionExpired}
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
                  <BugReportOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </ListItemIcon>
                <Typography variant="body2">Simular sessao expirada</Typography>
              </MenuItem>
            )}

            {import.meta.env.MODE === 'development' && <Divider sx={{ my: 0.5 }} />}
            
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

    </AppBar>
  );
}
