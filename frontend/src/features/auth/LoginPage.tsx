import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  InputAdornment,
  Grid,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Email as EmailIcon, Lock as LockIcon, Person as PersonIcon } from '@mui/icons-material';
import { authService } from '../../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validação rápida
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido');
      return;
    }

    if (isRegistering && !name) {
      setError('Por favor, informe seu nome');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        const response = await authService.register({ email, password, name });
        authService.setToken(response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/');
      } else {
        const response = await authService.login({ email, password });
        authService.setToken(response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRegistering
            ? 'Erro ao registrar. Tente novamente.'
            : 'Erro ao fazer login. Tente novamente.'
      );
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
        p: 2,
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: '1100px' }}>
        <Grid container spacing={0} alignItems="center">
          {/* Formulário de Login - Lado Esquerdo */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 6,
                borderRadius: { xs: 2, md: '16px 0 0 16px' },
                height: '700px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box sx={{ width: '100%', maxWidth: '400px' }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: '#0099FF',
                    margin: '0 auto',
                    mb: 2,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0099FF 0%, #667eea 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 1,
                  }}
                >
                  {isRegistering ? 'Sign up' : 'Log In'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Sistema para gerenciamento de marketplaces
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta!'}
                </Typography>
              </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <TextField
                fullWidth
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                placeholder="Seu nome completo"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  },
                }}
              />
            )}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              placeholder="seu@email.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#555555', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              placeholder="••••••••"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#555555', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                mt: 3,
                mb: 2,
                p: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #0099FF 0%, #0066CC 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0088DD 0%, #0055BB 100%)',
                },
              }}
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? isRegistering
                  ? 'Criando conta...'
                  : 'Carregando...'
                : isRegistering
                  ? 'Criar Conta'
                  : 'Entrar'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="text"
                sx={{
                  textTransform: 'none',
                  color: '#0099FF',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 153, 255, 0.05)',
                  },
                }}
                onClick={() => {
                  alert('Funcionalidade de recuperação de senha em breve');
                }}
              >
                Esqueci a senha
              </Button>
              
              <Button
                variant="text"
                sx={{
                  textTransform: 'none',
                  color: '#0099FF',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 153, 255, 0.05)',
                  },
                }}
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setName('');
                }}
              >
                {isRegistering ? 'Fazer login' : 'Criar conta'}
              </Button>
            </Box>
          </form>

              {!isRegistering && (
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography variant="caption" color="textSecondary">
                    Credenciais de demonstração:
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                    demo@example.com | demo123
                  </Typography>
                </Box>
              )}
              </Box>
            </Paper>
          </Grid>

          {/* Mascote - Lado Direito */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: '0 16px 16px 0',
                bgcolor: 'background.paper',
                height: '700px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Box
                  component="img"
                  src="/jaspi-mascot.png"
                  alt="Jaspi Mascot"
                  sx={{
                    width: '100%',
                    maxWidth: '400px',
                    height: 'auto',
                    filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))',
                  }}
                />
              </Box>

              {/* Círculos decorativos */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: 'rgba(102, 126, 234, 0.1)',
                  top: '-50px',
                  right: '-50px',
                  zIndex: 1,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'rgba(0, 153, 255, 0.1)',
                  bottom: '-30px',
                  left: '-30px',
                  zIndex: 1,
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
