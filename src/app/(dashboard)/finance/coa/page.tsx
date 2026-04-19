'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, alpha, useTheme, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Snackbar, Alert, CircularProgress, InputBase, Switch, FormControlLabel
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  AccountBalance as AccountIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as RevenueIcon,
  TrendingDown as ExpenseIcon,
  Business as EquityIcon
} from "@mui/icons-material";
import Portal from '@/components/Portal';

const GROUPS = [
  { value: 'asset', label: 'Aset', color: '#3b82f6', icon: <WalletIcon /> },
  { value: 'liability', label: 'Kewajiban', color: '#ef4444', icon: <AccountIcon /> },
  { value: 'equity', label: 'Modal', color: '#8b5cf6', icon: <EquityIcon /> },
  { value: 'revenue', label: 'Pendapatan', color: '#10b981', icon: <RevenueIcon /> },
  { value: 'expense', label: 'Beban', color: '#f59e0b', icon: <ExpenseIcon /> },
];

const GROUP_TYPES: Record<string, string[]> = {
  asset: ['Aset Lancar', 'Aset Tetap'],
  liability: ['Kewajiban'],
  equity: ['Modal'],
  revenue: ['Pendapatan Usaha'],
  expense: ['Beban Usaha'],
};

const formatGroup = (g: string) => GROUPS.find(gr => gr.value === g);

export default function ChartOfAccountsPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState<any>({ open: false, message: '', type: 'success' });

  const emptyForm = {
    id: null, code: '', name: '', account_group: 'asset',
    account_type: 'Aset Lancar', description: '', normal_balance: 'debit', is_active: 1
  };
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finances/coa');
      const data = await res.json();
      if (data.success) setAccounts(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData(emptyForm);
    setOpenDialog(true);
  };

  const handleOpenEdit = (acct: any) => {
    setEditMode(true);
    setFormData({
      id: acct.id,
      code: acct.code,
      name: acct.name,
      account_group: acct.account_group,
      account_type: acct.account_type || '',
      description: acct.description || '',
      normal_balance: acct.normal_balance,
      is_active: acct.is_active
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      setSnackbar({ open: true, message: 'Kode dan Nama akun wajib diisi.', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/finances/coa', {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({ open: true, message: data.message, type: 'success' });
        setOpenDialog(false);
        fetchData();
      } else {
        setSnackbar({ open: true, message: data.message, type: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message, type: 'error' });
    }
  };

  const filtered = accounts.filter(a => {
    const matchSearch = a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = filterGroup === 'all' || a.account_group === filterGroup;
    return matchSearch && matchGroup;
  });

  // Group accounts by account_group
  const grouped: Record<string, any[]> = {};
  filtered.forEach(a => {
    if (!grouped[a.account_group]) grouped[a.account_group] = [];
    grouped[a.account_group].push(a);
  });

  const groupOrder = ['asset', 'liability', 'equity', 'revenue', 'expense'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Portal container={typeof document !== 'undefined' ? document.getElementById('header-actions-portal') : null}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}
          sx={{ borderRadius: 2, fontWeight: 700, py: 0.5 }} size="small">
          Tambah Akun
        </Button>
      </Portal>

      {/* Summary Chips */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label={`Semua (${accounts.length})`}
          onClick={() => setFilterGroup('all')}
          variant={filterGroup === 'all' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        />
        {GROUPS.map(g => {
          const cnt = accounts.filter(a => a.account_group === g.value).length;
          return (
            <Chip
              key={g.value}
              label={`${g.label} (${cnt})`}
              onClick={() => setFilterGroup(g.value)}
              variant={filterGroup === g.value ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700, borderRadius: 2,
                ...(filterGroup === g.value ? { bgcolor: alpha(g.color, 0.15), color: g.color, borderColor: g.color } : {})
              }}
            />
          );
        })}
      </Stack>

      {/* Search */}
      <Box sx={{
        display: 'flex', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.03),
        px: 2, py: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3, maxWidth: 400
      }}>
        <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
        <InputBase
          placeholder="Cari kode atau nama akun..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ fontSize: '0.875rem', width: '100%' }}
        />
      </Box>

      {/* Grouped Table */}
      {groupOrder.filter(g => grouped[g]).map(g => {
        const gInfo = formatGroup(g)!;
        return (
          <Card key={g} sx={{ mb: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, bgcolor: alpha(gInfo.color, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(gInfo.color, 0.12), color: gInfo.color, width: 32, height: 32, borderRadius: 2 }}>
                  {React.cloneElement(gInfo.icon, { sx: { fontSize: 18 } })}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{gInfo.label}</Typography>
                <Chip label={`${grouped[g].length} akun`} size="small" sx={{ fontWeight: 700, borderRadius: 1.5, height: 22, fontSize: '0.65rem' }} />
              </Stack>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(gInfo.color, 0.02) }}>
                    <TableCell sx={{ fontWeight: 800, width: 100, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>Kode</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>Nama Akun</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 150, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>Tipe</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 100, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>Saldo Normal</TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 60, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>Status</TableCell>
                    <TableCell sx={{ width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grouped[g].map((acct: any) => (
                    <TableRow key={acct.id} hover sx={{ opacity: acct.is_active ? 1 : 0.5 }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: gInfo.color }}>
                          {acct.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{acct.name}</Typography>
                        {acct.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                            {acct.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {acct.account_type || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={acct.normal_balance === 'debit' ? 'Debit' : 'Kredit'}
                          size="small"
                          sx={{
                            fontWeight: 800, borderRadius: 1.5, height: 22, fontSize: '0.6rem',
                            bgcolor: alpha(acct.normal_balance === 'debit' ? '#3b82f6' : '#10b981', 0.1),
                            color: acct.normal_balance === 'debit' ? '#3b82f6' : '#10b981'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: acct.is_active ? 'success.main' : 'text.disabled' }} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenEdit(acct)}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        );
      })}

      {filtered.length === 0 && !loading && (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography color="text.secondary">Tidak ada akun yang cocok.</Typography>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editMode ? 'Edit Akun' : 'Tambah Akun Baru'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Kode Akun"
                fullWidth
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Contoh: 5-2500"
                sx={{ flex: 1 }}
              />
              <TextField
                select
                label="Saldo Normal"
                value={formData.normal_balance}
                onChange={(e) => setFormData({ ...formData, normal_balance: e.target.value })}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="debit">Debit</MenuItem>
                <MenuItem value="credit">Kredit</MenuItem>
              </TextField>
            </Stack>

            <TextField
              label="Nama Akun"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Biaya Transportasi"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Grup Akun"
                fullWidth
                value={formData.account_group}
                onChange={(e) => {
                  const g = e.target.value;
                  const types = GROUP_TYPES[g] || [];
                  setFormData({
                    ...formData,
                    account_group: g,
                    account_type: types[0] || '',
                    normal_balance: ['asset', 'expense'].includes(g) ? 'debit' : 'credit'
                  });
                }}
              >
                {GROUPS.map(g => (
                  <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Tipe"
                fullWidth
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
              >
                {(GROUP_TYPES[formData.account_group] || []).map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Keterangan"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {editMode && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  />
                }
                label="Akun Aktif"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Batal</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
            {editMode ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.type} variant="filled" sx={{ fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
