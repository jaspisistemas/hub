import React, { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          fontSize: '64px',
          color: 'text.secondary',
          opacity: 0.5,
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
        {description}
      </Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
