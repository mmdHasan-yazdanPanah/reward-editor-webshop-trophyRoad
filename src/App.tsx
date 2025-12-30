import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CssBaseline,
  GlobalStyles,
  Stack,
  Paper,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

import { RewardEditor } from './pages/RewardEditor';
import { ChainOfferCreator } from './pages/ChainOfferCreator';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1b4dff' },
    secondary: { main: '#f37b4a' },
    background: { default: '#f3f1ec', paper: '#ffffff' },
    text: { primary: '#16161a', secondary: '#4b4b59' },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Segoe UI", Tahoma, sans-serif',
    h1: { fontSize: '2.6rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '2.1rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.6rem', fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 18,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #e4e1db',
          boxShadow: '0 12px 30px rgba(28, 26, 23, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
        },
      },
    },
  },
});

function App() {
  const [page, setPage] = useState<'reward' | 'chainOffer'>('reward');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            background:
              'radial-gradient(circle at top, #fff9f1 0%, #f3f1ec 45%, #efe7de 100%)',
          },
        }}
      />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          gap: 3,
          p: { xs: 2, md: 3 },
        }}>
        <Paper
          sx={{
            width: { xs: '100%', md: 280 },
            flexShrink: 0,
            p: 2.5,
            height: { md: 'calc(100vh - 48px)' },
            position: { md: 'sticky' },
            top: { md: 24 },
            alignSelf: 'flex-start',
            background:
              'linear-gradient(160deg, rgba(27,77,255,0.08), rgba(243,123,74,0.08))',
          }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Reward Studio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Craft, preview, and ship reward configurations faster.
          </Typography>
          <Stack spacing={1.5}>
            <Button
              variant={page === 'reward' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setPage('reward')}
              startIcon={<ViewListIcon />}>
              Reward Editor
            </Button>
            <Button
              variant={page === 'chainOffer' ? 'contained' : 'outlined'}
              color="secondary"
              onClick={() => setPage('chainOffer')}
              startIcon={<AddIcon />}>
              Chain Offer Builder
            </Button>
          </Stack>
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e4e1db' }}>
            <Typography variant="caption" color="text.secondary">
              Version 2.0 • {page === 'reward' ? 'Rewards' : 'Chain Offers'}
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              mb: 3,
              background: alpha('#ffffff', 0.92),
            }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ md: 'center' }}
              justifyContent="space-between">
              <Box>
                <Typography variant="h2">
                  {page === 'reward' ? 'Reward Editor' : 'Chain Offer Builder'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {page === 'reward'
                    ? 'Edit and validate reward tables with instant previews.'
                    : 'Design multi-step offers with flexible costs and rewards.'}
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 600,
                }}>
                {page === 'reward' ? 'Reward Flow' : 'Chain Flow'}
              </Box>
            </Stack>
          </Paper>

          {page === 'reward' ? <RewardEditor /> : <ChainOfferCreator />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
