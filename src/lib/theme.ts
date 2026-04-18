'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a73e8', // Google Blue
      light: '#4285f4',
      dark: '#0d47a1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5f6368', // Google Gray
      light: '#9aa0a6',
      dark: '#3c4043',
    },
    background: {
      default: '#f8f9fa', // Google Soft Gray
      paper: '#ffffff',
    },
    text: {
      primary: '#202124', // Google Charcoal
      secondary: '#5f6368',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    error: {
      main: '#d93025', // Google Red
    },
    success: {
      main: '#1e8e3e', // Google Green
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h1: { fontWeight: 700, fontSize: '2rem' },
    h2: { fontWeight: 700, fontSize: '1.75rem' },
    h3: { fontWeight: 700, fontSize: '1.5rem' },
    h4: { fontWeight: 700, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.1rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 4, // Default 4px, so sx={3} = 12px
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '6px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            borderColor: '#bdc1c6',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: '#1765cc',
          },
        },
        containedPrimary: {
          backgroundColor: '#1a73e8', // Solid Google Blue
          '&:hover': {
            backgroundColor: '#1765cc',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Smaller rounding for more compact feel
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.08)', // Google Material border
          boxShadow: 'none',
          '&.MuiPaper-elevation1': {
            boxShadow: 'none',
            border: '1px solid #dadce0',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff', // Pure white sidebar on gray background
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 0, // Keep sidebar sharp for layout consistency
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #dadce0',
          padding: '10px 16px', // Tighter rows
        },
        head: {
          fontWeight: 600,
          color: '#5f6368', // Google secondary text
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
        },
      },
    },
  },
});

export default theme;
