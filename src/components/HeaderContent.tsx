'use client';

import * as React from 'react';
import { 
  Box,
  InputBase,
  IconButton,
  Badge,
  Avatar,
  Typography, 
  Stack,
  alpha,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { usePathname, useSearchParams } from 'next/navigation';
import { getUserSessionAction } from '@/actions/permissions';
import { 
  Search as SearchIcon, 
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Inventory as InventoryIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountBalanceWallet as FinanceIcon,
  Badge as StaffIcon,
  FactCheck as PresenceIcon,
  Settings as SettingsIcon,
  BarChart as ReportIcon,
  ConfirmationNumber as TicketIcon,
  Handyman as MaintenanceIcon,
  Category as CategoryIcon,
  ReceiptLong as TrxIcon,
  AccountBalance as BankIcon,
  Business as WarehouseIcon,
  History as HistoryIcon,
  SyncAlt as MovementIcon,
  Assignment as TaskIcon,
  TrendingDown as ChurnIcon
} from '@mui/icons-material';

interface HeaderContentProps {
  onLogout?: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; icon: React.ReactNode; color: string }> = {
  '/': { title: 'Dashboard Overview', icon: <DashboardIcon />, color: 'primary' },
  '/customers': { title: 'Data Customer', icon: <PeopleIcon />, color: 'primary' },
  '/products': { title: 'Katalog Produk', icon: <InventoryIcon />, color: 'primary' },
  '/finance': { title: 'Dashboard Keuangan', icon: <FinanceIcon />, color: 'success' },
  '/finance/banks': { title: 'Manajemen Kas & Bank', icon: <BankIcon />, color: 'success' },
  '/finance/transactions': { title: 'Riwayat Transaksi', icon: <TrxIcon />, color: 'success' },
  '/finance/debts': { title: 'Hutang & Piutang', icon: <BankIcon />, color: 'warning' },
  '/finance/coa': { title: 'Daftar Akun (COA)', icon: <BankIcon />, color: 'success' },
  '/finance/categories': { title: 'Kategori Keuangan', icon: <CategoryIcon />, color: 'success' },
  '/inventory': { title: 'Stok Barang', icon: <InventoryIcon />, color: 'primary' },
  '/inventory/customers': { title: 'Customer Logistik', icon: <PeopleIcon />, color: 'primary' },
  '/inventory/master': { title: 'Master Data Logistik', icon: <WarehouseIcon />, color: 'primary' },
  '/employees': { title: 'Data Pegawai', icon: <StaffIcon />, color: 'info' },
  '/positions': { title: 'Manajemen Jabatan', icon: <StaffIcon />, color: 'info' },
  '/performance': { title: 'KPI & Performa', icon: <ReportIcon />, color: 'info' },
  '/support': { title: 'Support Tiketing', icon: <TicketIcon />, color: 'error' },
  '/maintenance': { title: 'Maintenance Lapangan', icon: <MaintenanceIcon />, color: 'warning' },
  '/presence': { title: 'Dashboard Presensi', icon: <PresenceIcon />, color: 'info' },
  '/presence/shifts': { title: 'Aturan Shift', icon: <HistoryIcon />, color: 'info' },
  '/presence/schedule': { title: 'Jadwal Shift', icon: <PresenceIcon />, color: 'info' },
  '/presence/leave': { title: 'Permohonan Izin', icon: <StaffIcon />, color: 'warning' },
  '/presence/overtime': { title: 'Penugasan Lembur', icon: <HistoryIcon />, color: 'info' },
  '/presence/history': { title: 'Data Presensi', icon: <PresenceIcon />, color: 'info' },
  '/settings': { title: 'Settings & Konfigurasi', icon: <SettingsIcon />, color: 'primary' },
  '/reports/attendance': { title: 'Laporan Absensi', icon: <ReportIcon />, color: 'secondary' },
  '/reports/finance': { title: 'Laporan Keuangan', icon: <ReportIcon />, color: 'success' },
  '/reports/inventory-sales': { title: 'Laporan Penjualan', icon: <ReportIcon />, color: 'primary' },
  '/reports/inventory-movements': { title: 'Pergerakan Stok', icon: <MovementIcon />, color: 'primary' },
  '/reports/churn': { title: 'Analisis Churn Pelanggan', icon: <ChurnIcon />, color: 'error' },
  '/reports/efficiency': { title: 'Efisiensi Lapangan', icon: <ReportIcon />, color: 'warning' },
  '/notifications': { title: 'Kirim Notifikasi', icon: <NotificationsIcon />, color: 'warning' },
  '/analytics': { title: 'ERP & Analytics', icon: <ReportIcon />, color: 'primary' },
  '/tasks': { title: 'Manajemen Tugas', icon: <TaskIcon />, color: 'warning' },
  '/inventory/pos': { title: 'POS ITNet', icon: <WarehouseIcon />, color: 'primary' },
};

export default function HeaderContent({ onLogout }: HeaderContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const [user, setUser] = React.useState<any>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleCloseUserMenu();
    if (onLogout) onLogout();
  };

  React.useEffect(() => {
    const fetchUser = async () => {
      const res = await getUserSessionAction();
      if (res.success) setUser(res.user);
    };
    fetchUser();
  }, []);

  const view = searchParams.get('view');

  // Find matching route or fallback
  let currentRoute = ROUTE_TITLES[pathname] || ROUTE_TITLES['/'];

  // Dynamic overrides for Inventory views
  if (pathname === '/inventory') {
    if (view === 'invoices') {
      currentRoute = { title: 'Invoice POS', icon: <TrxIcon />, color: 'primary' };
    } else if (view === 'billing') {
      currentRoute = { title: 'Tagihan Bulanan', icon: <HistoryIcon />, color: 'primary' };
    } else if (view === 'assets') {
      currentRoute = { title: 'Aset di Pelanggan', icon: <WarehouseIcon />, color: 'primary' };
    } else if (view === 'stock') {
      currentRoute = { title: 'Stok Barang', icon: <InventoryIcon />, color: 'primary' };
    }
  }

  const color = (theme.palette as any)[currentRoute.color]?.main || theme.palette.primary.main;

  return (
    <>
      {/* Dynamic Header Center: Title Display (Replacing Global Search) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          bgcolor: alpha(color, 0.1), 
          p: 1, 
          borderRadius: 2, 
          display: 'flex', 
          alignItems: 'center',
          color: color
        }}>
          {React.cloneElement(currentRoute.icon as React.ReactElement, { sx: { fontSize: 24 } })}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: 'text.primary' }}>
          {currentRoute.title}
        </Typography>
      </Box>

      {/* Portal Target for Page Actions */}
      <Box id="header-actions-portal" sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', px: { xs: 1, md: 3 } }} />

      {/* Right Actions */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
        <IconButton color="inherit" sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 2 }}>
          <Badge badgeContent={3} color="primary" variant="dot">
            <NotificationsIcon sx={{ color: 'text.secondary' }} />
          </Badge>
        </IconButton>

        <Box sx={{ width: '1px', height: 32, bgcolor: 'divider', mx: 2 }} />

        <Stack 
          direction="row" 
          spacing={1.5} 
          alignItems="center" 
          onClick={handleOpenUserMenu}
          sx={{ 
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 3,
            bgcolor: Boolean(anchorEl) ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
            transition: 'all 0.2s',
            border: '1px solid',
            borderColor: Boolean(anchorEl) ? 'divider' : 'transparent',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              borderColor: 'divider'
            }
          }}
        >
          <Stack spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, alignItems: 'flex-end' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {user?.username === 'admin' ? 'Administrator' : (user?.username || 'Loading...')}
            </Typography>
          </Stack>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              borderRadius: 3,
              bgcolor: 'primary.main',
            }}
          >
            <PersonIcon sx={{ fontSize: 20 }} />
          </Avatar>
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseUserMenu}
          onClick={handleCloseUserMenu}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              borderRadius: 3,
              minWidth: 180,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.username}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role || 'authorized user'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleCloseUserMenu} sx={{ py: 1, borderRadius: 2, mx: 1, mt: 0.5 }}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profil Saya" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
          </MenuItem>
          <MenuItem onClick={handleLogoutClick} sx={{ py: 1, borderRadius: 2, mx: 1, mb: 0.5, color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
          </MenuItem>
        </Menu>
      </Stack>
    </>
  );
}
