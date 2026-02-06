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
            main: isDarkMode ? '#58a6ff' : '#42A5F5',
            dark: isDarkMode ? '#1f6feb' : '#1E88E5',
            light: isDarkMode ? '#79c0ff' : '#64B5F6',
          },
          secondary: {
            main: isDarkMode ? '#b392f0' : '#8b5cf6',
          },
          success: {
            main: isDarkMode ? '#3fb950' : '#10B981',
            light: isDarkMode ? 'rgba(63, 185, 80, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          },
          warning: {
            main: isDarkMode ? '#d29922' : '#F59E0B',
            light: isDarkMode ? 'rgba(210, 153, 34, 0.15)' : 'rgba(255, 167, 38, 0.15)',
          },
          error: {
            main: isDarkMode ? '#f85149' : '#EF4444',
            light: isDarkMode ? 'rgba(248, 81, 73, 0.15)' : 'rgba(239, 83, 80, 0.15)',
          },
          background: {
            default: isDarkMode ? '#0d1117' : '#f8fafc',
            paper: isDarkMode ? '#161b22' : '#ffffff',
          },
          ...(isDarkMode && {
            divider: '#30363d',
            text: {
              primary: '#e6edf3',
              secondary: '#8b949e',
              disabled: '#6e7681',
            },
            action: {
              active: '#e6edf3',
              hover: 'rgba(177, 186, 196, 0.12)',
              selected: 'rgba(88, 166, 255, 0.15)',
              disabled: '#6e7681',
              disabledBackground: 'rgba(110, 118, 129, 0.1)',
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
                  backgroundColor: '#161b22',
                  backgroundImage: 'none',
                  border: '1px solid #30363d',
                  boxShadow: 'none',
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
                  backgroundColor: '#161b22',
                  backgroundImage: 'none',
                  borderColor: '#30363d',
                }),
              },
            },
          },
          MuiTableContainer: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 12,
                }),
              },
            },
          },
          MuiTable: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  backgroundColor: '#161b22',
                }),
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  borderColor: '#30363d',
                  color: '#e6edf3',
                }),
              },
              head: {
                ...(isDarkMode && {
                  backgroundColor: '#0d1117',
                  fontWeight: 600,
                  color: '#8b949e',
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
                    backgroundColor: 'rgba(177, 186, 196, 0.08)',
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
                    backgroundColor: '#0d1117',
                    '& fieldset': {
                      borderColor: '#30363d',
                    },
                    '&:hover fieldset': {
                      borderColor: '#58a6ff',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#58a6ff',
                      borderWidth: 1,
                    },
                    '& input': {
                      color: '#e6edf3',
                    },
                    '& input::placeholder': {
                      color: '#6e7681',
                      opacity: 1,
                    },
                  },
                }),
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  backgroundColor: '#0d1117',
                  color: '#e6edf3',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#30363d',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#58a6ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#58a6ff',
                    borderWidth: 1,
                  },
                  '& .MuiSelect-icon': {
                    color: '#8b949e',
                  },
                }),
              },
              select: {
                ...(isDarkMode && {
                  '&:focus': {
                    backgroundColor: '#0d1117',
                  },
                }),
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                ...(isDarkMode && {
                  backgroundColor: '#161b22',
                  backgroundImage: 'none',
                  border: '1px solid #30363d',
                }),
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  color: '#e6edf3',
                  '&:hover': {
                    backgroundColor: 'rgba(177, 186, 196, 0.12)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(88, 166, 255, 0.15)',
                    '&:hover': {
                      backgroundColor: 'rgba(88, 166, 255, 0.2)',
                    },
                  },
                }),
              },
            },
          },
          MuiAutocomplete: {
            styleOverrides: {
              paper: {
                ...(isDarkMode && {
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                }),
              },
              option: {
                ...(isDarkMode && {
                  color: '#e6edf3',
                  '&:hover': {
                    backgroundColor: 'rgba(177, 186, 196, 0.12)',
                  },
                  '&[aria-selected="true"]': {
                    backgroundColor: 'rgba(88, 166, 255, 0.15)',
                    '&:hover': {
                      backgroundColor: 'rgba(88, 166, 255, 0.2)',
                    },
                  },
                }),
              },
              inputRoot: {
                ...(isDarkMode && {
                  color: '#e6edf3',
                  '& .MuiAutocomplete-input': {
                    color: '#e6edf3',
                  },
                }),
              },
              popupIndicator: {
                ...(isDarkMode && {
                  color: '#8b949e',
                }),
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  color: '#8b949e',
                  '&.Mui-focused': {
                    color: '#58a6ff',
                  },
                }),
              },
            },
          },
          MuiFormControl: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  '& .MuiInputBase-root': {
                    color: '#e6edf3',
                  },
                }),
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                ...(isDarkMode && {
                  backgroundColor: '#161b22',
                  backgroundImage: 'none',
                  border: '1px solid #30363d',
                }),
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                ...(isDarkMode && {
                  fontWeight: 500,
                  borderColor: '#30363d',
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
