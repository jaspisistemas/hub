import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
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
    setIsDarkMode((prev) => !prev);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#4F9CF9',
            light: '#7AB7FF',
            dark: '#2D6FD6',
          },
          secondary: {
            main: '#357FD7',
            light: '#5C98E5',
            dark: '#245AA6',
          },
          success: {
            main: '#34C759',
          },
          warning: {
            main: '#FF9F0A',
          },
          error: {
            main: '#FF3B30',
          },
          info: {
            main: '#3B82F6',
          },
          background: {
            default: isDarkMode ? '#0b0f17' : '#F5F5F7',
            paper: isDarkMode ? '#111827' : '#FFFFFF',
          },
          text: {
            primary: isDarkMode ? '#E5E7EB' : '#1D1D1F',
            secondary: isDarkMode ? '#C7D0DD' : '#6E6E73',
          },
          divider: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
        typography: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: isDarkMode ? '#0b0f17' : '#F5F5F7',
                color: isDarkMode ? '#E5E7EB' : '#1D1D1F',
              },
              '*::-webkit-scrollbar': {
                width: 10,
                height: 10,
              },
              '*::-webkit-scrollbar-thumb': {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                borderRadius: 999,
              },
              '*::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 12,
                fontWeight: 500,
                padding: '10px 20px',
                transition: 'all 0.2s ease',
                '&:active': {
                  transform: 'scale(0.98)',
                },
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(79,156,249,0.25)',
                },
              },
              outlined: {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
                boxShadow: isDarkMode
                  ? '0 4px 20px rgba(0,0,0,0.35)'
                  : '0 4px 20px rgba(0,0,0,0.04)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundImage: 'none',
                backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
                boxShadow: isDarkMode
                  ? '0 4px 20px rgba(0,0,0,0.35)'
                  : '0 4px 20px rgba(0,0,0,0.04)',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              head: {
                fontWeight: 600,
                backgroundColor: isDarkMode ? '#0f1520' : '#f5f7fa',
                color: isDarkMode ? '#CBD5F5' : '#1a1a1a',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? '#162033' : '#F5F5F7',
                  '& fieldset': {
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: '#4F9CF9',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4F9CF9',
                    boxShadow: '0 0 0 3px rgba(79,156,249,0.1)',
                  },
                  '& input, & textarea': {
                    color: isDarkMode ? '#E6E6E6' : '#1D1D1F',
                  },
                  '& input::placeholder, & textarea::placeholder': {
                    color: isDarkMode ? '#8B94A6' : '#6E6E73',
                    opacity: 1,
                  },
                },
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: isDarkMode ? '#111827' : '#1f2937',
                color: '#fff',
                borderRadius: 8,
                fontSize: '0.75rem',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 999,
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
