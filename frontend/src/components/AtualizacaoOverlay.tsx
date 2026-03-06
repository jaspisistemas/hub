import React from 'react';
import { Box, Typography, LinearProgress, useTheme } from '@mui/material';
import { SystemUpdateAlt as SystemUpdateAltIcon } from '@mui/icons-material';

export default function AtualizacaoOverlay() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        gap: 3,
      }}
    >
      <SystemUpdateAltIcon sx={{ fontSize: 80, color: 'primary.main', opacity: 0.8 }} />
      <Typography variant="h5" fontWeight={600}>
        Atualização em andamento
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, textAlign: 'center' }}>
        O sistema está sendo atualizado. Isso pode levar alguns minutos. A página será recarregada automaticamente.
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
        <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
      </Box>
    </Box>
  );
}
