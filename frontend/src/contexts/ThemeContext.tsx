import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#42A5F5',
            dark: '#1E88E5',
            light: '#64B5F6',
          },
          secondary: {
            main: '#8b5cf6',
          },
          success: {
            main: isDarkMode ? '#22C55E' : '#10B981',
            light: 'rgba(34, 197, 94, 0.15)',
          },
          warning: {
            main: isDarkMode ? '#FFA726' : '#F59E0B',
            light: 'rgba(255, 167, 38, 0.15)',
          },
          error: {
            main: isDarkMode ? '#EF5350' : '#EF4444',
            light: 'rgba(239, 83, 80, 0.15)',
          },
          background: {
            default: isDarkMode ? '#0f172a' : '#f8fafc',
            paper: isDarkMode ? '#1e293b' : '#ffffff',
          },
          ...(isDarkMode && {
            divider: 'rgba(148, 163, 184, 0.12)',
            text: {
              primary: '#f1f5f9',
              secondary: '#cbd5e1',
              disabled: '#64748b',
            },
            action: {
              active: '#f1f5f9',
              hover: 'rgba(148, 163, 184, 0.08)',
              selected: 'rgba(66, 165, 245, 0.16)',
              disabled: '#64748b',
              disabledBackground: 'rgba(100, 116, 139, 0.12)',
            },
          }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h4: {
            fontWeight: 700,
          },
          h5: {
            fontWeight: 700,
          },
          h6: {
            fontWeight: 600,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                fontWeight: 500,
                padding: '8px 16px',
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(66, 165, 245, 0.25)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                ...(isDarkMode ? {
                  backgroundColor: '#1e293b',
                  backgroundImage: 'none',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
                } : {
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                }),
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  backgroundColor: '#111827',
                  backgroundImage: 'none',
                  borderColor: 'rgba(100, 116, 139, 0.2)',
                }),
              },
            },
          },
          MuiTableContainer: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  backgroundColor: '#111827',
                  border: '1px solid rgba(100, 116, 139, 0.15)',
                  borderRadius: 12,
                }),
              },
            },
          },
          MuiTable: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  backgroundColor: '#111827',
                }),
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  borderColor: 'rgba(100, 116, 139, 0.15)',
                  color: '#FFFFFF',
                }),
              },
              head: {
                ...(isDarkMode && {
                  backgroundColor: '#0F1629',
                  fontWeight: 600,
                  color: '#E2E8F0',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }),
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  '&:hover': {
                    backgroundColor: 'rgba(148, 163, 184, 0.05)',
                  },
                }),
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1E293B',
                    '& fieldset': {
                      borderColor: 'rgba(100, 116, 139, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3B82F6',
                      borderWidth: 2,
                    },
                    '& input': {
                      color: '#FFFFFF',
                    },
                    '& input::placeholder': {
                      color: '#94A3B8',
                      opacity: 1,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#E2E8F0',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#3B82F6',
                  },
                }),
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  backgroundColor: '#1E293B',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(100, 116, 139, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                  },
                }),
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  fontWeight: 500,
                }),
              },
            },
          },
        },
      }),
    [isDarkMode]
  );

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
