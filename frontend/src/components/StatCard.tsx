import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ title, value, subtitle, color = '#3b82f6', icon }: StatCardProps) {
  return (
    <Card
      sx={{
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 20px rgba(0, 153, 255, 0.15)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: `${color}20`,
              }}
            >
              {icon}
            </Box>
          ) : (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: `${color}20`,
              }}
            >
              <TrendingUpIcon sx={{ color }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
