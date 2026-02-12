import React from 'react';
import { Box } from '@mui/material';
import { PeopleAlt as PeopleAltIcon } from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

export default function ClientsPage() {
  return (
    <Box>
      <PageHeader
        title="Clientes"
        subtitle="Gerencie sua base de clientes e acompanhe o relacionamento."
      />
      <EmptyState
        icon={<PeopleAltIcon />}
        title="Nenhum cliente cadastrado"
        description="Quando houver clientes, eles aparecerão aqui."
      />
    </Box>
  );
}
