import React from 'react';
import { Chip } from '@mui/material';

type StatusBadgeProps = {
  status: string;
  size?: 'small' | 'medium';
};

const statusConfig: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'default', label: string }> = {
  // Pagamento
  pending: { color: 'warning', label: 'Pendente' },
  waiting_payment: { color: 'warning', label: 'Aguardando Pagamento' },
  created: { color: 'warning', label: 'Criado' },
  
  // Pago - Aguardando ações
  paid: { color: 'info', label: 'Pago' },
  approved: { color: 'info', label: 'Aprovado' },
  
  // Preparação
  invoice_pending: { color: 'warning', label: 'Aguardando NF-e' },
  awaiting_invoice: { color: 'warning', label: 'Aguardando NF-e' },
  invoice_issued: { color: 'info', label: 'NF-e Emitida' },
  handling: { color: 'info', label: 'Separando' },
  preparing: { color: 'info', label: 'Preparando' },
  preparing_shipment: { color: 'info', label: 'Preparar Envio' },
  processing: { color: 'info', label: 'Processando' },
  
  // Pronto para envio
  ready_to_ship: { color: 'info', label: 'Etiqueta Pronta' },
  ready_to_print: { color: 'info', label: 'Etiqueta Pronta' },
  label_printed: { color: 'info', label: 'Etiqueta Impressa' },
  
  // Enviado
  picked_up: { color: 'info', label: 'Coletado' },
  shipped: { color: 'info', label: 'Em Trânsito' },
  in_transit: { color: 'info', label: 'Em Trânsito' },
  out_for_delivery: { color: 'info', label: 'Saiu para Entrega' },
  
  // Finalizado
  delivered: { color: 'success', label: 'Entregue' },
  completed: { color: 'success', label: 'Finalizado' },
  
  // Problemas
  cancelled: { color: 'error', label: 'Cancelado' },
  canceled: { color: 'error', label: 'Cancelado' },
  cancelado: { color: 'error', label: 'Cancelado' },
  claim_open: { color: 'error', label: 'Em Reclamação' },
  failed_delivery: { color: 'error', label: 'Falha na Entrega' },
  returned: { color: 'error', label: 'Devolvido' },
  
  // Sistema
  active: { color: 'success', label: 'Ativo' },
  inactive: { color: 'default', label: 'Inativo' },
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
