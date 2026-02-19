import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Tooltip, Typography, Divider, useTheme } from '@mui/material';
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
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
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #111827 0%, #0b1220 100%)'
          : 'linear-gradient(180deg, #4F9CF9 0%, #357FD7 100%)',
        minHeight: '100%',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'auto',
        borderRight: theme.palette.mode === 'dark'
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(255,255,255,0.15)',
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
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(255,255,255,0.25)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(255,255,255,0.35)',
                transform: 'scale(1.1)',
              },
              '& svg': {
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              },
            }}
          >
            {isCollapsed ? (
              <ChevronRightIcon sx={{ fontSize: 20, color: '#fff', animation: 'slideInRight 0.3s ease-out' }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 20, color: '#fff', animation: 'slideInLeft 0.3s ease-out' }} />
            )}
          </Box>
        </Tooltip>
        <style>{`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(-8px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(8px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
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
                bgcolor: location.pathname === item.path
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(79,156,249,0.18)'
                    : 'rgba(255,255,255,0.2)'
                  : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  backgroundColor: location.pathname === item.path
                    ? theme.palette.mode === 'dark'
                      ? '#4F9CF9'
                      : '#ffffff'
                    : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '&:hover': {
                  bgcolor: location.pathname === item.path
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(79,156,249,0.28)'
                      : 'rgba(255,255,255,0.3)'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(79,156,249,0.12)'
                      : 'rgba(255,255,255,0.15)',
                  transform: 'translateX(4px)',
                  '&::before': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? '#4F9CF9'
                      : '#ffffff',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 0 12px rgba(79,156,249,0.5)'
                      : '0 0 12px rgba(255,255,255,0.5)',
                  },
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

      <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)', mx: 2, mb: 1.5 }} />

      <List sx={{ px: 1.5, pb: 2 }}>
        <style>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        {secondaryItems.map((item) => (
          <Tooltip key={item.path} title={isCollapsed ? item.label : ''} placement="right">
            <ListItem
              button
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                position: 'relative',
                bgcolor: location.pathname === item.path
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(79,156,249,0.18)'
                    : 'rgba(255,255,255,0.2)'
                  : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  backgroundColor: location.pathname === item.path
                    ? theme.palette.mode === 'dark'
                      ? '#4F9CF9'
                      : '#ffffff'
                    : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '&:hover': {
                  bgcolor: location.pathname === item.path
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(79,156,249,0.28)'
                      : 'rgba(255,255,255,0.3)'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(79,156,249,0.12)'
                      : 'rgba(255,255,255,0.15)',
                  transform: 'translateX(4px)',
                  ...(item.label === 'Configurações' && {
                    '& svg': {
                      animation: 'spin 0.6s ease-in-out',
                    },
                  }),
                  '&::before': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? '#4F9CF9'
                      : '#ffffff',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 0 12px rgba(79,156,249,0.5)'
                      : '0 0 12px rgba(255,255,255,0.5)',
                  },
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
