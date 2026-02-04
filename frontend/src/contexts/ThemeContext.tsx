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
            main: isDarkMode ? '#3B82F6' : '#0099FF',
            dark: isDarkMode ? '#2563EB' : '#0066CC',
            light: isDarkMode ? '#60A5FA' : '#33AAFF',
          },
          secondary: {
            main: '#8b5cf6',
          },
          success: {
            main: '#10B981',
            light: 'rgba(16, 185, 129, 0.15)',
          },
          warning: {
            main: '#F59E0B',
            light: 'rgba(245, 158, 11, 0.15)',
          },
          error: {
            main: '#EF4444',
            light: 'rgba(239, 68, 68, 0.15)',
          },
          background: {
            default: isDarkMode ? '#0A0E1A' : '#f8fafc',
            paper: isDarkMode ? '#111827' : '#ffffff',
          },
          ...(isDarkMode && {
            divider: 'rgba(100, 116, 139, 0.2)',
            text: {
              primary: '#FFFFFF',
              secondary: '#E2E8F0',
              disabled: '#94A3B8',
            },
            action: {
              active: '#FFFFFF',
              hover: 'rgba(148, 163, 184, 0.08)',
              selected: 'rgba(59, 130, 246, 0.12)',
              disabled: '#94A3B8',
              disabledBackground: 'rgba(100, 116, 139, 0.12)',
            },
          }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                fontWeight: 500,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                ...(isDarkMode && {
                  backgroundColor: '#111827',
                  backgroundImage: 'none',
                  border: '1px solid rgba(100, 116, 139, 0.15)',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
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
