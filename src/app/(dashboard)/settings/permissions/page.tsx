'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Grid, 
  Divider, Alert, Snackbar, CircularProgress, alpha,
  FormControl, InputLabel, Select, MenuItem,
  Switch, Paper,
  Breadcrumbs,
  useTheme
} from "@mui/material";
import { 
  Security as SecurityIcon, 
  Devices as DevicesIcon,
  Language as WebIcon,
  PhoneIphone as MobileIcon,
  ArrowBack as BackIcon,
  ChevronRight as ChevronRightIcon
} from "@mui/icons-material";
import Link from 'next/link';

// Import our new server actions
import { 
  getRolesAction, 
  getEmployeesAction,
  getMenuPermissionsAction, 
  updateMenuPermissionAction,
} from '@/actions/permissions';

import { STANDARD_MENUS } from '@/lib/constants';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export default function MenuPermissionsPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'role' | 'employee'>('role');
  const [roles, setRoles] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [permissions, setPermissions] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: 'success', text: '', open: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Roles & Employees
      const [roleRes, empRes] = await Promise.all([
        getRolesAction(),
        getEmployeesAction()
      ]);

      if (roleRes.success && roleRes.roles) {
        setRoles(roleRes.roles);
        if (roleRes.roles.length > 0) setSelectedRole(roleRes.roles[0]);
      }

      if (empRes.success && empRes.employees) {
        setEmployees(empRes.employees);
      }

      // 2. Initial Permissions fetch
      const permRes = await getMenuPermissionsAction(roleRes.roles?.[0]);
      if (permRes.success && permRes.permissions) {
        setPermissions(permRes.permissions);
      }
    } catch (error) {
      console.error('Failed to fetch permissions data:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data izin', open: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch permissions when selection changes
  useEffect(() => {
    const fetchSpecificPermissions = async () => {
      if (mode === 'role' && selectedRole) {
        const res = await getMenuPermissionsAction(selectedRole);
        if (res.success) setPermissions(res.permissions || []);
      } else if (mode === 'employee' && selectedEmployeeId) {
        const res = await getMenuPermissionsAction(undefined, selectedEmployeeId as number);
        if (res.success) setPermissions(res.permissions || []);
      } else if (mode === 'employee' && !selectedEmployeeId) {
        setPermissions([]);
      }
    };
    fetchSpecificPermissions();
  }, [mode, selectedRole, selectedEmployeeId]);

  const handleToggle = async (platform: 'web' | 'mobile', menuKey: string, currentEnabled: boolean) => {
    if (mode === 'employee' && !selectedEmployeeId) {
      setMessage({ type: 'warning', text: 'Silakan pilih pegawai terlebih dahulu', open: true });
      return;
    }

    // Admin role cannot be modified
    if (mode === 'role' && selectedRole === 'admin') {
      return;
    }

    try {
      const target = mode === 'role' ? { role: selectedRole } : { employeeId: selectedEmployeeId as number };
      const res = await updateMenuPermissionAction(
        target,
        platform,
        menuKey,
        !currentEnabled
      );

      if (res.success) {
        // Optimistic UI update
        setPermissions(prev => {
          const match = (p: any) => 
            p.platform === platform && 
            p.menu_key === menuKey &&
            (mode === 'role' ? p.role_name === selectedRole : p.employee_id === selectedEmployeeId);
            
          const index = prev.findIndex(match);
          if (index > -1) {
            const newPerms = [...prev];
            newPerms[index] = { ...newPerms[index], is_enabled: !currentEnabled ? 1 : 0 };
            return newPerms;
          } else {
            return [...prev, { 
              role_name: mode === 'role' ? selectedRole : null, 
              employee_id: mode === 'employee' ? selectedEmployeeId : null,
              platform, 
              menu_key: menuKey, 
              is_enabled: !currentEnabled ? 1 : 0 
            }];
          }
        });
      } else {
        setMessage({ type: 'error', text: res.message || 'Gagal memperbarui izin', open: true });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem', open: true });
    }
  };

  const isMenuEnabled = (platform: 'web' | 'mobile', menuKey: string) => {
    // Admin role always has all menus enabled
    if (mode === 'role' && selectedRole === 'admin') return true;
    
    const perm = permissions.find(p => p.platform === platform && p.menu_key === menuKey);
    // Allow everything by default if no database mapping exists
    return perm ? perm.is_enabled === 1 : true;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2, pb: 10 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<ChevronRightIcon sx={{ fontSize: 16 }} />} 
        sx={{ mb: 3 }}
      >
        <Link href="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>Settings</Typography>
        </Link>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>Hak Akses Menu</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: '-0.02em' }}>
            Hak Akses Menu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kelola visibilitas menu navigasi berdasarkan Jabatan atau override khusus per Pegawai.
          </Typography>
        </Box>
        <Button 
          component={Link}
          href="/settings"
          variant="outlined"
          startIcon={<BackIcon />}
          sx={{ borderRadius: 3, px: 3 }}
        >
          Kembali
        </Button>
      </Stack>

      {/* Selector Card */}
      <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 4 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>
                  TIPE PENGATURAN
                </Typography>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, val) => val && setMode(val)}
                  fullWidth
                  size="small"
                  color="primary"
                >
                  <ToggleButton value="role" sx={{ py: 1.5, fontWeight: 700 }}>BERDASARKAN JABATAN</ToggleButton>
                  <ToggleButton value="employee" sx={{ py: 1.5, fontWeight: 700 }}>PER PEGAWAI (OVERRIDE)</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {mode === 'role' ? (
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Pilih Jabatan / Role</InputLabel>
                  <Select
                    value={selectedRole}
                    label="Pilih Jabatan / Role"
                    onChange={(e) => setSelectedRole(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    {roles.map(role => (
                      <MenuItem key={role} value={role}>{role.toUpperCase()}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Pilih Nama Pegawai</InputLabel>
                  <Select
                    value={selectedEmployeeId}
                    label="Pilih Nama Pegawai"
                    onChange={(e) => setSelectedEmployeeId(e.target.value as number)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value=""><em>-- Pilih Pegawai --</em></MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.position_name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} md={7}>
            {mode === 'employee' ? (
              <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3 }}>
                <strong>Pengaturan Pegawai</strong> akan menimpa (override) pengaturan jabatan. Jika pegawai tidak memiliki pengaturan khusus, sistem akan menggunakan pengaturan dari jabatannya.
              </Alert>
            ) : (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
                Pengaturan berdasarkan <strong>Jabatan</strong> berlaku untuk semua pegawai yang memiliki jabatan tersebut, kecuali jika pegawai tersebut memiliki pengaturan override individu.
              </Alert>
            )}
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={4}>
        {/* WEB MENUS */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#0a84ff', 0.1) }}>
                <WebIcon sx={{ color: '#0a84ff' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Menu Web Dashboard</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={0.5}>
              {STANDARD_MENUS.web.map(menu => (
                <Box 
                  key={menu.key} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    p: 1.5, 
                    borderRadius: 2,
                    bgcolor: isMenuEnabled('web', menu.key) ? 'transparent' : alpha(theme.palette.error.main, 0.02),
                    '&:hover': { bgcolor: alpha('#000', 0.02) }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{menu.label}</Typography>
                  <Switch 
                    checked={isMenuEnabled('web', menu.key)}
                    onChange={() => handleToggle('web', menu.key, isMenuEnabled('web', menu.key))}
                    color="primary"
                    disabled={mode === 'role' && selectedRole === 'admin'}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* MOBILE MENUS */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#16a34a', 0.1) }}>
                <MobileIcon sx={{ color: '#16a34a' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Menu Mobile App</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={0.5}>
              {STANDARD_MENUS.mobile.map(menu => (
                <Box 
                  key={menu.key} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    p: 1.5, 
                    borderRadius: 2,
                    bgcolor: isMenuEnabled('mobile', menu.key) ? 'transparent' : alpha(theme.palette.error.main, 0.02),
                    '&:hover': { bgcolor: alpha('#000', 0.02) }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{menu.label}</Typography>
                  <Switch 
                    checked={isMenuEnabled('mobile', menu.key)}
                    onChange={() => handleToggle('mobile', menu.key, isMenuEnabled('mobile', menu.key))}
                    color="success"
                    disabled={mode === 'role' && selectedRole === 'admin'}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar 
        open={message.open} 
        autoHideDuration={4000} 
        onClose={() => setMessage({ ...message, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={message.type as any} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}
