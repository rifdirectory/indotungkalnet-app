'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

const SupportPageContent = dynamic(() => import('./SupportPageContent'), { 
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <CircularProgress />
    </Box>
  )
});

export default function SupportPage() {
  return <SupportPageContent />;
}
