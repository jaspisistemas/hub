import React, { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  IconButton,
  Checkbox,
  alpha,
  useTheme,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import EmptyState from './EmptyState';

// Constantes de estilo padronizadas
export const TABLE_CONSTANTS = {
  ROW_HEIGHT: 64,
  HEADER_HEIGHT: 56,
  CELL_PADDING: '12px 16px',
  IMAGE_SIZE: 48,
  BORDER_RADIUS: '12px',
  HEADER: {
    FONT_SIZE: '0.875rem',
    FONT_WEIGHT: 600,
    TEXT_TRANSFORM: 'uppercase' as const,
    LETTER_SPACING: '0.5px',
  },
  BODY: {
    FONT_SIZE: '0.9375rem',
    FONT_WEIGHT: 400,
  },
  HOVER_ALPHA: 0.04,
  SELECTED_ALPHA: 0.08,
};

export interface Column<T = any> {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  minWidth?: string | number;
  format?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  numeric?: boolean;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  
  // Paginação
  pagination?: boolean;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  rowsPerPageOptions?: number[];
  
  // Seleção
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selected: string[]) => void;
  getRowId?: (row: T) => string;
  
  // Ações
  onRowClick?: (row: T) => void;
  onRowAction?: (row: T, event: React.MouseEvent<HTMLElement>) => void;
  showActions?: boolean;
  
  // Hover e estados
  hover?: boolean;
  dense?: boolean;
  
  // Customização visual
  stickyHeader?: boolean;
  maxHeight?: string | number;
  
  // Ordenação
  orderBy?: string;
  order?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
}

