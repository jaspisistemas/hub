import React, { useState } from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, IconButton, Tooltip, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory2 as InventoryIcon,
  Store as StoreIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material';

export default function Sidebar() {
  const theme = useTheme();
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

  return (
    <Box
      sx={{
        width: isCollapsed ? 80 : 260,
        bgcolor: theme.palette.mode === 'dark' ? '#010409' : '#42A5F5',
        height: '100vh',
        color: '#ffffff',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark' 
          ? 'none'
          : '2px 0 8px rgba(0,0,0,0.1)',
        borderRight: theme.palette.mode === 'dark' 
          ? '1px solid #30363d'
          : 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          mt: 1,
        }}
      >
        {!isCollapsed && (
          <Box
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#ffffff',
              letterSpacing: '-0.02em',
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
              color: '#ffffff',
              ml: isCollapsed ? 0 : 'auto',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
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
                borderRadius: 2,
                mb: 1,
                bgcolor: location.pathname === item.path 
                  ? (theme) => theme.palette.mode === 'dark' ? 'rgba(88, 166, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)'
                  : 'transparent',
                borderLeft: location.pathname === item.path 
                  ? (theme) => theme.palette.mode === 'dark' ? '3px solid #58a6ff' : '4px solid #ffffff'
                  : '3px solid transparent',
                transition: 'all 0.2s ease',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                px: isCollapsed ? 1 : 2,
                py: 1.5,
                '&:hover': {
                  bgcolor: location.pathname === item.path 
                    ? (theme) => theme.palette.mode === 'dark' ? 'rgba(88, 166, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'
                    : (theme) => theme.palette.mode === 'dark' ? 'rgba(177, 186, 196, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: '#ffffff',
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
                    color: '#ffffff',
                    '& .MuiListItemText-primary': {
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: '0.9375rem',
                    },
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
}
