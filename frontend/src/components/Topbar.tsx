import React from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

export default function Topbar() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{"email":""}');

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

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e8eef5' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
        <Box></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                {user.email}
              </Typography>
            </Box>
            <ExpandMoreIcon sx={{ fontSize: '1.2rem', color: '#555555' }} />
          </Box>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem onClick={handleLogout}>Sair</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
