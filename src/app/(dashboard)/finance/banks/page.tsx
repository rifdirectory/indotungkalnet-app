'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { 
  SyncAlt as TransferIcon,
  AccountBalance as BankIcon,
  Add as AddIcon,
  Wallet as WalletIcon,
  Search as SearchIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import Portal from '@/components/Portal';

export default function BanksPage() {
  const theme = useTheme();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

  // Transfer Form State
  const [transferData, setTransferData] = useState({
    trx_date: new Date().toISOString().split('T')[0],
    account_id: '', // From Account
    to_account_id: '', // To Account
    amount: '',
    admin_fee: '0',
    notes: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finances/banks');
      const data = await res.json();
      if(data.success) setAccounts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    // Validations
    if (!transferData.account_id || !transferData.to_account_id || !transferData.amount) {
      setSnackbar({ open: true, message: 'Harap isi semua kolom wajib.', type: 'error' });
      return;
    }
    if (transferData.account_id === transferData.to_account_id) {
      setSnackbar({ open: true, message: 'Rekening asal dan tujuan tidak boleh sama.', type: 'error' });
      return;
    }
    if (Number(transferData.amount) <= 0) {
      setSnackbar({ open: true, message: 'Nominal transfer harus lebih dari Rp 0.', type: 'error' });
      return;
    }

    // Balance Warning
    const sourceAcc = accounts.find(a => a.id === transferData.account_id);
    if (sourceAcc && Number(sourceAcc.balance) < Number(transferData.amount) + Number(transferData.admin_fee)) {
        if (!confirm(`Peringatan: Saldo ${sourceAcc.name} tidak mencukupi (Saldo: ${formatCurrency(sourceAcc.balance)}). Lanjutkan?`)) return;
    }

    try {
      const payload = {
        ...transferData,
        is_transfer: true,
        type: 'transfer' // Internal identifier
      };

      const res = await fetch('/api/finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(data.success) {
        setSnackbar({ open: true, message: 'Transfer berhasil dicatat', type: 'success' });
        setOpenTransfer(false);
        fetchAccounts();
        setTransferData({
          trx_date: new Date().toISOString().split('T')[0],
          account_id: '',
          to_account_id: '',
          amount: '',
          admin_fee: '0',
          notes: ''
        });
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Gagal mencatat transfer.', type: 'error' });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      
      <Portal container={typeof document !== 'undefined' ? document.getElementById('header-actions-portal') : null}>
        <Stack direction="row" spacing={2}>
           <Button 
            variant="contained" 
            startIcon={<TransferIcon />}
            onClick={() => setOpenTransfer(true)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2, textTransform: 'none', py: 0.5 }}
            size="small"
          >
            Transfer Antar Bank
          </Button>
        </Stack>
      </Portal>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
        Kelola rekening koran dan kas tunai perusahaan anda.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={3}>
          {/* Total Liquidity Ribbon */}
          <Card sx={{ 
            p: 2, 
            borderRadius: 3, 
            bgcolor: alpha(theme.palette.success.main, 0.05),
            border: '1px solid',
            borderColor: alpha(theme.palette.success.main, 0.1),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'success.main', color: 'white' }}>
                 <WalletIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', textTransform: 'uppercase' }}>Total Liquiditas (Kas & Bank)</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.dark' }}>
                  {formatCurrency(accounts.reduce((acc, a) => acc + Number(a.balance), 0))}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', display: { xs: 'none', md: 'block' } }}>
              {accounts.length} Rekening Aktif
            </Typography>
          </Card>

          <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>Kode Akun</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Nama Rekening / Bank</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Tipe Akun</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Saldo Tersedia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((acc) => (
                    <TableRow key={acc.id} hover>
                      <TableCell sx={{ width: 120 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            px: 1, py: 0.5, borderRadius: 1,
                          }}
                        >
                          {acc.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ 
                            width: 32, height: 32, 
                            bgcolor: acc.code.startsWith('1-11') ? 'success.50' : 'primary.50',
                            color: acc.code.startsWith('1-11') ? 'success.main' : 'primary.main'
                          }}>
                            {acc.code.startsWith('1-11') ? <WalletIcon sx={{ fontSize: 18 }} /> : <BankIcon sx={{ fontSize: 18 }} />}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {acc.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {acc.account_type}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ 
                          fontWeight: 900, 
                          color: Number(acc.balance) < 0 ? 'error.main' : 'success.main' 
                        }}>
                          {formatCurrency(acc.balance)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {accounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                        <Typography color="text.secondary">Belum ada akun Kas & Bank yang terdaftar.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      ) }

      {/* Transfer Dialog */}
      <Dialog open={openTransfer} onClose={() => setOpenTransfer(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TransferIcon color="primary" /> Transfer Antar Rekening
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Tanggal"
              type="date"
              fullWidth
              value={transferData.trx_date}
              onChange={(e) => setTransferData({ ...transferData, trx_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <TextField
                  select
                  label="Dari Akun (Sumber)"
                  fullWidth
                  size="small"
                  value={transferData.account_id}
                  onChange={(e) => setTransferData({ ...transferData, account_id: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </MenuItem>
                  ))}
                </TextField>

                <Stack direction="row" justifyContent="center" sx={{ my: -1, zIndex: 1, position: 'relative' }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', border: '3px solid white' }}>
                        <TransferIcon sx={{ fontSize: 16, transform: 'rotate(90deg)' }} />
                    </Avatar>
                </Stack>

                <TextField
                  select
                  label="Ke Akun (Tujuan)"
                  fullWidth
                  size="small"
                  value={transferData.to_account_id}
                  onChange={(e) => setTransferData({ ...transferData, to_account_id: e.target.value })}
                  sx={{ mt: 2 }}
                >
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </MenuItem>
                  ))}
                </TextField>
            </Box>

            <TextField
              label="Nominal Transfer (Rp)"
              type="number"
              fullWidth
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
            />
            
            <TextField
              label="Biaya Admin / Pajak (Opsional)"
              type="number"
              fullWidth
              helperText="Akan dipotong dari rekening sumber & masuk kategori biaya admin."
              value={transferData.admin_fee}
              onChange={(e) => setTransferData({ ...transferData, admin_fee: e.target.value })}
            />

            <TextField
              label="Keterangan Transfer"
              fullWidth
              multiline
              rows={2}
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenTransfer(false)} sx={{ fontWeight: 700 }}>Batal</Button>
          <Button onClick={handleTransfer} variant="contained" sx={{ fontWeight: 800, px: 4, borderRadius: 2.5 }}>Kirim Transfer</Button>
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
    </Box>
  );
}
