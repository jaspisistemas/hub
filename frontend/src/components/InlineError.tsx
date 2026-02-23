import React from 'react';
import { Alert, Button } from '@mui/material';

type InlineErrorProps = {
  message: string;
  onClose?: () => void;
  onRetry?: () => void;
  actionLabel?: string;
};

export default function InlineError({
  message,
  onClose,
  onRetry,
  actionLabel = 'Tentar novamente',
}: InlineErrorProps) {
  return (
    <Alert
      severity="error"
      onClose={onClose}
      sx={{ borderRadius: 2 }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {actionLabel}
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}
