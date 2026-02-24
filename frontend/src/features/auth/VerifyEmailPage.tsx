import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Container, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError('Token de verificacao invalido.');
        setLoading(false);
        return;
      }

      try {
        const result = await authService.verifyEmail(token);
        setMessage(result?.message || 'Email verificado com sucesso.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar email');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 16px 40px rgba(0,0,0,0.45)'
              : '0 16px 40px rgba(15,23,42,0.16)',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              <CircularProgress />
              <Typography variant="body1">Verificando email...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Nao foi possivel verificar o email
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error}
              </Typography>
              <Button variant="contained" onClick={() => navigate('/login')}>
                Ir para login
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {message}
              </Typography>
              <Button variant="contained" onClick={() => navigate('/login')}>
                Fazer login
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
