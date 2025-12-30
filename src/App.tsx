import { useState } from 'react';
import { Box, Typography, Button, AppBar, Toolbar } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';

import { RewardEditor } from './pages/RewardEditor';
import { ChainOfferCreator } from './pages/ChainOfferCreator';

function App() {
  const [page, setPage] = useState<'reward' | 'chainOffer'>('reward');

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
      <AppBar position='static'>
        <Toolbar>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            Reward Editor Suite
          </Typography>
          <Button
            color='inherit'
            onClick={() => setPage('reward')}
            startIcon={<ViewListIcon />}>
            Reward Editor
          </Button>
          <Button
            color='inherit'
            onClick={() => setPage('chainOffer')}
            startIcon={<AddIcon />}>
            ChainOffer Config Creator
          </Button>
        </Toolbar>
      </AppBar>

      {page === 'reward' ? <RewardEditor /> : <ChainOfferCreator />}
    </Box>
  );
}

export default App;
