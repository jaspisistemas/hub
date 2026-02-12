import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  Link,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  GetApp as GetAppIcon,
  Sync as SyncIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Message as MessageIcon,
  Error as ErrorIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';

interface FAQItem {
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

interface HelpSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: FAQItem[];
}

const HelpCenterPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expandedSection, setExpandedSection] = useState<string | false>(false);

  const helpSections: HelpSection[] = [
    {
      title: 'Primeiros Passos',
      icon: <GetAppIcon />,
      color: '#3b82f6',
      items: [
        {
          question: 'Como conectar um marketplace (Mercado Livre, Shopee, etc.)?',
          answer:
            'Acesse a seção "Lojas" no menu lateral. Clique em "Conectar Loja" e selecione o marketplace desejado. Você será redirecionado para fazer login na plataforma e autorizar o acesso. Após a autorização, a loja aparecerá em sua lista de lojas conectadas.',
        },
        {
          question: 'Qual é a melhor forma de começar?',
          answer:
            'Recomendamos seguir esta sequência: 1) Conecte sua primeira loja (Mercado Livre); 2) Sincronize os produtos existentes; 3) Configure suas categorias padrão; 4) Monitore as primeiras sincronizações. Nossa equipe está pronta para ajudar em cada passo.',
        },
      ],
    },
    {
      title: 'Produtos',
      icon: <ShoppingCartIcon />,
      color: '#8b5cf6',
      items: [
        {
          question: 'Posso editar produtos direto pelo hub?',
          answer:
            'Sim! Na aba "Produtos", você pode editar nome, preço, descrição, quantidade e categorias. As alterações são sincronizadas automaticamente com seus marketplaces. Para edições em massa, use a opção "Exportar e importar".',
        },
        {
          question: 'Como funciona a atualização de estoque e preço?',
          answer:
            'Os preços e estoques são sincronizados automaticamente a cada 2 horas ou quando você clica em "Sincronizar Agora". Se você edita pelo hub, a alteração é enviada imediatamente para todos os marketplaces conectados. Mudanças feitas direto nos marketplaces são puxadas na próxima sincronização.',
        },
        {
          question: 'O que fazer quando um produto não sincroniza?',
          answer:
            'Primeiro, verifique se há uma mensagem de erro na lista de produtos. Produtos sem imagens ou com dados inválidos costumam ter problemas. Tente: 1) Adicionar uma imagem; 2) Validar o preço e quantidade; 3) Sincronizar novamente. Se persistir, contate o suporte.',
        },
      ],
    },
    {
      title: 'Pedidos',
      icon: <ShoppingCartIcon />,
      color: '#ec4899',
      items: [
        {
          question: 'Quanto tempo leva a sincronização inicial?',
          answer:
            'A sincronização inicial depende do volume de produtos e pedidos. Geralmente leva entre 5 a 15 minutos. Você pode acompanhar o progresso na página de "Pedidos". Para volumes grandes (>1000 itens), pode levar até 30 minutos.',
        },
        {
          question: 'Como vejo o histórico de sincronização?',
          answer:
            'No dashboard, há um card mostrando a última sincronização e status atual. Na aba "Pedidos", você pode filtrar por data e loja para ver histórico completo. Logs detalhados estão disponíveis solicitando ao suporte.',
        },
        {
          question: 'Os pedidos são sincronizados automaticamente?',
          answer:
            'Sim! Novos pedidos são sincronizados automaticamente a cada 1 hora. Você também pode clicar em "Sincronizar Agora" para atualizar imediatamente. Todos os pedidos (novos, em preparação, enviados) são rastreados em tempo real.',
        },
      ],
    },
    {
      title: 'Atendimento',
      icon: <MessageIcon />,
      color: '#10b981',
      items: [
        {
          question: 'Como funcionam mensagens e pós-venda?',
          answer:
            'A aba "Atendimento" centraliza todas as perguntas, avaliações e mensagens dos seus marketplaces. Você pode responder diretamente pelo hub, e a resposta é automaticamente enviada ao cliente no marketplace. Perguntas não respondidas aparecem destacadas como prioridade.',
        },
        {
          question: 'Posso responder de forma personalizada?',
          answer:
            'Sim! Cada resposta pode ser personalizada. Recomendamos usar templates para perguntas comuns (ex: "Qual o prazo de entrega?"). Você pode responder uma pergunta de cada vez ou em lote, clicando no botão "Responder" em cada mensagem.',
        },
        {
          question: 'As mensagens aparecem em tempo real?',
          answer:
            'As mensagens são sincronizadas a cada 30 minutos automaticamente. Para ver novas mensagens imediatamente, clique em "Sincronizar Agora". Mensagens antigas (até 200 itens) são baixadas para referência.',
        },
      ],
    },
    {
      title: 'Sincronização',
      icon: <SyncIcon />,
      color: '#f59e0b',
      items: [
        {
          question: 'O que fazer em caso de erro de integração?',
          answer:
            'Erros comuns: 1) Token expirado - reconecte a loja; 2) Produto sem dados obrigatórios - complete os campos em vermelho; 3) Limite de API atingido - aguarde 1 hora; 4) Erro de conexão - verifique sua internet. Para erros persistentes, reinicie a sincronização ou contate o suporte.',
        },
        {
          question: 'Como atualizar o token de acesso do marketplace?',
          answer:
            'Na seção "Lojas", clique na loja afetada e selecione "Reconectar" ou "Atualizar Token". Você será levado para o marketplace para re-autorizar. Não é necessário deletar a loja. O novo token será salvo automaticamente.',
        },
        {
          question: 'Há limite de sincronização?',
          answer:
            'Não há limite de quantidade de produtos ou pedidos. No entanto, a API dos marketplaces tem limites de requisições por hora. Se atingir o limite, a sincronização será retomada automaticamente na próxima hora. Recomendamos sincronizar fora dos picos de vendas.',
        },
      ],
    },
    {
      title: 'Segurança & Dados',
      icon: <SecurityIcon />,
      color: '#06b6d4',
      items: [
        {
          question: 'Meus dados estão seguros?',
          answer:
            'Sim! Usamos criptografia SSL/TLS para todas as comunicações. Tokens de marketplace são armazenados criptografados e nunca são compartilhados. Seus dados são backupeados diariamente. Cumprimos LGPD e padrões de segurança da indústria.',
        },
        {
          question: 'Posso deletar meus dados?',
          answer:
            'Sim. Vá em "Configurações" (em desenvolvimento) e selecione "Deletar Conta". Todos os seus dados serão removidos em 30 dias. Você pode exportar seus dados antes de deletar a conta.',
        },
      ],
    },
  ];

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  return (
    <Box 
      sx={{ 
        bgcolor: isDark ? '#0d1117' : '#f9fafb',
        minHeight: '100vh', 
        py: 4 
      }}
    >
      <PageHeader
        title="Central de Ajuda"
        subtitle="Dúvidas frequentes e guias rápidos para usar o hub"
        icon={<HelpIcon />}
      />

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Ações Rápidas */}
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              mb: 3, 
              color: isDark ? '#c9d1d9' : '#1a1a1a',
              fontSize: '1.125rem',
            }}
          >
            Ações Rápidas
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  bgcolor: isDark ? '#161b22' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                  borderRadius: 3,
                  boxShadow: isDark 
                    ? '0 8px 20px rgba(0, 0, 0, 0.45)'
                    : '0 8px 20px rgba(15, 23, 42, 0.12)',
                  '&:hover': { 
                    boxShadow: isDark 
                      ? '0 14px 28px rgba(0, 0, 0, 0.55)'
                      : '0 14px 28px rgba(15, 23, 42, 0.18)',
                    transform: 'translateY(-2px)',
                    borderColor: isDark ? '#58a6ff' : '#3b82f6',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  <StoreIcon sx={{ fontSize: 36, color: '#58a6ff', mb: 1 }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      color: isDark ? '#c9d1d9' : '#1f2937',
                      fontSize: '0.875rem',
                    }}
                  >
                    Conectar Loja
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ 
                      mt: 1, 
                      textTransform: 'none', 
                      fontSize: '0.8125rem',
                      color: isDark ? '#58a6ff' : '#3b82f6',
                    }}
                    onClick={() => window.location.href = '/lojas'}
                  >
                    Ir para Lojas →
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  bgcolor: isDark ? '#161b22' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                  borderRadius: 3,
                  boxShadow: isDark 
                    ? '0 8px 20px rgba(0, 0, 0, 0.45)'
                    : '0 8px 20px rgba(15, 23, 42, 0.12)',
                  '&:hover': { 
                    boxShadow: isDark 
                      ? '0 14px 28px rgba(0, 0, 0, 0.55)'
                      : '0 14px 28px rgba(15, 23, 42, 0.18)',
                    transform: 'translateY(-2px)',
                    borderColor: isDark ? '#f59e0b' : '#f59e0b',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  <SyncIcon sx={{ fontSize: 36, color: '#f59e0b', mb: 1 }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      color: isDark ? '#c9d1d9' : '#1f2937',
                      fontSize: '0.875rem',
                    }}
                  >
                    Sincronizar Agora
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ 
                      mt: 1, 
                      textTransform: 'none', 
                      fontSize: '0.8125rem',
                      color: isDark ? '#f59e0b' : '#f59e0b',
                    }}
                    onClick={() => window.location.href = '/produtos'}
                  >
                    Ir para Produtos →
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  bgcolor: isDark ? '#161b22' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                  borderRadius: 3,
                  boxShadow: isDark 
                    ? '0 8px 20px rgba(0, 0, 0, 0.45)'
                    : '0 8px 20px rgba(15, 23, 42, 0.12)',
                  '&:hover': { 
                    boxShadow: isDark 
                      ? '0 14px 28px rgba(0, 0, 0, 0.55)'
                      : '0 14px 28px rgba(15, 23, 42, 0.18)',
                    transform: 'translateY(-2px)',
                    borderColor: isDark ? '#10b981' : '#10b981',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  <MessageIcon sx={{ fontSize: 36, color: '#10b981', mb: 1 }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      color: isDark ? '#c9d1d9' : '#1f2937',
                      fontSize: '0.875rem',
                    }}
                  >
                    Ver Atendimentos
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ 
                      mt: 1, 
                      textTransform: 'none', 
                      fontSize: '0.8125rem',
                      color: isDark ? '#10b981' : '#10b981',
                    }}
                    onClick={() => window.location.href = '/atendimento'}
                  >
                    Ir para Atendimento →
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  cursor: 'pointer',
                  bgcolor: isDark ? '#161b22' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                  borderRadius: 3,
                  boxShadow: isDark 
                    ? '0 8px 20px rgba(0, 0, 0, 0.45)'
                    : '0 8px 20px rgba(15, 23, 42, 0.12)',
                  '&:hover': { 
                    boxShadow: isDark 
                      ? '0 14px 28px rgba(0, 0, 0, 0.55)'
                      : '0 14px 28px rgba(15, 23, 42, 0.18)',
                    transform: 'translateY(-2px)',
                    borderColor: isDark ? '#ef4444' : '#ef4444',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  <ErrorIcon sx={{ fontSize: 36, color: '#ef4444', mb: 1 }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      color: isDark ? '#c9d1d9' : '#1f2937',
                      fontSize: '0.875rem',
                    }}
                  >
                    Reportar Erro
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ 
                      mt: 1, 
                      textTransform: 'none', 
                      fontSize: '0.8125rem',
                      color: isDark ? '#ef4444' : '#ef4444',
                    }}
                    href="mailto:suporte@hub.com.br"
                  >
                    Enviar Email →
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Seções de FAQ */}
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              mb: 3, 
              color: isDark ? '#c9d1d9' : '#1a1a1a',
              fontSize: '1.125rem',
            }}
          >
            Perguntas Frequentes
          </Typography>

          {helpSections.map((section, sectionIndex) => (
            <Box key={sectionIndex} sx={{ mb: 4 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 2, 
                  px: 2, 
                  py: 1.5, 
                  bgcolor: isDark ? '#161b22' : '#f3f4f6',
                  borderRadius: 3,
                  border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                  boxShadow: isDark ? '0 8px 20px rgba(0, 0, 0, 0.35)' : '0 8px 20px rgba(15, 23, 42, 0.08)',
                }}
              >
                <Box sx={{ color: section.color, display: 'flex' }}>
                  {section.icon}
                </Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600, 
                    color: isDark ? '#c9d1d9' : '#1a1a1a',
                    flex: 1,
                    fontSize: '1rem',
                  }}
                >
                  {section.title}
                </Typography>
                <Chip 
                  label={`${section.items.length} itens`} 
                  size="small" 
                  variant="outlined"
                  sx={{
                    borderColor: isDark ? '#30363d' : '#e5e7eb',
                    color: isDark ? '#8b949e' : '#6b7280',
                    fontSize: '0.75rem',
                  }}
                />
              </Box>

              {section.items.map((item, itemIndex) => (
                <Accordion
                  key={itemIndex}
                  expanded={expandedSection === `${sectionIndex}-${itemIndex}`}
                  onChange={handleAccordionChange(`${sectionIndex}-${itemIndex}`)}
                  sx={{
                    bgcolor: isDark ? '#0d1117' : '#ffffff',
                    border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                    borderRadius: '8px !important',
                    mb: 1,
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    '&.Mui-expanded': {
                      bgcolor: isDark ? '#161b22' : '#ffffff',
                      boxShadow: isDark 
                        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.08)',
                      borderColor: isDark ? '#58a6ff' : '#3b82f6',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ExpandMoreIcon 
                        sx={{ color: isDark ? '#8b949e' : '#6b7280' }} 
                      />
                    }
                    sx={{
                      minHeight: '48px !important',
                      '&:hover': { 
                        bgcolor: isDark ? 'rgba(88, 166, 255, 0.06)' : '#f9fafb',
                      },
                      py: 1,
                      px: 2,
                      '& .MuiAccordionSummary-content': { 
                        my: '10px !important',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        color: isDark ? '#c9d1d9' : '#1f2937',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.question}
                    </Typography>
                  </AccordionSummary>
                  <Divider sx={{ borderColor: isDark ? '#21262d' : '#e5e7eb' }} />
                  <AccordionDetails 
                    sx={{ 
                      bgcolor: isDark ? '#0d1117' : '#fafbfc',
                      pt: 2,
                      pb: 2,
                      px: 2,
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isDark ? '#8b949e' : '#4b5563',
                        lineHeight: 1.7,
                        fontSize: '0.875rem',
                      }}
                    >
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}
        </Box>

        {/* Rodapé de Suporte */}
        <Divider 
          sx={{ 
            my: 5,
            borderColor: isDark ? '#21262d' : '#e5e7eb',
          }} 
        />

        <Card 
          sx={{ 
            bgcolor: isDark ? '#0d1521' : '#f0f9ff',
            borderLeft: `4px solid #0ea5e9`,
            border: `1px solid ${isDark ? '#1f6feb' : '#e5e7eb'}`,
            borderRadius: 3,
            boxShadow: isDark 
              ? '0 10px 28px rgba(0, 0, 0, 0.45)'
              : '0 10px 28px rgba(15, 23, 42, 0.12)',
          }}
        >
          <CardContent sx={{ py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <EmailIcon 
                    sx={{ 
                      color: '#58a6ff',
                      mt: 0.5, 
                      flexShrink: 0 
                    }} 
                  />
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDark ? '#c9d1d9' : '#1a1a1a',
                        mb: 0.5,
                        fontSize: '0.875rem',
                      }}
                    >
                      Canal de Suporte
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isDark ? '#8b949e' : '#4b5563',
                        fontSize: '0.8125rem',
                      }}
                    >
                      Dúvidas ou problemas? Entre em contato conosco:
                    </Typography>
                    <Link
                      href="mailto:suporte@hub.com.br"
                      sx={{
                        display: 'inline-block',
                        mt: 0.5,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#58a6ff',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      suporte@hub.com.br
                    </Link>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <ScheduleIcon 
                    sx={{ 
                      color: '#58a6ff',
                      mt: 0.5, 
                      flexShrink: 0 
                    }} 
                  />
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        color: isDark ? '#c9d1d9' : '#1a1a1a',
                        mb: 0.5,
                        fontSize: '0.875rem',
                      }}
                    >
                      Horário de Atendimento
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isDark ? '#8b949e' : '#4b5563',
                        fontSize: '0.8125rem',
                      }}
                    >
                      Segunda a sexta, 9h às 18h (Horário de Brasília)
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isDark ? '#6e7681' : '#9ca3af',
                        display: 'block', 
                        mt: 0.5,
                        fontSize: '0.75rem',
                      }}
                    >
                      Feriados: Atendimento por email
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, textAlign: 'center', pb: 2 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: isDark ? '#6e7681' : '#9ca3af',
              fontSize: '0.75rem',
            }}
          >
            Última atualização: 10 de fevereiro de 2026 | v1.0
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default HelpCenterPage;
