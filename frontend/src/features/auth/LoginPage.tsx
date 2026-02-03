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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
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
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Email inválido');
        return;
      }

      if (isRegistering) {
        if (!name) {
          setError('Por favor, informe seu nome');
          return;
        }
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
    } finally {
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
        background: 'linear-gradient(135deg, #0099FF 0%, #1a3d5c 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0099FF 0%, #1a3d5c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1,
              }}
            >
              JASPI HUB
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {isRegistering ? 'Crie sua conta' : 'Sistema de Gerenciamento de Marketplaces'}
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

            <Button
              fullWidth
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
              {isRegistering
                ? 'Já tem uma conta? Faça login'
                : 'Não tem conta? Crie uma agora'}
            </Button>
          </form>

          {!isRegistering && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="caption" color="textSecondary">
                Credenciais de demonstração:
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                Email: demo@example.com | Senha: demo123
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
