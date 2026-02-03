import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart as ShoppingCartIcon,
  Inventory2 as InventoryIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Pedidos', path: '/pedidos', icon: ShoppingCartIcon },
    { label: 'Produtos', path: '/produtos', icon: InventoryIcon },
    { label: 'Clientes', path: '/clientes', icon: PeopleIcon },
    { label: 'Lojas', path: '/lojas', icon: StoreIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box
      sx={{
        width: 260,
        bgcolor: '#1a3d5c',
        height: '100vh',
        color: 'white',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
      }}
    >
      <Box
        sx={{
          mb: 4,
          fontSize: '1.5rem',
          fontWeight: 700,
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #0099FF 0%, #0066CC 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        onClick={() => navigate('/')}
      >
        JASPI HUB
      </Box>

      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 1,
              mb: 1,
              bgcolor: location.pathname === item.path ? 'rgba(0, 153, 255, 0.15)' : 'transparent',
              borderLeft: location.pathname === item.path ? '3px solid #0099FF' : '3px solid transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(0, 153, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path ? '#0099FF' : '#9db4c8',
                minWidth: 40,
              }}
            >
              <item.icon />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                color: location.pathname === item.path ? '#0099FF' : '#b8c9d9',
                '& .MuiListItemText-primary': {
                  fontWeight: location.pathname === item.path ? 600 : 500,
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

      <Button
        fullWidth
        variant="outlined"
        color="inherit"
        onClick={handleLogout}
        startIcon={<LogoutIcon />}
        sx={{
          borderColor: '#557d96',
          color: '#b8c9d9',
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': {
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
            color: '#ef4444',
          },
        }}
      >
        Sair
      </Button>
    </Box>
  );
}
