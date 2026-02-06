import React, { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
