'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Divider, 
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Stack,
  Chip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  AccountBalanceWallet as FinanceIcon, 
  Inventory as InventoryIcon, 
  Handyman as MaintenanceIcon, 
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  SubdirectoryArrowRight as SubIcon,
  Badge as BadgeIcon,
  ConfirmationNumber as TicketIcon,
  AccessTime as AttendanceIcon,
  EventNote as ScheduleIcon,
  FactCheck as PresenceIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Collapse } from '@mui/material';

const drawerWidth = 260;

const menuItems = [
  { icon: <DashboardIcon />, label: "Dashboard", href: "/" },
  { icon: <PeopleIcon />, label: "Data Customer", href: "/customers" },
  { 
    icon: <InventoryIcon />, 
    label: "Data Produk", 
    href: "/products",
    subItems: [
      { label: "Broadband", href: "/products?category=broadband" },
      { label: "Enterprise", href: "/products?category=enterprise" },
      { label: "Mitra", href: "/products?category=mitra" },
      { label: "Operator", href: "/products?category=operator" },
    ]
  },
  { icon: <FinanceIcon />, label: "Laporan Keuangan", href: "#", disabled: true },
  { icon: <InventoryIcon />, label: "Inventory", href: "/inventory" },
  { 
    icon: <BadgeIcon />, 
    label: "Data Pegawai", 
    href: "/employees",
    subItems: [
      { label: "Jabatan", href: "/positions" },
      { label: "Data Pegawai", href: "/employees" },
    ]
  },
  { icon: <MaintenanceIcon />, label: "Maintenance", href: "/maintenance" },
  { icon: <TicketIcon />, label: "Tiketing", href: "/support" },
  { 
    icon: <PresenceIcon />, 
    label: "Presensi", 
    href: "/presence",
    subItems: [
      { label: "Aturan Shift", href: "/presence/shifts" },
      { label: "Jadwal Shift", href: "/presence/schedule" },
      { label: "Data Presensi", href: "/presence/history" },
    ]
  },
  { icon: <AnalyticsIcon />, label: "ERP/Analytics", href: "/analytics" },
];

function SidebarContent() {
  const theme = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const fullPath = pathname + (currentQuery ? `?${currentQuery}` : '');

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Use window.location.href to fully clear state and trigger middleware
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.subItems) initialState[item.label] = true;
    });
    return initialState;
  });

  // Keep searchParams/fullPath logic for selection, but don't force openMenus update unless we want it 
  // actually, the user said "biarkan tetap terbuka", so initializing all to true is best.
  // We'll remove the useEffect that overrides user choice.

  const handleMenuClick = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          width: 40, 
          height: 40, 
          borderRadius: 3, 
          bgcolor: 'primary.main', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.25rem',
          color: 'white'
        }}>
          IT
        </Box>
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 700 }}>ITNET</Typography>
          <Typography variant="caption" color="text.secondary">ISP Management</Typography>
        </Box>
      </Box>


      <List sx={{ flexGrow: 1, px: 2 }}>
        {menuItems.map((item) => {
          const hasSubItems = !!item.subItems;
          const isOpen = mounted ? openMenus[item.label] : (item.label === "Data Produk");
          const isSelected = mounted ? (pathname === item.href || (item.subItems?.some(sub => fullPath === sub.href))) : (pathname === item.href);

          return (
            <React.Fragment key={item.label}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={hasSubItems ? 'div' : Link}
                  href={hasSubItems ? undefined : item.href}
                  onClick={hasSubItems ? () => handleMenuClick(item.label) : undefined}
                  disabled={item.disabled}
                  sx={{
                    borderRadius: 3,
                    mx: 1,
                    py: 1,
                    mb: 0.5,
                    opacity: item.disabled ? 0.5 : 1,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' },
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                    },
                    '&:hover': {
                      bgcolor: item.disabled ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 500, fontSize: '0.9rem' }}>
                          {item.label}
                        </Typography>
                        {item.disabled && (
                          <Chip label="Pengerjaan" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(0,0,0,0.05)' }} />
                        )}
                      </Stack>
                    }
                  />
                  {hasSubItems ? (isOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />) : null}
                </ListItemButton>
              </ListItem>

              {hasSubItems && (
                <li style={{ listStyle: 'none' }}>
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 3 }}>
                      {item.subItems?.map((sub) => (
                        <ListItemButton
                          key={sub.href}
                          component={Link}
                          href={sub.href}
                          selected={mounted && fullPath === sub.href}
                          sx={{
                            borderRadius: 3,
                            mx: 1,
                            py: 0.5,
                            mb: 0.5,
                            '&.Mui-selected': {
                              bgcolor: 'transparent',
                              color: 'primary.main',
                              fontWeight: 700,
                              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                             <SubIcon sx={{ fontSize: 14, color: 'divider' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={sub.label} 
                            primaryTypographyProps={{ 
                              fontSize: '0.85rem',
                              fontWeight: 500
                            }} 
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </li>
              )}
            </React.Fragment>
          );
        })}
      </List>

      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <List disablePadding>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton sx={{ borderRadius: 3, py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={handleLogout}
              sx={{ 
                borderRadius: 3, 
                py: 1.5, 
                color: 'error.main',
                '& .MuiListItemIcon-root': { color: 'error.main' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ 
          display: { md: 'none' }, 
          position: 'fixed', 
          top: 16, 
          left: 16, 
          zIndex: 1200,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        <MenuIcon />
      </IconButton>
    </Box>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<Box sx={{ width: 260, height: '100vh', borderRight: '1px solid', borderColor: 'divider' }} />}>
      <SidebarContent />
    </Suspense>
  );
}
