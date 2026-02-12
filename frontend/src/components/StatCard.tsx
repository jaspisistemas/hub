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
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 500, color: '#6E6E73' }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: '1.875rem', fontWeight: 600, color: '#1D1D1F', mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#6E6E73' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon ? (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                backgroundColor: '#F2F2F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          ) : (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                backgroundColor: '#F2F2F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUpIcon sx={{ color: '#4F9CF9' }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
