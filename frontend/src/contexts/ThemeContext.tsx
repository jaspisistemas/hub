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
          },
          secondary: {
            main: '#357FD7',
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
          background: {
            default: isDarkMode ? '#0f1115' : '#F5F5F7',
            paper: isDarkMode ? '#151923' : '#FFFFFF',
          },
          text: {
            primary: isDarkMode ? '#E6E6E6' : '#1D1D1F',
            secondary: isDarkMode ? '#A1A1AA' : '#6E6E73',
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
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundColor: isDarkMode ? '#151923' : '#FFFFFF',
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
                backgroundColor: isDarkMode ? '#151923' : '#FFFFFF',
                boxShadow: isDarkMode
                  ? '0 4px 20px rgba(0,0,0,0.35)'
                  : '0 4px 20px rgba(0,0,0,0.04)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? '#1A1F2B' : '#F5F5F7',
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
