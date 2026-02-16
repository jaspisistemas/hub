import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Tooltip, Typography, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory2 as InventoryIcon,
  BarChart as BarChartIcon,
  Hub as HubIcon,
  SupportAgent as SupportAgentIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { label: 'Pedidos', path: '/pedidos', icon: ShoppingCartIcon },
    { label: 'Produtos', path: '/produtos', icon: InventoryIcon },
    { label: 'Atendimentos', path: '/atendimento', icon: SupportAgentIcon },
    { label: 'Integrações', path: '/integracoes', icon: HubIcon },
  ];

  const secondaryItems = [
    { label: 'Configurações', path: '/configuracoes', icon: SettingsIcon },
    { label: 'Ajuda', path: '/ajuda', icon: HelpOutlineIcon },
  ];


  return (
    <Box
      sx={{
        width: isCollapsed ? 80 : 256,
        background: 'linear-gradient(180deg, #4F9CF9 0%, #357FD7 100%)',
        minHeight: '100%',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        transition: 'all 0.2s ease',
        overflow: 'auto',
        borderRight: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: isCollapsed ? 'column' : 'row',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? 1 : 1.5,
          p: isCollapsed ? 2 : 3,
        }}
      >
        <Tooltip title={isCollapsed ? 'Expandir' : 'Colapsar'}>
          <Box
            onClick={() => setIsCollapsed(!isCollapsed)}
            sx={{
              width: isCollapsed ? 32 : 36,
              height: isCollapsed ? 32 : 36,
              bgcolor: 'rgba(255,255,255,0.25)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.35)',
              },
            }}
          >
            <DashboardIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
        </Tooltip>
        {!isCollapsed && (
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            JASPI Hub
          </Typography>
        )}
      </Box>

      <List sx={{ flex: 1, px: 1.5, pb: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.path} title={isCollapsed ? item.label : ''} placement="right">
            <ListItem
              button
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                position: 'relative',
                bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                transition: 'all 0.2s ease',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                px: isCollapsed ? 1 : 2,
                py: 1.25,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 24,
                  borderRadius: 2,
                  backgroundColor: location.pathname === item.path ? '#ffffff' : 'transparent',
                },
                '&:hover': {
                  bgcolor: location.pathname === item.path
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: '#ffffff',
                  minWidth: isCollapsed ? 'auto' : 44,
                  mr: isCollapsed ? 0 : 1.5,
                  '& svg': {
                    fontSize: '1.25rem',
                  },
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
                      fontSize: '0.95rem',
                    },
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 2, mb: 1.5 }} />

      <List sx={{ px: 1.5, pb: 2 }}>
        {secondaryItems.map((item) => (
          <Tooltip key={item.path} title={isCollapsed ? item.label : ''} placement="right">
            <ListItem
              button
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                position: 'relative',
                bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                transition: 'all 0.2s ease',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                px: isCollapsed ? 1 : 2,
                py: 1.25,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 24,
                  borderRadius: 2,
                  backgroundColor: location.pathname === item.path ? '#ffffff' : 'transparent',
                },
                '&:hover': {
                  bgcolor: location.pathname === item.path
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: '#ffffff',
                  minWidth: isCollapsed ? 'auto' : 44,
                  mr: isCollapsed ? 0 : 1.5,
                  '& svg': {
                    fontSize: '1.25rem',
                  },
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
                      fontSize: '0.95rem',
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
