'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  alpha,
  useTheme,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Menu,
  Switch,
  FormControlLabel,
  Divider,
  Snackbar,
  Alert,
  Autocomplete
} from "@mui/material";
import { 
  Add as AddIcon,
  FilterList as FilterIcon,
  ArrowBack as BackIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import Link from 'next/link';
import Portal from '@/components/Portal';

export default function TransactionsPage() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [confirmVoid, setConfirmVoid] = useState<any>(null);

  // Filter State
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'month' | 'custom' | 'all'>('month');
  const [customRange, setCustomRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [openCustomDialog, setOpenCustomDialog] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    trx_date: new Date().toISOString().split('T')[0],
    type: 'income',
    category_id: '',
    account_id: '1', // Default to Kas (ID: 1)
    amount: '',
    notes: '',
    linkInventory: false,
    inventory_item_id: '',
    inventory_qty: 1
  });

  useEffect(() => {
    fetchData();
  }, [dateFilter, customRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/finances?';
      
      const now = new Date();
      if (dateFilter === 'today') {
        const today = now.toISOString().split('T')[0];
        url += `startDate=${today}&endDate=${today}`;
      } else if (dateFilter === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        url += `startDate=${firstDay}&endDate=${lastDay}`;
      } else if (dateFilter === 'custom') {
        url += `startDate=${customRange.start}&endDate=${customRange.end}`;
      }

      const [txRes, catRes, accRes, invRes] = await Promise.all([
        fetch(url),
        fetch('/api/finances/categories'),
        fetch('/api/finances/banks'),
        fetch('/api/inventory')
      ]);
      
      const txData = await txRes.json();
      const catData = await catRes.json();
      const accData = await accRes.json();
      const invData = await invRes.json();
      
      if(txData.success) setTransactions(txData.data);
      if(catData.success) setCategories(catData.data);
      if(accData.success) setAccounts(accData.data);
      if(invData.success) setInventoryItems(invData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    // FIX [K-2]: Client-side validation before submitting
    if (!formData.category_id) {
      setSnackbar({ open: true, message: 'Kategori wajib dipilih.', type: 'error' });
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setSnackbar({ open: true, message: 'Jumlah transaksi harus lebih dari Rp 0.', type: 'error' });
      return;
    }
    if (new Date(formData.trx_date) > new Date()) {
      setSnackbar({ open: true, message: 'Tanggal transaksi tidak boleh di masa depan.', type: 'error' });
      return;
    }
    if (!formData.account_id) {
      setSnackbar({ open: true, message: 'Pilih rekening Kas/Bank.', type: 'error' });
      return;
    }
    if (formData.linkInventory && !formData.inventory_item_id) {
      setSnackbar({ open: true, message: 'Pilih barang gudang terlebih dahulu.', type: 'error' });
      return;
    }
    if (formData.linkInventory && Number(formData.inventory_qty) <= 0) {
      setSnackbar({ open: true, message: 'Jumlah unit harus lebih dari 0.', type: 'error' });
      return;
    }

    try {
      const payload = {
        ...formData,
        inventory_item_id: formData.linkInventory ? formData.inventory_item_id : null,
        inventory_qty: formData.linkInventory ? formData.inventory_qty : null
      };

      const res = await fetch('/api/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(data.success) {
        setSnackbar({ open: true, message: 'Transaksi berhasil disimpan' + (formData.linkInventory ? ' & stok gudang diperbarui' : ''), type: 'success' });
        setOpenAdd(false);
        fetchData();
        setFormData({
            trx_date: new Date().toISOString().split('T')[0],
            type: 'income',
            category_id: '',
            account_id: '1',
            amount: '',
            notes: '',
            linkInventory: false,
            inventory_item_id: '',
            inventory_qty: 1
        });
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Gagal menyimpan transaksi.', type: 'error' });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleVoid = async (tx: any) => {
    setVoidingId(tx.id);
    try {
      // FIX [P-7]: Ambil username dari localStorage/session, bukan hardcode 'Admin'
      const currentUser = (typeof window !== 'undefined' && localStorage.getItem('username')) || localStorage.getItem('user_name') || 'Admin';
      const res = await fetch('/api/finances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tx.id, action: 'void', user: currentUser })
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({ open: true, message: `Transaksi ${tx.voucher_number || 'TRX-' + tx.id} berhasil di-void.`, type: 'success' });
        fetchData(); // FIX: was fetchTransactions() which is undefined
      } else {
        setSnackbar({ open: true, message: data.message, type: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Gagal void transaksi', type: 'error' });
    } finally {
      setVoidingId(null);
      setConfirmVoid(null);
    }
  };

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>

      <Portal>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button 
            variant={dateFilter !== 'all' ? "contained" : "outlined"} 
            startIcon={<FilterIcon />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            sx={{ borderRadius: 2, borderColor: 'divider', textTransform: 'none', fontWeight: 600, py: 0.5 }}
            size="small"
          >
            {dateFilter === 'today' ? 'Hari Ini' : dateFilter === 'month' ? 'Bulan Ini' : dateFilter === 'custom' ? 'Kostum' : 'Filter'}
          </Button>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
          >
            <MenuItem onClick={() => { setDateFilter('all'); setFilterAnchorEl(null); }}>Semua Waktu</MenuItem>
            <MenuItem onClick={() => { setDateFilter('today'); setFilterAnchorEl(null); }}>Hari Ini</MenuItem>
            <MenuItem onClick={() => { setDateFilter('month'); setFilterAnchorEl(null); }}>Bulan Ini</MenuItem>
            <MenuItem onClick={() => { setOpenCustomDialog(true); setFilterAnchorEl(null); }}>Rentang Tanggal...</MenuItem>
          </Menu>

          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenAdd(true)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2, textTransform: 'none', py: 0.5 }}
            size="small"
          >
            Transaksi
          </Button>
        </Stack>
      </Portal>

      {dateFilter === 'custom' && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip 
              label={`Periode: ${customRange.start} s/d ${customRange.end}`} 
              onDelete={() => setDateFilter('month')}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
        </Stack>
      )}

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>No. Voucher</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tanggal</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Kategori</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Rekening</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Keterangan / PIC</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tipe</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Jumlah</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : transactions.map((tx) => (
                <TableRow key={tx.id} hover sx={{ opacity: tx.status === 'void' ? 0.6 : 1 }}>
                  <TableCell sx={{ minWidth: 110 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: tx.type === 'income' ? 'success.main' : 'error.main',
                        bgcolor: tx.type === 'income' ? 'success.50' : 'error.50',
                        px: 1, py: 0.4, borderRadius: 1,
                        display: 'inline-block',
                        letterSpacing: 0.5
                      }}
                    >
                      {tx.voucher_number || `TRX-${tx.id}`}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {new Date(tx.trx_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={tx.category_name || "Lainnya"} 
                        size="small" 
                        sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main' }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {tx.account_name || "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tx.account_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{tx.notes || tx.user}</Typography>
                    {tx.notes && tx.user && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Oleh: {tx.user}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={tx.type === 'income' ? 'Masuk' : 'Keluar'} 
                        size="small" 
                        color={tx.type === 'income' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem', textTransform: 'uppercase' }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: tx.type === 'income' ? 'success.main' : 'error.main', textDecoration: tx.status === 'void' ? 'line-through' : 'none', opacity: tx.status === 'void' ? 0.5 : 1 }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {tx.status === 'void' || tx.status === 'void_reversal'
                      ? <Chip label="VOID" size="small" color="error" variant="outlined" sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
                      : <Chip label="OK" size="small" color="success" variant="outlined" sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
                    }
                  </TableCell>
                  <TableCell align="center">
                    {tx.status !== 'void' && tx.status !== 'void_reversal' && (
                      <Button size="small" color="error" variant="outlined"
                        onClick={() => setConfirmVoid(tx)}
                        disabled={voidingId === tx.id}
                        sx={{ fontSize: '0.65rem', fontWeight: 700, py: 0.3, px: 1, borderRadius: 1.5, minWidth: 0 }}
                      >Void</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && transactions.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10 }}><Typography color="text.secondary">Tidak ada data untuk periode ini.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900 }}>Catat Transaksi Baru</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Tanggal"
              type="date"
              fullWidth
              value={formData.trx_date}
              onChange={(e) => setFormData({ ...formData, trx_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Tipe"
              fullWidth
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, category_id: '' })}
            >
              <MenuItem value="income">Uang Masuk (Income)</MenuItem>
              <MenuItem value="expense">Uang Keluar (Expense)</MenuItem>
            </TextField>
            <TextField
              select
              label="Kategori"
              fullWidth
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              {categories.filter(c => c.type === formData.type).map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.coa_code ? `[${cat.coa_code}] ` : ''}{cat.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Rekening (Simpan/Potong dari mana?)"
              fullWidth
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              helperText="Tentukan apakah transaksi ini menggunakan Kas Tunai atau Bank."
            >
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name} ({acc.code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Jumlah (Rp)"
              type="number"
              fullWidth
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <FormControlLabel
                    control={
                        <Switch 
                            checked={formData.linkInventory} 
                            onChange={(e) => setFormData({ ...formData, linkInventory: e.target.checked })} 
                        />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Hubungkan ke Stok Gudang?</Typography>}
                />
                
                {formData.linkInventory && (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <Autocomplete
                            options={inventoryItems}
                            getOptionLabel={(option) => `${option.name} (Sisa: ${option.stock})`}
                            value={inventoryItems.find(i => i.id === formData.inventory_item_id) || null}
                            onChange={(_, newValue) => {
                                setFormData({ ...formData, inventory_item_id: newValue ? newValue.id : '' });
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Pilih Barang"
                                    size="small"
                                    fullWidth
                                    helperText="Ketik nama untuk mencari barang"
                                />
                            )}
                            sx={{ mt: 1 }}
                        />
                        <TextField
                            label="Jumlah Unit"
                            type="number"
                            size="small"
                            fullWidth
                            value={formData.inventory_qty}
                            onChange={(e) => setFormData({ ...formData, inventory_qty: Number(e.target.value) })}
                            helperText={formData.type === 'income' ? 'Stok akan berkurang (Penjualan)' : 'Stok akan bertambah (Pembelian)'}
                        />
                    </Stack>
                )}
            </Box>

            <TextField
              label="Keterangan Tambahan"
              fullWidth
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAdd(false)} sx={{ fontWeight: 700 }}>Batal</Button>
          <Button onClick={handleAdd} variant="contained" sx={{ fontWeight: 800, px: 4, borderRadius: 2.5 }}>Simpan Transaksi</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.type} sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirm Void Dialog */}
      <Dialog open={!!confirmVoid} onClose={() => setConfirmVoid(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Konfirmasi Void Transaksi</DialogTitle>
        <DialogContent>
          <Typography>Apakah yakin ingin me-void transaksi <strong>TRX-{confirmVoid?.id}</strong>?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Jumlah: <strong>{confirmVoid ? formatCurrency(confirmVoid.amount) : ''}</strong></Typography>
          <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 2 }}>⚠️ Tindakan ini akan membuat jurnal pembalikan otomatis dan tidak dapat dibatalkan.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmVoid(null)} sx={{ fontWeight: 700 }}>Batal</Button>
          <Button onClick={() => handleVoid(confirmVoid)} variant="contained" color="error" sx={{ fontWeight: 800 }} disabled={!!voidingId}>Ya, Void</Button>
        </DialogActions>
      </Dialog>

      {/* Custom Range Dialog */}
      <Dialog open={openCustomDialog} onClose={() => setOpenCustomDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Pilih Rentang Tanggal</DialogTitle>
        <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField 
                    label="Mulai Tanggal" 
                    type="date" 
                    fullWidth 
                    value={customRange.start} 
                    onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField 
                    label="Sampai Tanggal" 
                    type="date" 
                    fullWidth 
                    value={customRange.end} 
                    onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                />
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenCustomDialog(false)}>Batal</Button>
            <Button 
                variant="contained" 
                onClick={() => { setDateFilter('custom'); setOpenCustomDialog(false); }}
                sx={{ fontWeight: 800 }}
            >
                Terapkan
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
