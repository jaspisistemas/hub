import React from 'react';
import { Box } from '@mui/material';
import { Hub as HubIcon } from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

export default function IntegrationsPage() {
  return (
    <Box>
      <PageHeader
        title="Integrações"
        subtitle="Conecte marketplaces e serviços externos."
      />
      <EmptyState
        icon={<HubIcon />}
        title="Nenhuma integração configurada"
        description="Quando houver integrações ativas, elas aparecerão aqui."
      />
    </Box>
  );
}
