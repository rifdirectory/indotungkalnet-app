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
  Settings as SettingsIcon,
  ShoppingCart as SalesIcon
} from '@mui/icons-material';
import { Collapse } from '@mui/material';

const drawerWidth = 260;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  disabled?: boolean;
  info?: string;
  subItems?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { key: "dashboard", icon: <DashboardIcon />, label: "Dashboard", href: "/" },
  { key: "customers", icon: <PeopleIcon />, label: "Data Customer", href: "/customers" },
  { 
    key: "products",
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
  { 
    key: "finance",
    icon: <FinanceIcon />, 
    label: "Keuangan", 
    href: "/finance",
    subItems: [
      { label: "Dashboard", href: "/finance" },
      { label: "Kas & Bank", href: "/finance/banks" },
      { label: "Transaksi", href: "/finance/transactions" },
      { label: "Hutang & Piutang", href: "/finance/debts" },
      { label: "Daftar Akun (COA)", href: "/finance/coa" },
      { label: "Kategori", href: "/finance/categories" },
      { label: "Laporan Keuangan", href: "/reports/finance" },
    ]
  },
  { 
    key: "sales",
    icon: <SalesIcon />, 
    label: "Penjualan", 
    href: "/inventory/pos",
    subItems: [
      { label: "POS Kasir", href: "/inventory/pos" },
      { label: "List Penjualan", href: "/inventory?view=invoices" },
    ]
  },
  { 
    key: "inventory",
    icon: <InventoryIcon />, 
    label: "Inventory", 
    href: "/inventory",
    subItems: [
      { label: "Stok Barang", href: "/inventory?view=stock" },
      { label: "Aset di Pelanggan", href: "/inventory?view=assets" },
      { label: "Customer Logistik", href: "/inventory/customers" },
      { label: "Master Logistik", href: "/inventory/master" },
      { label: "Pergerakan Stok", href: "/reports/inventory-movements" },
    ]
  },
  { 
    key: "employees",
    icon: <BadgeIcon />, 
    label: "Data Pegawai", 
    href: "/employees",
    subItems: [
      { label: "Jabatan", href: "/positions" },
      { label: "Data Pegawai", href: "/employees" },
    ]
  },
  { 
    key: "reports",
    icon: <AnalyticsIcon />, 
    label: "Laporan", 
    href: "#",
    subItems: [
      { label: "KPI Pegawai", href: "/performance" },
      { label: "Laporan Absensi", href: "/reports/attendance" },
      { label: "Laporan Keuangan", href: "/reports/finance" },
      { label: "Valuasi Perusahaan", href: "/reports/valuation" },
    ]
  },
  { key: "maintenance", icon: <MaintenanceIcon />, label: "Maintenance", href: "/maintenance" },
  { key: "support", icon: <TicketIcon />, label: "Layanan Pelanggan", href: "/support" },
  { key: "presence", icon: <PresenceIcon />, label: "Presensi", href: "/presence", 
    subItems: [
      { label: "Aturan Shift", href: "/presence/shifts" },
      { label: "Jadwal Shift", href: "/presence/schedule" },
      { label: "Permohonan Izin", href: "/presence/leave" },
      { label: "Penugasan Lembur", href: "/presence/overtime" },
      { label: "Data Presensi", href: "/presence/history" },
    ]
  },
  { key: "notifications", icon: <BadgeIcon />, label: "Kirim Notifikasi", href: "/notifications" },
  { 
    key: "settings", 
    icon: <SettingsIcon />, 
    label: "Settings", 
    href: "/settings",
    subItems: [
      { label: "Pengaturan Umum", href: "/settings" },
      { label: "Hak Akses Menu", href: "/settings/permissions" },
      { label: "Audit Logs", href: "/settings/audit-logs" },
    ]
  },
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
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    // Always redirect, even if API fails
    window.location.href = '/login';
  };

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});
  // Fallback: Default to showing all keys if fetch fails to keep app usable
  const [allowedKeys, setAllowedKeys] = React.useState<string[]>(menuItems.map(i => i.key).concat(['settings']));
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Import server actions dynamically to ensure they run only on client mount
    const fetchAccess = async () => {
      try {
        const { getUserSessionAction, getMenuPermissionsAction } = await import('@/actions/permissions');
        
        // 1. Get current session info via Server Action
        const meData = await getUserSessionAction();
        if (!meData.success || !meData.user) return;
        
        const role = meData.user.role;
        const userId = meData.user.userId;
        setUserRole(role);

        // 2. Fetch permissions for this role and specific user
        const rolePermData = await getMenuPermissionsAction(role);
        const userPermData = userId ? await getMenuPermissionsAction(undefined, userId) : { success: true, permissions: [] };
        
        if (role === 'admin') {
          setAllowedKeys(menuItems.map(i => i.key));
        } else {
          // Merge logic: Default all to enabled, then apply Role overrides, then User overrides
          const perms: Record<string, number> = {};
          
          // 1. Initialize all as enabled (1)
          menuItems.forEach(item => {
            perms[item.key] = 1;
          });
          
          // 2. Role perms override
          if (rolePermData.success && rolePermData.permissions && rolePermData.permissions.length > 0) {
            rolePermData.permissions.forEach((p: any) => {
              if (p.platform === 'web') perms[p.menu_key] = p.is_enabled;
            });
          }
          
          // 3. User perms override
          if (userPermData.success && userPermData.permissions && userPermData.permissions.length > 0) {
            userPermData.permissions.forEach((p: any) => {
              if (p.platform === 'web') perms[p.menu_key] = p.is_enabled;
            });
          }

          const enabled = Object.keys(perms).filter(key => perms[key] === 1);
          setAllowedKeys(enabled);
        }
      } catch (err) {
        console.error('[Sidebar] Action failed:', err);
      }
    };

    if (mounted) {
      fetchAccess();
    }
  }, [mounted]);

  // Auto-expand parent menu on mount or pathname change
  React.useEffect(() => {
    if (mounted) {
      const activeParent = menuItems.find(item => 
        item.subItems?.some(sub => {
          const subPath = sub.href.split('?')[0];
          return pathname === subPath || pathname.startsWith(subPath + '/');
        })
      );
      
      if (activeParent) {
        setOpenMenus(prev => ({ 
          ...prev, 
          [activeParent.label]: true 
        }));
      }
    }
  }, [mounted, pathname]);

  const handleMenuClick = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  if (!mounted) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 700 }}>ITNET</Typography>
            <Typography variant="caption" color="text.secondary">ISP Management</Typography>
          </Box>
        </Box>
        <List sx={{ flexGrow: 1, px: 2 }} />
      </Box>
    );
  }

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


      <List sx={{ flexGrow: 1, px: 2 }} suppressHydrationWarning>
        {menuItems.filter(item => allowedKeys.includes(item.key)).map((item) => {
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
