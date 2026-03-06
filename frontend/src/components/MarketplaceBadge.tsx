/**
 * Componente MarketplaceBadge
 * Badge reutilizável para exibir marketplace/origem
 */

import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { getMarketplaceBadge } from '../utils/status.helpers';

export interface MarketplaceBadgeProps {
  /** Nome do marketplace */
  marketplace?: string;
  
  /** Mostrar tooltip com nome completo (padrão: true) */
  showTooltip?: boolean;
  
  /** Tamanho do badge (padrão: 'medium') */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Badge de marketplace com cores e texto padronizados
 * 
 * @example
 * ```tsx
 * <MarketplaceBadge marketplace="mercado_livre" />
 * <MarketplaceBadge marketplace="shopee" size="small" />
 * <MarketplaceBadge marketplace="amazon" showTooltip={false} />
 * ```
 */
export const MarketplaceBadge: React.FC<MarketplaceBadgeProps> = ({
  marketplace,
  showTooltip = true,
  size = 'medium',
}) => {
  const badge = getMarketplaceBadge(marketplace);

  const sizeStyles = {
    small: {
      fontSize: '0.625rem',
      padding: '2px 6px',
      minWidth: '32px',
      height: '20px',
    },
    medium: {
      fontSize: '0.75rem',
      padding: '4px 8px',
      minWidth: '40px',
      height: '24px',
    },
    large: {
      fontSize: '0.875rem',
      padding: '6px 12px',
      minWidth: '48px',
      height: '32px',
    },
  };

  const badgeElement = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: badge.bg,
        color: badge.color,
        borderRadius: 1,
        fontWeight: 600,
        letterSpacing: '0.5px',
        ...sizeStyles[size],
      }}
    >
      {badge.text}
    </Box>
  );

  if (showTooltip && badge.label !== badge.text) {
    return (
      <Tooltip title={badge.label} arrow>
        {badgeElement}
      </Tooltip>
    );
  }

  return badgeElement;
};

export default MarketplaceBadge;
