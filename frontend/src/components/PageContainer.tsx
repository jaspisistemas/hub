/**
 * Componente PageContainer
 * Container reutilizável para páginas com header, loading e error states
 */

import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Button,
  Snackbar,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export interface PageContainerProps {
  /** Título da página */
  title: string;
  
  /** Subtítulo ou descrição (opcional) */
  subtitle?: string;
  
  /** Se está carregando */
  loading?: boolean;
  
  /** Mensagem de erro */
  error?: string | null;
  
  /** Mensagem de notificação (sucesso) */
  notification?: string | null;
  
  /** Callback para limpar notificação */
  onClearNotification?: () => void;
  
  /** Callback para retry em caso de erro */
  onRetry?: () => void;
  
  /** Ações do header (botões, etc) */
  actions?: React.ReactNode;
  
  /** Conteúdo da página */
  children: React.ReactNode;
  
  /** Se true, não usa Paper wrapper (padrão: false) */
  noPaper?: boolean;
  
  /** Padding customizado (padrão: 3) */
  padding?: number;
}

/**
 * Container padronizado para páginas com header, loading e error handling
 * 
 * @example
 * ```tsx
 * <PageContainer
 *   title="Produtos"
 *   subtitle="Gerencie seus produtos"
 *   loading={loading}
 *   error={error}
 *   notification={notification}
 *   onClearNotification={() => setNotification(null)}
 *   onRetry={refetch}
 *   actions={
 *     <Button variant="contained" onClick={() => dialog.handleOpen()}>
 *       Novo Produto
 *     </Button>
 *   }
 * >
 *   <ProductsTable products={data} />
 * </PageContainer>
 * ```
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  loading = false,
  error = null,
  notification = null,
  onClearNotification,
  onRetry,
  actions,
  children,
  noPaper = false,
  padding = 3,
}) => {
  const content = (
    <Box sx={{ p: padding }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box>{actions}</Box>}
      </Box>

      {/* Error State */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            onRetry && (
              <Button
                color="inherit"
                size="small"
                onClick={onRetry}
                startIcon={<RefreshIcon />}
              >
                Tentar Novamente
              </Button>
            )
          }
        >
          <AlertTitle>Erro</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Content */}
      {!loading && !error && children}

      {/* Success Notification */}
      {notification && onClearNotification && (
        <Snackbar
          open={Boolean(notification)}
          autoHideDuration={4000}
          onClose={onClearNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={onClearNotification}
            severity="success"
            sx={{ width: '100%' }}
          >
            {notification}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );

  if (noPaper) {
    return content;
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2 }}>
      {content}
    </Paper>
  );
};

export default PageContainer;
