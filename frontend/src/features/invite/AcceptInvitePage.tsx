import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Container, Paper, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import collaboratorsService from '../../services/collaboratorsService';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    const accept = async () => {
      if (!token) {
        setError('Token de convite invalido.');
        setLoading(false);
        return;
      }

      try {
        const result = await collaboratorsService.acceptInvite(token);
        const name = result?.company?.name || result?.companyName || null;
        setCompanyName(name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao aceitar convite');
      } finally {
        setLoading(false);
      }
    };

    accept();
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
              <Typography variant="body1">Aceitando convite...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Nao foi possivel aceitar o convite
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
                Convite aceito com sucesso
              </Typography>
              {companyName && (
                <Typography variant="body2" color="text.secondary">
                  Voce agora faz parte da empresa {companyName}.
                </Typography>
              )}
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
