'use client';

import { 
  AppBar, 
  Toolbar, 
} from '@mui/material';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const HeaderContent = dynamic(() => import('./HeaderContent'), { ssr: false });

export function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        borderRadius: 0,
        mt: 0,
      }}
    >
      <Toolbar sx={{ height: 72, px: { xs: 2, md: 4 }, justifyContent: 'space-between' }}>
        <HeaderContent onLogout={handleLogout} />
      </Toolbar>
    </AppBar>
  );
}
