'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  alpha,
  useTheme,
  Button
} from "@mui/material";
import { 
  Settings as SettingsIcon,
  People as PeopleIcon,
  ConfirmationNumber as TicketIcon,
  AccountBalanceWallet as FinanceIcon
} from "@mui/icons-material";
import Link from 'next/link';
import { getUserSessionAction, getMenuPermissionsAction } from '@/actions/permissions';

export default function Dashboard() {
  const theme = useTheme();
  const [user, setUser] = useState<any>(null);
  const [allowedKeys, setAllowedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndPermissions = async () => {
      setLoading(true);
      try {
        // 1. Get Session
        const sessionRes = await getUserSessionAction();
        if (!sessionRes.success || !sessionRes.user) return;
        
        const me = sessionRes.user;
        setUser(me);

        // 2. Get Permissions (Same logic as Sidebar)
        const [rolePermRes, userPermRes] = await Promise.all([
          getMenuPermissionsAction(me.role),
          me.userId ? getMenuPermissionsAction(undefined, me.userId) : Promise.resolve({ success: true, permissions: [] })
        ]);

        if (me.role === 'admin') {
          // Admin sees everything
          setAllowedKeys(['customers', 'support', 'finance', 'settings', 'maintenance', 'inventory', 'presence', 'notifications']);
        } else {
          const perms: Record<string, number> = {};
          
          // 1. Initialize all dashboard keys as enabled (1) by default
          const dashboardKeys = ['customers', 'support', 'finance', 'settings'];
          dashboardKeys.forEach(k => perms[k] = 1);

          // 2. Role perms override
          if (rolePermRes.success && rolePermRes.permissions) {
            rolePermRes.permissions.forEach((p: any) => {
              if (p.platform === 'web') perms[p.menu_key] = p.is_enabled;
            });
          }

          // 3. User perms override
          if (userPermRes.success && userPermRes.permissions) {
            userPermRes.permissions.forEach((p: any) => {
              if (p.platform === 'web') perms[p.menu_key] = p.is_enabled;
            });
          }
          
          const enabled = Object.keys(perms).filter(key => perms[key] === 1);
          setAllowedKeys(enabled);
        }
      } catch (err) {
        console.error('Failed to fetch user permissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndPermissions();
  }, []);

  const quickAccessItems = [
    { key: 'customers', label: 'Data Customer', icon: <PeopleIcon />, href: '/customers', color: '#3b82f6' },
    { key: 'support', label: 'Tiket Support', icon: <TicketIcon />, href: '/support', color: '#f59e0b' },
    { key: 'finance', label: 'Keuangan', icon: <FinanceIcon />, href: '/finance', color: '#10b981' },
    { key: 'settings', label: 'Pengaturan', icon: <SettingsIcon />, href: '/settings', color: '#6366f1' },
  ].filter(item => allowedKeys.includes(item.key));

  if (loading) return null;

  return (
    <Box sx={{ 
      px: { xs: 3, md: 5 }, 
      pt: 4, 
      pb: 10,
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      {/* Background Decorative Elements */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
        zIndex: -1,
        filter: 'blur(40px)',
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: 250,
        height: 250,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha('#10b981', 0.1)} 0%, transparent 70%)`,
        zIndex: -1,
        filter: 'blur(40px)',
      }} />

      {/* Welcome Message Section */}
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 900, 
            mb: 2, 
            letterSpacing: '-0.04em',
            background: `linear-gradient(135deg, ${theme.palette.text.primary} 30%, ${alpha(theme.palette.text.primary, 0.6)} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Selamat Datang, {user?.username === 'admin' ? 'Administrator' : (user?.username || '...')}!
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            fontWeight: 500, 
            maxWidth: 600, 
            mx: 'auto',
            lineHeight: 1.6,
            opacity: 0.8
          }}
        >
          Selamat bekerja di Dashboard Manajemen **PT. Indo Tungkal Net**. 
          Pilih menu navigasi di sebelah kiri untuk mulai mengelola operasional hari ini.
        </Typography>
      </Box>

      {/* Quick Access Grid (Glassmorphism) */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3} 
        sx={{ width: '100%', maxWidth: 800 }}
      >
        {quickAccessItems.map((item) => (
          <Button
            key={item.label}
            component={Link}
            href={item.href}
            variant="outlined"
            sx={{
              flex: 1,
              p: 3,
              borderRadius: 5,
              borderColor: alpha(theme.palette.divider, 0.5),
              background: alpha('#fff', 0.05),
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'none',
              '&:hover': {
                transform: 'translateY(-8px)',
                borderColor: item.color,
                background: alpha(item.color, 0.03),
                boxShadow: `0 12px 40px ${alpha(item.color, 0.1)}`,
                '& .icon-box': {
                  bgcolor: item.color,
                  color: '#fff',
                }
              }
            }}
          >
            <Box className="icon-box" sx={{ 
              p: 2, 
              borderRadius: 4, 
              bgcolor: alpha(item.color, 0.1), 
              color: item.color,
              display: 'flex',
              transition: 'inherit'
            }}>
              {item.icon}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {item.label}
            </Typography>
          </Button>
        ))}
      </Stack>

      <Box sx={{ mt: 8, opacity: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ITNET Management System 1.0 Beta
        </Typography>
      </Box>
    </Box>
  );
}
