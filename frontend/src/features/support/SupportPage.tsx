import React from 'react';
import {
  Box,
  Card,
  Divider,
  Typography,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { SupportAgent as SupportIcon } from '@mui/icons-material';

export default function SupportPage() {
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Atendimento"
        subtitle="Gerencie todos os atendimentos dos seus marketplaces"
      />
      
      <Card sx={{ borderRadius: 3, p: 4 }}>
        <EmptyState 
          icon={<SupportIcon sx={{ fontSize: 64 }} />}
          title="Em Desenvolvimento"
          description="A funcionalidade de Atendimento está sendo desenvolvida e estará disponível em breve. Em breve você poderá gerenciar todos os atendimentos dos seus marketplaces em um só lugar."
        />
      </Card>
    </Box>
  );
}
