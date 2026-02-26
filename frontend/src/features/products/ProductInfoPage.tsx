import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Stack,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  ErrorOutline,
  Dashboard,
  Inventory,
  BarChart,
  Description,
  Speed,
  AttachMoney,
  Store,
  Message,
  LinkedIn,
  Twitter,
  Facebook,
  PlayArrow,
} from '@mui/icons-material';

interface HeroSection {
  title: string;
  subtitle: string;
  cta: string;
  imageUrl?: string;
}

interface Problem {
  icon?: string;
  description: string;
}

interface Solution {
  icon?: string;
  title: string;
  description: string;
}

interface Benefit {
  icon?: string;
  title: string;
  description: string;
}

interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  icon?: string;
}

interface SocialProof {
  metric: string;
  value: string | number;
}

interface CTA {
  title: string;
  subtitle: string;
  buttonText: string;
}

interface InfoPageData {
  hero: HeroSection;
  problems: Problem[];
  solutions: Solution[];
  benefits: Benefit[];
  targetAudience: string;
  howItWorks: HowItWorksStep[];
  socialProof: SocialProof[];
  cta: CTA;
}

export default function ProductInfoPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<InfoPageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfoPage = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3000/products/info-page');
        if (!response.ok) throw new Error('Erro ao carregar dados');
        const result = await response.json();
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        console.error('Erro ao buscar info-page:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfoPage();
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">Erro ao carregar a página: {error || 'Dados não encontrados'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden', bgcolor: '#FAFBFC' }}>
      {/* HERO SECTION */}
      <Box sx={{ bgcolor: 'white', pt: 4, pb: 8 }}>
        <Container maxWidth="lg">
          {/* Header/Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 6 }}>
            <img 
              src="/jaspi-logo.png" 
              alt="JASPI SISTEMAS" 
              style={{ height: '36px' }}
            />
          </Box>

          {/* Hero Content */}
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  lineHeight: 1.2,
                  color: '#1A202C',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                }}
              >
                Centralize e automatize seus marketplaces em um único painel.
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  lineHeight: 1.6,
                  color: '#718096',
                  fontWeight: 400,
                }}
              >
                Gerencie pedidos, integrações e atendimentos com visão completa da sua receita em tempo real.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    bgcolor: '#2F80ED',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { 
                      bgcolor: '#2666C5',
                      boxShadow: '0 4px 12px rgba(47,128,237,0.3)',
                    },
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(47,128,237,0.2)',
                  }}
                >
                  Começar agora
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PlayArrow />}
                  sx={{
                    color: '#2F80ED',
                    borderColor: '#2F80ED',
                    borderWidth: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { 
                      borderWidth: 2,
                      bgcolor: 'rgba(47,128,237,0.04)',
                    },
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Ver demonstração
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Dashboard Mockup */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: '#F7FAFC',
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                }}
              >
                <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, border: '1px solid #E2E8F0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1A202C' }}>
                    Dashboard
                  </Typography>
                  
                  {/* Receita Total Destacada */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      mb: 3, 
                      bgcolor: '#2F80ED',
                      color: 'white',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Receita Total
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      R$ 374,00
                    </Typography>
                  </Paper>

                  {/* Cards de Métricas */}
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#F7FAFC', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#718096', mb: 0.5 }}>
                          Pedidos
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A202C' }}>
                          8
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#F7FAFC', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#718096', mb: 0.5 }}>
                          Ticket
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A202C' }}>
                          R$ 47
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#F7FAFC', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#718096', mb: 0.5 }}>
                          Lojas
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A202C' }}>
                          1
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Gráfico Simplificado */}
                  <Box sx={{ mt: 3, height: 120, bgcolor: '#F7FAFC', borderRadius: 2, display: 'flex', alignItems: 'flex-end', p: 2, gap: 1 }}>
                    {[30, 60, 45, 80, 55, 70, 90].map((height, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          flex: 1,
                          height: `${height}%`,
                          bgcolor: '#2F80ED',
                          borderRadius: 1,
                          opacity: 0.7,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SEÇÃO PROBLEMA */}
      <Box sx={{ py: 10, bgcolor: '#F7FAFC' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 6,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#1A202C',
            }}
          >
            Você ainda gerencia tudo manualmente?
          </Typography>
          <Grid container spacing={3}>
            {[
              { icon: <ErrorOutline />, text: 'Pedidos espalhados em diferentes plataformas' },
              { icon: <AttachMoney />, text: 'Falta de controle da receita' },
              { icon: <Message />, text: 'Atendimento desorganizado' },
              { icon: <Description />, text: 'Perda de tempo com planilhas' },
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    border: '1px solid #E2E8F0',
                    bgcolor: 'white',
                    borderRadius: 2,
                  }}
                >
                  <Box 
                    sx={{ 
                      color: '#F56565',
                      bgcolor: '#FFF5F5',
                      p: 1.5,
                      borderRadius: 2,
                      display: 'flex',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#2D3748' }}>
                    {item.text}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SEÇÃO SOLUÇÃO */}
      <Box sx={{ py: 10, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#1A202C',
            }}
          >
            Tudo que você precisa em um único sistema
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#718096',
              mb: 6,
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Uma plataforma completa para gerenciar sua operação
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                icon: <ShoppingCart />,
                title: 'Gestão de Pedidos',
                description: 'Visualize, filtre e acompanhe o status de todos os seus pedidos em um único lugar.',
              },
              {
                icon: <Dashboard />,
                title: 'Dashboard Inteligente',
                description: 'Acompanhe receita total, ticket médio e gráficos de desempenho em tempo real.',
              },
              {
                icon: <Store />,
                title: 'Integrações',
                description: 'Conecte-se ao Mercado Livre e sincronize automaticamente seus produtos e pedidos.',
              },
              {
                icon: <Message />,
                title: 'Atendimento Centralizado',
                description: 'Responda perguntas dos marketplaces diretamente no painel, sem sair do sistema.',
              },
            ].map((solution, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid #E2E8F0',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(47,128,237,0.12)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: '#EBF4FF',
                        color: '#2F80ED',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      {solution.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: '#1A202C' }}>
                      {solution.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', lineHeight: 1.6 }}>
                      {solution.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SEÇÃO BENEFÍCIOS */}
      <Box sx={{ py: 10, bgcolor: '#F7FAFC' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 6,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#1A202C',
            }}
          >
            Mais controle. Mais organização. Mais resultado.
          </Typography>
          <Grid container spacing={4}>
            {[
              { icon: <Dashboard />, text: 'Visão completa da operação' },
              { icon: <CheckCircle />, text: 'Redução de erros manuais' },
              { icon: <Speed />, text: 'Economia de tempo' },
              { icon: <BarChart />, text: 'Decisões baseadas em dados' },
            ].map((benefit, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: '#2F80ED',
                      color: 'white',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A202C' }}>
                    {benefit.text}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* GALERIA DE SCREENSHOTS */}
      <Box sx={{ py: 10, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#1A202C',
            }}
          >
            Veja o sistema em ação
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#718096',
              mb: 6,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Capturas de tela reais das principais funcionalidades do JASPI SISTEMAS
          </Typography>

          <Grid container spacing={3}>
            {/* Screenshot 1 - Dashboard */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  height: { xs: 'auto', md: '350px' },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.25)',
                  },
                }}
              >
                <img
                  src="/screenshot-dashboard.png"
                  alt="Dashboard - Visão geral do negócio"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(47, 128, 237, 0.9)',
                    backdropFilter: 'blur(10px)',
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="white">
                    Dashboard Completo
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.9)">
                    Acompanhe métricas e receita em tempo real
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Screenshot 2 - Pedidos */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  height: { xs: 'auto', md: '350px' },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.25)',
                  },
                }}
              >
                <img
                  src="/screenshot-pedidos.png"
                  alt="Gestão de Pedidos"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(47, 128, 237, 0.9)',
                    backdropFilter: 'blur(10px)',
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="white">
                    Gestão de Pedidos
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.9)">
                    Liste, filtre e gerencie todos os pedidos
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Screenshot 3 - Integrações */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  height: { xs: 'auto', md: '280px' },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.25)',
                  },
                }}
              >
                <img
                  src="/screenshot-integracoes.png"
                  alt="Integrações com Marketplaces"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(47, 128, 237, 0.9)',
                    backdropFilter: 'blur(10px)',
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="white">
                    Integrações
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.9)">
                    Conecte seus marketplaces
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Screenshot 4 - Atendimento */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  height: { xs: 'auto', md: '280px' },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.25)',
                  },
                }}
              >
                <img
                  src="/screenshot-atendimento.png"
                  alt="Central de Atendimento"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(47, 128, 237, 0.9)',
                    backdropFilter: 'blur(10px)',
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="white">
                    Atendimento
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.9)">
                    Central unificada de mensagens
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Screenshot 5 - Login */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  height: { xs: 'auto', md: '280px' },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.25)',
                  },
                }}
              >
                <img
                  src="/screenshot-login.png"
                  alt="Tela de Login"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(47, 128, 237, 0.9)',
                    backdropFilter: 'blur(10px)',
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="white">
                    Interface Moderna
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.9)">
                    Design limpo e intuitivo
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* COMO FUNCIONA */}
      <Box sx={{ py: 10, bgcolor: '#F7FAFC' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 6,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#1A202C',
            }}
          >
            Como funciona
          </Typography>
          <Grid container spacing={4} alignItems="center">
            {[
              { step: '01', title: 'Conecte sua loja', description: 'Integre com Mercado Livre em poucos cliques' },
              { step: '02', title: 'Sincronize seus pedidos', description: 'Todos os seus pedidos em um só lugar' },
              { step: '03', title: 'Gerencie tudo', description: 'Controle completo em um único painel' },
            ].map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      color: '#EBF4FF',
                      fontSize: '4rem',
                      mb: 2,
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1A202C' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    {item.description}
                  </Typography>
                  {idx < 2 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 40,
                        right: { xs: '50%', md: -40 },
                        color: '#2F80ED',
                        fontSize: '2rem',
                        display: { xs: 'none', md: 'block' },
                      }}
                    >
                      →
                    </Box>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* INTEGRAÇÕES DISPONÍVEIS */}
      <Box sx={{ py: 10, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#1A202C',
            }}
          >
            Integrações disponíveis
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#718096',
              mb: 8,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Conecte com os principais marketplaces e gerencie tudo em um único lugar
          </Typography>

          <Grid container spacing={4} justifyContent="center" alignItems="center">
            {/* Mercado Livre */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px solid #E2E8F0',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#2F80ED',
                    boxShadow: '0 10px 30px rgba(47, 128, 237, 0.15)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 3,
                    minHeight: '80px',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src="/marketplace-logos/mercadolivre.png"
                    alt="Mercado Livre"
                    style={{
                      maxHeight: '80px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={700} mb={1} sx={{ color: '#1A202C' }}>
                  Mercado Livre
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sincronize pedidos, atualize estoque em tempo real
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: '#E8F4FD',
                      color: '#2F80ED',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Ativo
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Shopee */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px solid #E2E8F0',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#2F80ED',
                    boxShadow: '0 10px 30px rgba(47, 128, 237, 0.15)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 3,
                    minHeight: '80px',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src="/marketplace-logos/shopee.png"
                    alt="Shopee"
                    style={{
                      maxHeight: '80px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={700} mb={1} sx={{ color: '#1A202C' }}>
                  Shopee
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Gerencie vendas do marketplace asiático
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: '#FFE8E8',
                      color: '#FF6B35',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Em breve
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Nuvem Shop */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px solid #E2E8F0',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#2F80ED',
                    boxShadow: '0 10px 30px rgba(47, 128, 237, 0.15)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 3,
                    minHeight: '80px',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src="/marketplace-logos/nuvemshop.png"
                    alt="Nuvem Shop"
                    style={{
                      maxHeight: '80px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={700} mb={1} sx={{ color: '#1A202C' }}>
                  Nuvem Shop
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Integre sua loja virtual criada na plataforma
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: '#E8EBFF',
                      color: '#5B5BFF',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Em breve
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Texto informativo */}
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: '#718096',
              mt: 8,
              fontSize: '0.9rem',
            }}
          >
            Mais integrações em desenvolvimento. Entre em contato para sugerir um marketplace.
          </Typography>
        </Container>
      </Box>

      {/* PROVA SOCIAL */}
      <Box sx={{ py: 10, bgcolor: '#F7FAFC' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 6,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#1A202C',
            }}
          >
            Resultados reais
          </Typography>
          <Grid container spacing={4}>
            {data.socialProof.map((proof, idx) => (
              <Grid item xs={12} sm={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '1px solid #E2E8F0',
                    bgcolor: 'white',
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: '#2F80ED',
                      mb: 1,
                    }}
                  >
                    {proof.value}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#718096', fontWeight: 500 }}>
                    {proof.metric}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA FINAL */}
      <Box
        sx={{
          bgcolor: '#2F80ED',
          color: 'white',
          py: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            display: { xs: 'none', md: 'block' },
          }}
        />
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                }}
              >
                Pronto para profissionalizar sua operação?
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  opacity: 0.95,
                  fontWeight: 400,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                }}
              >
                Junte-se a centenas de vendedores que já usam nossa plataforma
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: 'white',
                  color: '#2F80ED',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1.125rem',
                  '&:hover': {
                    bgcolor: '#F7FAFC',
                    transform: 'translateY(-2px)',
                  },
                  px: 6,
                  py: 2,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                }}
              >
                Começar gratuitamente
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <img 
                  src="/jaspi-mascot.png" 
                  alt="Mascote Jaspi" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    maxHeight: '350px',
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))',
                    animation: 'float 3s ease-in-out infinite',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
        `}
      </style>

      {/* RODAPÉ */}
      <Box sx={{ bgcolor: '#1A202C', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <img 
                src="/jaspi-logo.png" 
                alt="JASPI SISTEMAS" 
                style={{ height: '32px', marginBottom: '16px', filter: 'brightness(0) invert(1)' }}
              />
              <Typography variant="body2" sx={{ color: '#A0AEC0', mb: 2 }}>
                Plataforma completa de gestão para marketplaces
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Links
              </Typography>
              <Stack spacing={1}>
                {['Sobre', 'Contato', 'Termos de Uso', 'Privacidade'].map((link) => (
                  <Typography
                    key={link}
                    variant="body2"
                    sx={{
                      color: '#A0AEC0',
                      cursor: 'pointer',
                      '&:hover': { color: 'white' },
                    }}
                  >
                    {link}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Redes Sociais
              </Typography>
              <Stack direction="row" spacing={1}>
                {[
                  { icon: <LinkedIn />, label: 'LinkedIn' },
                  { icon: <Twitter />, label: 'Twitter' },
                  { icon: <Facebook />, label: 'Facebook' },
                ].map((social) => (
                  <IconButton
                    key={social.label}
                    sx={{
                      color: '#A0AEC0',
                      bgcolor: '#2D3748',
                      '&:hover': { bgcolor: '#4A5568', color: 'white' },
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: '#2D3748', my: 4 }} />
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#A0AEC0' }}>
            © 2026 JASPI SISTEMAS. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
