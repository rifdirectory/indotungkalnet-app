'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  alpha,
  useTheme,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Tabs,
  Tab
} from "@mui/material";
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  ReceiptLong as ReceiptIcon, 
  CalendarToday as CalendarIcon, 
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  AccountBalance as BankIcon,
  Group as PeopleIcon,
  Payment as PaymentIcon
} from "@mui/icons-material";
import Link from 'next/link';
import Portal from '@/components/Portal';

export default function FinanceDashboard() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    profit: 0,
    debt: 0
  });

  // Modal State
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    debt_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [activeDebtTab, setActiveDebtTab] = useState(0);

  const fetchData = () => {
    setLoading(true);
    // Fetch Transactions & Stats
    fetch('/api/finances?stats=true')
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          setTransactions(data.data.slice(0, 10));
          if (data.stats) {
            setStats(data.stats);
          }
        }
      });

    // Fetch Active Debts for Modal
    fetch('/api/finances/debts')
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          setDebts(data.data.filter((d: any) => d.status === 'active'));
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    // Basic export for current view or full via API
    window.location.href = '/api/finances/export';
  };

  const handlePaymentSubmit = async () => {
    if (!paymentData.debt_id || !paymentData.amount) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/finances/debts/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      const data = await res.json();
      if (data.success) {
        setOpenPaymentModal(false);
        fetchData(); // Refresh
        setPaymentData({ debt_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], description: '' });
      } else {
        alert(data.message || 'Gagal menyimpan pembayaran');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Portal>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ borderRadius: 2, px: 2, py: 0.5, borderColor: 'divider', color: 'text.primary', bgcolor: 'background.paper', textTransform: 'none', fontWeight: 600 }}
            size="small"
          >
            Export Excel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, px: 2, py: 0.5, fontWeight: 700, textTransform: 'none', boxShadow: theme.shadows[2] }}
            size="small"
          >
            Catat Transaksi
          </Button>
        </Stack>
      </Portal>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 4, borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}>
              <TrendingUpIcon sx={{ fontSize: 80, color: 'success.main' }} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Total Pendapatan</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>{formatCurrency(stats.income)}</Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>Real-time</Typography>
              <Typography variant="caption" color="text.secondary">dari database</Typography>
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 4, borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}>
              <TrendingDownIcon sx={{ fontSize: 80, color: 'error.main' }} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Total Pengeluaran</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>{formatCurrency(stats.expense)}</Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 2 }}>
              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>Operational</Typography>
              <Typography variant="caption" color="text.secondary">tercatat</Typography>
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 4, borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden', bgcolor: stats.profit >= 0 ? alpha(theme.palette.primary.main, 1) : alpha(theme.palette.error.main, 0.8), color: 'white' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1, opacity: 0.8 }}>Saldo Kas (P&L)</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{formatCurrency(stats.profit)}</Typography>
            <Box sx={{ mt: 2, p: 0.5, px: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', width: 'fit-content' }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Net Balance</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ p: 4, borderRadius: 4, height: '100%', position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.3) }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}>
              <BankIcon sx={{ fontSize: 80, color: 'warning.main' }} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Total Hutang Aktif</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.dark' }}>{formatCurrency(stats.debt)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontWeight: 600 }}>Tersisa {debts.length} hutang yang belum lunas</Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ReceiptIcon color="primary" />
                Transaksi Terakhir
              </Typography>
              <Button size="small" variant="text" sx={{ fontWeight: 700 }}>Lihat Semua</Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Tanggal</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Deskripsi</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Jumlah</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {new Date(tx.trx_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tx.category_name || tx.category || '-'} 
                          size="small" 
                          sx={{ 
                            fontWeight: 700, 
                            fontSize: '0.65rem', 
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.1)
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tx.description || tx.user}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          {tx.status === 'pending_payment' && (
                            <Chip 
                              label="PIUTANG" 
                              size="small" 
                              variant="outlined"
                              color="warning"
                              sx={{ fontWeight: 800, fontSize: '0.6rem', height: 20 }} 
                            />
                          )}
                          <Typography sx={{ fontWeight: 800, color: tx.type === 'income' ? 'success.main' : 'error.main' }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">Belum ada transaksi</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Debt Summary Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, px: 1 }}>Hutang & Piutang</Typography>
              <Tabs 
                value={activeDebtTab} 
                onChange={(_, v) => setActiveDebtTab(v)}
                variant="fullWidth"
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': { py: 1, minHeight: 40, fontWeight: 700, fontSize: '0.75rem', textTransform: 'none' }
                }}
              >
                <Tab label="Umum & Staff" />
                <Tab label="Logistik" />
              </Tabs>
            </Box>
            <Stack spacing={2} sx={{ p: 2, flexGrow: 1, overflowY: 'auto', maxHeight: 400 }}>
              {debts
                .filter(d => activeDebtTab === 1 ? d.entity_type === 'customer' : d.entity_type !== 'customer')
                .map((d: any) => (
                <Box key={d.id} sx={{ p: 2, borderRadius: 3, bgcolor: d.debt_type === 'payable' ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: d.debt_type === 'payable' ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.primary.main, 0.1) }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {d.entity_type === 'staff' ? <PeopleIcon fontSize="small" color="primary" /> : (d.debt_type === 'payable' ? <BankIcon fontSize="small" color="warning" /> : <PeopleIcon fontSize="small" color="primary" />)}
                      {d.entity_name || d.title}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: d.debt_type === 'payable' ? 'warning.dark' : 'primary.main' }}>
                      {formatCurrency(d.total_amount - d.paid_amount)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {d.entity_type === 'staff' ? 'Kasbon Staff' : (d.debt_type === 'payable' ? 'Hutang Vendor' : 'Piutang')}
                    </Typography>
                    {d.due_date && (
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                        {new Date(d.due_date).toLocaleDateString('id-ID')}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
              
              {debts.filter(d => activeDebtTab === 1 ? d.entity_type === 'customer' : d.entity_type !== 'customer').length === 0 && (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.disabled">Tidak ada data di kategori ini</Typography>
                </Box>
              )}
            </Stack>
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<PaymentIcon />}
                onClick={() => setOpenPaymentModal(true)}
                sx={{ borderRadius: 3, py: 1, fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 1) }}
              >
                Bayar Hutang / Cicilan
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Modal */}
      <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Cicilan Hutang / Piutang</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Pilih Hutang/Piutang</InputLabel>
              <Select
                label="Pilih Hutang/Piutang"
                value={paymentData.debt_id}
                onChange={(e) => setPaymentData({ ...paymentData, debt_id: e.target.value })}
              >
                {debts.map((d: any) => (
                  <MenuItem key={d.id} value={d.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.entity_name || d.title}</Typography>
                      <Typography variant="caption" sx={{ ml: 2, fontWeight: 800, color: d.debt_type === 'payable' ? 'warning.dark' : 'primary.main' }}>
                         Sisa: {formatCurrency(d.total_amount - d.paid_amount)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Jumlah Pembayaran"
              type="number"
              fullWidth
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            />
            <TextField
              label="Tanggal"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={paymentData.payment_date}
              onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
            />
            <TextField
              label="Catatan"
              multiline
              rows={2}
              fullWidth
              value={paymentData.description}
              onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenPaymentModal(false)} sx={{ fontWeight: 700 }}>Batal</Button>
          <Button 
            variant="contained" 
            onClick={handlePaymentSubmit} 
            disabled={submitting || !paymentData.debt_id || !paymentData.amount}
            sx={{ fontWeight: 800, px: 4, borderRadius: 2 }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Simpan Pembayaran'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
