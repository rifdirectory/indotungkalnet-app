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
  LinearProgress,
  Tabs,
  Tab,
  Grid,
  Menu
} from "@mui/material";
import { 
  Plus as AddIcon,
  CreditCard as PayIcon,
  Users as PeopleIcon,
  Landmark as BankIcon,
  ArrowLeft as BackIcon,
  Search as SearchIcon,
  CircleDollarSign as MoneyIcon,
  History as HistoryIcon,
  Filter as FilterIcon
} from "lucide-react";
import Link from 'next/link';
import Portal from '@/components/Portal';

export default function DebtsPage() {
  const theme = useTheme();
  const [tab, setTab] = useState(0); // 0: Piutang (Receivables), 1: Hutang (Payables)
  const [employees, setEmployees] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [openHistory, setOpenHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Filter State
  const [dateFilter, setDateFilter] = useState<'today' | 'month' | 'custom' | 'all'>('all');
  const [customRange, setCustomRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [openCustomDialog, setOpenCustomDialog] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    debt_type: 'receivable',
    entity_type: 'staff',
    entity_id: '',
    total_amount: '',
    description: '',
    due_date: '',
    create_transaction: true
  });

  const [payData, setPayData] = useState({
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchDebts();
    fetchEntities();
  }, [tab, dateFilter, customRange]);

  const fetchEntities = async () => {
    try {
        const [empRes, venRes, custRes] = await Promise.all([
            fetch('/api/employees'),
            fetch('/api/vendors'),
            fetch('/api/customers')
        ]);
        const empData = await empRes.json();
        const venData = await venRes.json();
        const custData = await custRes.json();
        if(empData.success) setEmployees(empData.data);
        if(venData.success) setVendors(venData.data);
        if(custData.success) setCustomers(custData.data);
    } catch (err) {
        console.error('Failed to fetch entities:', err);
    }
  };

  const fetchDebts = async () => {
    setLoading(true);
    try {
      // Logic for 3 tabs: 
      // 0: Receivable (Staff), 1: Payable (Vendor), 2: Receivable (Customer)
      const type = (tab === 0 || tab === 2) ? 'receivable' : 'payable';
      let url = `/api/finances/debts?type=${type}`;
      
      const now = new Date();
      if (dateFilter === 'today') {
        const today = now.toLocaleString('en-CA', { timeZone: 'Asia/Jakarta' }).split(',')[0];
        url += `&startDate=${today}&endDate=${today}`;
      } else if (dateFilter === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleString('en-CA', { timeZone: 'Asia/Jakarta' }).split(',')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleString('en-CA', { timeZone: 'Asia/Jakarta' }).split(',')[0];
        url += `&startDate=${firstDay}&endDate=${lastDay}`;
      } else if (dateFilter === 'custom') {
        url += `&startDate=${customRange.start}&endDate=${customRange.end}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if(data.success) {
        let rows = data.data;
        // Filter rows based on tab
        if (tab === 0) {
            rows = rows.filter((d: any) => d.entity_type !== 'customer');
        } else if (tab === 2) {
            rows = rows.filter((d: any) => d.entity_type === 'customer');
        }
        setDebts(rows);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (debtId: number) => {
    setLoadingHistory(true);
    try {
        const res = await fetch(`/api/finances/debts/history?id=${debtId}`);
        const data = await res.json();
        if(data.success) setHistory(data.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoadingHistory(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/finances/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            debt_type: tab === 0 ? 'receivable' : 'payable'
        })
      });
      if((await res.json()).success) {
        setOpenAdd(false);
        fetchDebts();
      }
    } catch (err) {
        console.error(err);
    }
  };

  const handlePayment = async () => {
    try {
        const res = await fetch('/api/finances/debts/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                debt_id: selectedDebt.id,
                amount: payData.amount,
                description: payData.description
            })
        });
        if((await res.json()).success) {
            setOpenPay(false);
            fetchDebts();
        }
    } catch (err) {
        console.error(err);
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
            variant={dateFilter !== 'all' ? "contained" : "outlined"} 
            startIcon={<FilterIcon size={16} />}
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
            startIcon={<AddIcon size={18} />}
            onClick={() => {
              setFormData({
                  title: '',
                  debt_type: (tab === 0 || tab === 2) ? 'receivable' : 'payable',
                  entity_type: tab === 0 ? 'staff' : (tab === 1 ? 'vendor' : 'customer'),
                  entity_id: '',
                  total_amount: '',
                  description: '',
                  due_date: '',
                  create_transaction: true
              });
              setOpenAdd(true);
            }}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2, py: 0.5 }}
            size="small"
          >
            {tab === 0 ? 'Kasbon/Pinjaman' : (tab === 1 ? 'Hutang Vendor' : 'Piutang Logistik')}
          </Button>
        </Stack>
      </Portal>

      <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, borderRadius: 4, height: '100%', bgcolor: alpha(theme.palette.primary.main, 1), color: '#fff' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                          <MoneyIcon size={24} />
                      </Box>
                      <Box>
                          <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>Total {tab === 1 ? 'Hutang Perusahaan' : (tab === 0 ? 'Piutang Pegawai' : 'Piutang Logistik')}</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>
                              {formatCurrency(debts.reduce((acc, d) => acc + Number(d.total_amount), 0))}
                          </Typography>
                      </Box>
                  </Stack>
              </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', borderRadius: 2 }}>
                          <MoneyIcon size={24} />
                      </Box>
                      <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total Sisa Tagihan</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: 'warning.main' }}>
                              {formatCurrency(debts.reduce((acc, d) => acc + (Number(d.total_amount) - Number(d.paid_amount)), 0))}
                          </Typography>
                      </Box>
                  </Stack>
              </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', borderRadius: 2 }}>
                          <PayIcon size={24} />
                      </Box>
                      <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total Terbayar</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main' }}>
                              {formatCurrency(debts.reduce((acc, d) => acc + Number(d.paid_amount), 0))}
                          </Typography>
                      </Box>
                  </Stack>
              </Card>
          </Grid>
      </Grid>

      <Card sx={{ borderRadius: 4, mb: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, pt: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Piutang (Kasbon & Lainnya)" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Hutang Perusahaan (Bank & Vendor)" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Piutang Logistik (Data Pelanggan)" sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Judul / Deskripsi</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Entitas</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Sisa</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Progres Pelunasan</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : debts.map((d) => {
                const remaining = d.total_amount - d.paid_amount;
                const progress = Math.min((d.paid_amount / d.total_amount) * 100, 100);
                return (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>{d.title}</Typography>
                      {d.status === 'settled' && <Chip label="Lunas" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, mt: 0.5 }} />}
                      {/* FIX [P-2]: Show due date with overdue/near-due indicator */}
                      {d.due_date && (() => {
                        const dueDate = new Date(d.due_date);
                        const today = new Date();
                        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const isOverdue = diffDays < 0 && d.status === 'active';
                        const isNearDue = diffDays >= 0 && diffDays <= 7;
                        return (
                          <Typography variant="caption" sx={{ display: 'block', color: isOverdue ? 'error.main' : isNearDue ? 'warning.main' : 'text.disabled', fontWeight: 700, mt: 0.5 }}>
                            {isOverdue ? `⚠️ Lewat jatuh tempo ${Math.abs(diffDays)} hari` : isNearDue ? `⏰ Jatuh tempo ${diffDays} hari lagi` : `Jatuh tempo: ${dueDate.toLocaleDateString('id-ID')}`}
                          </Typography>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                            {d.entity_type === 'staff' || d.entity_type === 'customer' ? <PeopleIcon size={14} /> : <BankIcon size={14} />}
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.entity_name || 'Lainnya'}</Typography>
                        </Stack>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(d.total_amount)}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: remaining > 0 ? 'warning.dark' : 'success.main' }}>
                        {formatCurrency(remaining)}
                    </TableCell>
                    <TableCell sx={{ width: 200 }}>
                        <Stack spacing={1}>
                            <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{progress.toFixed(0)}% Terbayar</Typography>
                        </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button 
                            size="small" 
                            variant="text" 
                            startIcon={<HistoryIcon size={14} />}
                            onClick={() => { setSelectedDebt(d); fetchHistory(d.id); setOpenHistory(true); }}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            History
                        </Button>
                        {remaining > 0 && (
                            <Button 
                                size="small" 
                                variant="outlined" 
                                startIcon={<PayIcon size={14} />}
                                onClick={() => { setSelectedDebt(d); setFormData({ ...formData, notes: '' }); setOpenPay(true); }}
                                sx={{ borderRadius: 2, fontWeight: 700 }}
                            >
                                Bayar
                            </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && debts.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><Typography color="text.secondary">Belum ada catatan {tab === 0 ? 'piutang' : 'hutang'}.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Catat Data Baru</DialogTitle>
        <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField label="Judul / Deskripsi Pinjaman" fullWidth value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Contoh: Pembelian Material Fiber Optic" />
                <TextField select label="Jenis Pinjaman" fullWidth value={formData.entity_type} onChange={(e) => setFormData({...formData, entity_type: e.target.value, entity_id: ''})}>
                    <MenuItem value="staff">Piutang Pegawai (Kasbon/Loan)</MenuItem>
                    <MenuItem value="customer">Piutang Pelanggan (Material/Lainnya)</MenuItem>
                    <MenuItem value="vendor">Hutang ke Vendor (Material/Bahan)</MenuItem>
                    <MenuItem value="bank">Hutang Bank / Institusi</MenuItem>
                    <MenuItem value="other">Hutang Piutang Lainnya</MenuItem>
                </TextField>

                {formData.entity_type === 'staff' && (
                    <TextField select label="Pilih Pegawai" fullWidth value={formData.entity_id} onChange={(e) => setFormData({...formData, entity_id: e.target.value})}>
                        {employees.map(emp => <MenuItem key={emp.id} value={emp.id}>{emp.full_name}</MenuItem>)}
                    </TextField>
                )}
                {formData.entity_type === 'customer' && (
                    <TextField select label="Pilih Pelanggan" fullWidth value={formData.entity_id} onChange={(e) => setFormData({...formData, entity_id: e.target.value})}>
                        {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.full_name}</MenuItem>)}
                    </TextField>
                )}
                {formData.entity_type === 'vendor' && (
                    <TextField select label="Pilih Vendor" fullWidth value={formData.entity_id} onChange={(e) => setFormData({...formData, entity_id: e.target.value})}>
                        {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                    </TextField>
                )}

                <TextField label="Total Jumlah (Rp)" fullWidth type="number" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} />
                {/* FIX [P-2]: Add due_date field to form */}
                <TextField
                  label="Tanggal Jatuh Tempo"
                  type="date"
                  fullWidth
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  helperText="Kosongkan jika tidak ada batas waktu"
                />
                <TextField label="Keterangan Tambahan" fullWidth multiline rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenAdd(false)}>Batal</Button>
            <Button onClick={handleCreate} variant="contained" sx={{ fontWeight: 800 }}>Simpan Record</Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={openHistory} onClose={() => setOpenHistory(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Audit Pembayaran & Cicilan</DialogTitle>
        <DialogContent>
            {selectedDebt && (
                <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Audit Ledger Untuk:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>{selectedDebt.title}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Entitas: {selectedDebt.entity_name}</Typography>
                </Box>
            )}
            
            {loadingHistory ? (
                <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
            ) : history.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', opacity: 0.5 }}>
                    <HistoryIcon size={40} style={{ marginBottom: 12 }} />
                    <Typography>Belum ada riwayat pembayaran untuk item ini.</Typography>
                </Box>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Tanggal</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Keterangan</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Jumlah</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.map(h => (
                                <TableRow key={h.id}>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                        {new Date(h.trx_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                    </TableCell>
                                    <TableCell>{h.notes || 'Pembayaran Cicilan'}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: h.type === 'income' ? 'success.main' : 'error.main' }}>
                                        {formatCurrency(h.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenHistory(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={openPay} onClose={() => setOpenPay(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Input Cicilan / Pembayaran</DialogTitle>
        <DialogContent>
            {selectedDebt && (
                <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Membayar Untuk:</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{selectedDebt.title}</Typography>
                    <Typography variant="body2">Sisa: {formatCurrency(selectedDebt.total_amount - selectedDebt.paid_amount)}</Typography>
                </Box>
            )}
            <Stack spacing={3}>
                <TextField label="Jumlah Pembayaran (Rp)" fullWidth type="number" value={payData.amount} onChange={(e) => setPayData({...payData, amount: e.target.value})} />
                <TextField label="Keterangan Transaksi" fullWidth value={payData.description} onChange={(e) => setPayData({...payData, description: e.target.value})} placeholder="Misal: Cicilan ke-1" />
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenPay(false)}>Batal</Button>
            <Button onClick={handlePayment} variant="contained" sx={{ fontWeight: 800 }}>Catat Pembayaran</Button>
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

