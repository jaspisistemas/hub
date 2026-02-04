import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Avatar,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  status: 'nao-respondido' | 'respondido' | 'resolvido';
  origem: 'mercado-livre' | 'shopee';
  loja: string;
  pedido?: string;
  cliente: string;
  clienteEmail?: string;
  mensagens: Message[];
  criadoEm: string;
  atualizadoEm: string;
}

interface Message {
  id: string;
  autor: string;
  conteudo: string;
  timestamp: string;
  tipo: 'cliente' | 'vendedor';
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'ML-12345',
      titulo: 'Qual é o prazo de entrega?',
      descricao: 'Gostaria de saber qual é o prazo de entrega para Brasília',
      status: 'nao-respondido',
      origem: 'mercado-livre',
      loja: 'Loja XYZ',
      pedido: 'PED-001',
      cliente: 'João Silva',
      clienteEmail: 'joao@example.com',
      mensagens: [
        {
          id: '1',
          autor: 'João Silva',
          conteudo: 'Qual é o prazo de entrega para Brasília?',
          timestamp: '2026-02-04 10:30',
          tipo: 'cliente',
        },
      ],
      criadoEm: '2026-02-04',
      atualizadoEm: '2026-02-04',
    },
    {
      id: 'SP-54321',
      titulo: 'Ainda tem em estoque?',
      descricao: 'O produto ainda está disponível?',
      status: 'respondido',
      origem: 'shopee',
      loja: 'Loja ABC',
      pedido: 'PED-002',
      cliente: 'Maria Santos',
      clienteEmail: 'maria@example.com',
      mensagens: [
        {
          id: '1',
          autor: 'Maria Santos',
          conteudo: 'O produto ainda está disponível?',
          timestamp: '2026-02-04 14:20',
          tipo: 'cliente',
        },
        {
          id: '2',
          autor: 'Vendedor',
          conteudo: 'Sim, ainda temos em estoque!',
          timestamp: '2026-02-04 14:35',
          tipo: 'vendedor',
        },
      ],
      criadoEm: '2026-02-04',
      atualizadoEm: '2026-02-04',
    },
  ]);
  const [openNewTicket, setOpenNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [openChat, setOpenChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nao-respondido':
        return '#EF4444';
      case 'respondido':
        return '#F59E0B';
      case 'resolvido':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'nao-respondido': 'Não Respondido',
      'respondido': 'Respondido',
      'resolvido': 'Resolvido',
    };
    return labels[status] || status;
  };

  const getOrigemLabel = (origem: string) => {
    return origem === 'mercado-livre' ? 'Mercado Livre' : 'Shopee';
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedTicket) {
      const updatedTicket = { ...selectedTicket };
      updatedTicket.mensagens.push({
        id: String(selectedTicket.mensagens.length + 1),
        autor: 'Vendedor',
        conteudo: newMessage,
        timestamp: new Date().toLocaleString('pt-BR'),
        tipo: 'vendedor',
      });
      updatedTicket.atualizadoEm = new Date().toISOString().split('T')[0];
      updatedTicket.status = 'respondido';

      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setNewMessage('');
      
      // Aqui seria feita a chamada para API do marketplace para sincronizar a resposta
      console.log('Enviando resposta para:', selectedTicket.origem);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Atendimento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Perguntas dos clientes do Mercado Livre e Shopee
          </Typography>
        </Box>
      </Box>

      {/* Tabela de Tickets */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Pergunta</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Loja</TableCell>
              <TableCell>Marketplace</TableCell>
              <TableCell>Pedido</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                hover
                onClick={() => {
                  setSelectedTicket(ticket);
                  setOpenChat(true);
                }}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell sx={{ fontWeight: 600 }}>{ticket.id}</TableCell>
                <TableCell>{ticket.titulo}</TableCell>
                <TableCell>{ticket.cliente}</TableCell>
                <TableCell>{ticket.loja}</TableCell>
                <TableCell>
                  <Chip
                    label={getOrigemLabel(ticket.origem)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{ticket.pedido || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(ticket.status)}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(ticket.status),
                      color: '#fff',
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell>{ticket.criadoEm}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Responder">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(ticket);
                        setOpenChat(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog: Chat */}
      <Dialog open={openChat} onClose={() => setOpenChat(false)} maxWidth="md" fullWidth>
        {selectedTicket && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{selectedTicket.titulo}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={getStatusLabel(selectedTicket.status)}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(selectedTicket.status),
                      color: '#fff',
                    }}
                  />
                  <Chip 
                    label={getOrigemLabel(selectedTicket.origem)} 
                    size="small" 
                    variant="outlined" 
                  />
                  {selectedTicket.pedido && <Chip label={selectedTicket.pedido} size="small" variant="outlined" />}
                </Box>
              </Box>
              <IconButton onClick={() => setOpenChat(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
              {/* Informações do cliente */}
              <Card sx={{ mb: 2, p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cliente
                </Typography>
                <Typography variant="body1" fontWeight={600}>{selectedTicket.cliente}</Typography>
                {selectedTicket.clienteEmail && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedTicket.clienteEmail}
                  </Typography>
                )}
              </Card>

              {/* Mensagens */}
              <Box sx={{ flex: 1, overflow: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {selectedTicket.mensagens.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography>Nenhuma mensagem ainda</Typography>
                  </Box>
                ) : (
                  selectedTicket.mensagens.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.tipo === 'cliente' ? 'flex-start' : 'flex-end',
                        mb: 1,
                      }}
                    >
                      <Paper
                        sx={{
                          maxWidth: '70%',
                          p: 1.5,
                          bgcolor: msg.tipo === 'cliente' ? 'action.hover' : 'primary.main',
                          color: msg.tipo === 'cliente' ? 'text.primary' : '#fff',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                          {msg.autor}
                        </Typography>
                        <Typography variant="body2">{msg.conteudo}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                          {msg.timestamp}
                        </Typography>
                      </Paper>
                    </Box>
                  ))
                )}
              </Box>

              {/* Input de mensagem */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Escreva sua resposta..."
                  size="small"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  multiline
                  maxRows={3}
                />
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  sx={{ borderRadius: 2 }}
                >
                  Enviar
                </Button>
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenChat(false)}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