export default function DataTable<T = any>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  emptyIcon,
  
  // Paginação
  pagination = false,
  page = 0,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
  
  // Seleção
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId = (row: any) => row.id,
  
  // Ações
  onRowClick,
  onRowAction,
  showActions = false,
  
  // Hover e estados
  hover = true,
  dense = false,
  
  // Customização visual
  stickyHeader = false,
  maxHeight,
  
  // Ordenação
  orderBy,
  order,
  onSort,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.map(row => getRowId(row));
      onSelectionChange?.(newSelected);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (rowId: string) => {
    const selectedIndex = selectedRows.indexOf(rowId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedRows, rowId];
    } else {
      newSelected = selectedRows.filter(id => id !== rowId);
    }

    onSelectionChange?.(newSelected);
  };

  const isSelected = (rowId: string) => selectedRows.indexOf(rowId) !== -1;

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange?.(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
    onPageChange?.(0);
  };

  // Se está carregando, mostra loading
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Se não tem dados, mostra empty state
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} icon={emptyIcon} />;
  }

  const numSelected = selectedRows.length;
  const rowCount = data.length;

  return (
    <Paper 
      sx={{ 
        width: '100%', 
        overflow: 'hidden',
        borderRadius: TABLE_CONSTANTS.BORDER_RADIUS,
        boxShadow: isDark 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      }}
    >
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow 
              sx={{ 
                height: TABLE_CONSTANTS.HEADER_HEIGHT,
                bgcolor: isDark ? '#0d1117' : '#f8fafc',
              }}
            >
              {selectable && (
                <TableCell 
                  padding="checkbox"
                  sx={{
                    bgcolor: 'inherit',
                    borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                  }}
                >
                  <Checkbox
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
              )}
              
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || (column.numeric ? 'right' : 'left')}
                  sx={{
                    ...TABLE_CONSTANTS.HEADER,
                    minWidth: column.minWidth,
                    width: column.width,
                    padding: TABLE_CONSTANTS.CELL_PADDING,
                    color: isDark ? '#8b949e' : '#6b7280',
                    bgcolor: 'inherit',
                    borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    '&:hover': column.sortable ? {
                      color: isDark ? '#c9d1d9' : '#374151',
                    } : {},
                  }}
                  onClick={() => column.sortable && onSort?.(column.id)}
                >
                  {column.label}
                  {column.sortable && orderBy === column.id && (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      {order === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </TableCell>
              ))}
              
              {showActions && (
                <TableCell 
                  align="center"
                  sx={{
                    ...TABLE_CONSTANTS.HEADER,
                    width: 60,
                    padding: TABLE_CONSTANTS.CELL_PADDING,
                    color: isDark ? '#8b949e' : '#6b7280',
                    bgcolor: 'inherit',
                    borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                  }}
                >
                  Ações
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {data.map((row, index) => {
              const rowId = getRowId(row);
              const isItemSelected = isSelected(rowId);
              
              return (
                <TableRow
                  key={rowId}
                  hover={hover}
                  selected={isItemSelected}
                  onClick={() => !selectable && onRowClick?.(row)}
                  sx={{
                    height: dense ? 52 : TABLE_CONSTANTS.ROW_HEIGHT,
                    cursor: onRowClick && !selectable ? 'pointer' : 'default',
                    '&:hover': hover ? {
                      bgcolor: isDark 
                        ? alpha(theme.palette.primary.main, TABLE_CONSTANTS.HOVER_ALPHA)
                        : alpha(theme.palette.primary.main, TABLE_CONSTANTS.HOVER_ALPHA),
                    } : {},
                    '&.Mui-selected': {
                      bgcolor: isDark
                        ? alpha(theme.palette.primary.main, TABLE_CONSTANTS.SELECTED_ALPHA)
                        : alpha(theme.palette.primary.main, TABLE_CONSTANTS.SELECTED_ALPHA),
                      '&:hover': {
                        bgcolor: isDark
                          ? alpha(theme.palette.primary.main, TABLE_CONSTANTS.SELECTED_ALPHA + 0.04)
                          : alpha(theme.palette.primary.main, TABLE_CONSTANTS.SELECTED_ALPHA + 0.04),
                      },
                    },
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={() => handleSelectRow(rowId)}
                        size="small"
                      />
                    </TableCell>
                  )}
                  
                  {columns.map((column) => {
                    const value = (row as any)[column.id];
                    const formattedValue = column.format ? column.format(value, row) : value;
                    
                    return (
                      <TableCell
                        key={column.id}
                        align={column.align || (column.numeric ? 'right' : 'left')}
                        sx={{
                          ...TABLE_CONSTANTS.BODY,
                          padding: TABLE_CONSTANTS.CELL_PADDING,
                          color: isDark ? '#c9d1d9' : '#1f2937',
                          borderBottom: `1px solid ${isDark ? '#21262d' : '#f3f4f6'}`,
                        }}
                      >
                        {formattedValue}
                      </TableCell>
                    );
                  })}
                  
                  {showActions && (
                    <TableCell 
                      align="center"
                      sx={{
                        padding: TABLE_CONSTANTS.CELL_PADDING,
                        borderBottom: `1px solid ${isDark ? '#21262d' : '#f3f4f6'}`,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowAction?.(row, e);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={totalCount || data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
          sx={{
            borderTop: `1px solid ${isDark ? '#21262d' : '#f3f4f6'}`,
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.875rem',
              color: isDark ? '#8b949e' : '#6b7280',
            },
          }}
        />
      )}
    </Paper>
  );
}

// Componente auxiliar para truncar texto com tooltip
export function TruncatedText({ 
  children, 
  maxLength = 50 
}: { 
  children: string; 
  maxLength?: number;
}) {
  if (!children || children.length <= maxLength) {
    return <>{children}</>;
  }
  
  const truncated = `${children.substring(0, maxLength)}...`;
  
  return (
    <Tooltip title={children} arrow placement="top">
      <span style={{ cursor: 'help' }}>{truncated}</span>
    </Tooltip>
  );
}

// Componente auxiliar para imagens com fallback
export function TableImage({ 
  src, 
  alt, 
  size = TABLE_CONSTANTS.IMAGE_SIZE 
}: { 
  src?: string; 
  alt: string;
  size?: number;
}) {
  const [error, setError] = React.useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  if (!src || error) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 1,
          bgcolor: isDark ? '#21262d' : '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDark ? '#8b949e' : '#9ca3af',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        {alt.substring(0, 2).toUpperCase()}
      </Box>
    );
  }
  
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={() => setError(true)}
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: 1,
        bgcolor: isDark ? '#21262d' : '#f9fafb',
        border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
      }}
    />
  );
}
