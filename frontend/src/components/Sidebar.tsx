import React, { useState } from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, Button, IconButton, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory2 as InventoryIcon,
  Store as StoreIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { label: 'Pedidos', path: '/pedidos', icon: ShoppingCartIcon },
    { label: 'Produtos', path: '/produtos', icon: InventoryIcon },
    { label: 'Lojas', path: '/lojas', icon: StoreIcon },
    { label: 'Atendimento', path: '/atendimento', icon: SupportIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box
      sx={{
        width: isCollapsed ? 80 : 260,
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#1a3d5c',
        height: '100vh',
        color: 'white',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: 1,
        borderColor: 'divider',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        {!isCollapsed && (
          <Box
            sx={{
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
        )}
        <Tooltip title={isCollapsed ? 'Expandir' : 'Colapsar'}>
          <IconButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            sx={{
              color: '#0099FF',
              ml: isCollapsed ? 0 : 'auto',
            }}
          >
            {isCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.path} title={isCollapsed ? item.label : ''} placement="right">
            <ListItem
              button
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                mb: 1,
                bgcolor: location.pathname === item.path ? 'rgba(0, 153, 255, 0.15)' : 'transparent',
                borderLeft: location.pathname === item.path ? '3px solid #0099FF' : '3px solid transparent',
                transition: 'all 0.2s ease',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                px: isCollapsed ? 1 : 2,
                '&:hover': {
                  bgcolor: 'rgba(0, 153, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? '#0099FF' : '#9db4c8',
                  minWidth: isCollapsed ? 'auto' : 40,
                  mr: isCollapsed ? 0 : 2,
                }}
              >
                <item.icon />
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={item.label}
                  sx={{
                    color: location.pathname === item.path ? '#0099FF' : '#b8c9d9',
                    '& .MuiListItemText-primary': {
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    },
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

      <Tooltip title={isCollapsed ? 'Sair' : ''} placement="right">
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
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              borderColor: '#ef4444',
              color: '#ef4444',
            },
          }}
        >
          {!isCollapsed && 'Sair'}
        </Button>
      </Tooltip>
    </Box>
  );
}
