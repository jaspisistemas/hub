import React from 'react';
import { Chip } from '@mui/material';

type StatusBadgeProps = {
  status: string;
  size?: 'small' | 'medium';
};

const statusConfig: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'default', label: string }> = {
  pending: { color: 'warning', label: 'Pendente' },
  paid: { color: 'info', label: 'Pago' },
  preparing: { color: 'info', label: 'Preparando' },
  ready_to_ship: { color: 'info', label: 'Pronto' },
  shipped: { color: 'info', label: 'Enviado' },
  delivered: { color: 'success', label: 'Entregue' },
  cancelled: { color: 'error', label: 'Cancelado' },
  active: { color: 'success', label: 'Ativo' },
  inactive: { color: 'default', label: 'Inativo' },
  processing: { color: 'info', label: 'Processando' },
  connected: { color: 'success', label: 'Conectado' },
  disconnected: { color: 'error', label: 'Desconectado' },
};

export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || { color: 'default' as const, label: status };
  
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{
        fontWeight: 600,
        borderRadius: '6px',
        textTransform: 'capitalize',
      }}
    />
  );
}
