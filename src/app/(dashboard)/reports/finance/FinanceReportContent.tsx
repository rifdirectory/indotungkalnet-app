'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Card, Stack, alpha, useTheme, Grid, Button, Menu, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Divider, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tabs, Tab, LinearProgress, Tooltip, IconButton, Snackbar, Alert,
  FormControl, InputLabel, Select
} from '@mui/material';
import { 
  TrendingUp as RevenueIcon, TrendingDown as ExpenseIcon, AccountBalance as ProfitIcon,
  CalendarToday as CalendarIcon, FileDownload as DownloadIcon, Print as PrintIcon,
  Inventory as InventoryIcon, AccountBalanceWallet as WalletIcon,
  Savings as SavingsIcon, CreditCard as PayableIcon, Assessment as AssessmentIcon,
  Edit as EditIcon, Check as CheckIcon, Close as CloseIcon, Block as VoidIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Portal from '@/components/Portal';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const getMonthName = (month: number) =>
  new Date(2000, month - 1, 1).toLocaleDateString('id-ID', { month: 'long' });

const MiniBar = ({ value, maxValue, color }: { value: number; maxValue: number; color: string }) => {
  const height = maxValue > 0 ? (value / maxValue) * 60 : 0;
  return (
    <Box sx={{ width: 12, height: 60, bgcolor: alpha(color, 0.05), borderRadius: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
      <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: 1, ease: 'easeOut' }}
        style={{ width: '100%', background: color, borderRadius: '2px' }} />
    </Box>
  );
};

export default function FinanceReportContent() {
  const theme = useTheme();
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openCustom, setOpenCustom] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [exporting, setExporting] = useState(false);
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState('ALL');

  const buildQueryString = useCallback(() => {
    let q = `periodType=${periodType}`;
    if (periodType === 'monthly') q += `&month=${selectedMonth}&year=${selectedYear}`;
    else if (periodType === 'yearly') q += `&year=${selectedYear}`;
    else q += `&startDate=${customRange.start}&endDate=${customRange.end}`;
    return q;
  }, [periodType, selectedMonth, selectedYear, customRange]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQueryString();
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`/api/reports/finance?${q}`).then(r => r.json()),
        fetch(`/api/reports/finance/balance-sheet?year=${selectedYear}`).then(r => r.json()),
        fetch(`/api/reports/finance/cashflow?${q}`).then(r => r.json()),
        fetch(`/api/finances/budget?month=${selectedMonth}&year=${selectedYear}`).then(r => r.json())
      ]);
      if (r1.success) setReportData(r1.data);
      if (r2.success) setBalanceSheet(r2.data);
      if (r3.success) setCashFlow(r3.data);
      if (r4.success) setBudgetData(r4.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString, selectedMonth, selectedYear]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = buildQueryString();
      const res = await fetch(`/api/reports/finance/export?${q}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.split('filename="')[1]?.replace('"', '') || 'laporan.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setSnackbar({ open: true, message: 'Gagal mengunduh laporan', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleSaveBudget = async (categoryId: number, amount: number) => {
    const res = await fetch('/api/finances/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId, month: selectedMonth, year: selectedYear, amount })
    });
    const data = await res.json();
    if (data.success) {
      setSnackbar({ open: true, message: 'Anggaran disimpan', type: 'success' });
      setEditingBudget(null);
      fetchAll();
    }
  };

  const SummaryCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <Card sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid', borderColor: alpha(color, 0.1), boxShadow: `0 4px 20px ${alpha(color, 0.05)}` }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'flex' }}>
            <Icon sx={{ fontSize: 20, color }} />
          </Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{title}</Typography>
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{formatCurrency(value)}</Typography>
        {trend && (
          <Typography variant="caption" sx={{ color: trend > 0 ? 'success.main' : 'error.main', fontWeight: 800 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs periode lalu
          </Typography>
        )}
      </Stack>
    </Card>
  );

  if (loading && !reportData) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }

  const { summary = { revenue: 0, expense: 0, netProfit: 0 }, breakdown = { income: [], expense: [] }, trend = [], transactions = [], debts = { receivable: [], payable: [], totalReceivable: 0, totalPayable: 0 } } = reportData || {};

  const uniqueCategories = Array.from(new Set(transactions.map((t: any) => t.category_name || 'Lainnya'))).sort();
  
  const filteredTransactions = ledgerCategoryFilter === 'ALL' 
    ? transactions 
    : transactions.filter((t: any) => (t.category_name || 'Lainnya') === ledgerCategoryFilter);

  const filteredTotals = filteredTransactions.reduce((acc: any, tx: any) => {
    const amt = parseFloat(tx.amount);
    if (tx.status === 'void') return acc;
    if (tx.type === 'income') acc.income += amt;
    else acc.expense += amt;
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Portal>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button variant="outlined" startIcon={<CalendarIcon />} onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', textTransform: 'none', fontWeight: 700, px: 1.5, py: 0.5 }} size="small">
            {periodType === 'monthly' ? 'Bulanan' : periodType === 'yearly' ? 'Tahunan' : 'Custom'}
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setPeriodType('monthly'); setAnchorEl(null); }}>Laporan Bulanan</MenuItem>
            <MenuItem onClick={() => { setPeriodType('yearly'); setAnchorEl(null); }}>Laporan Tahunan</MenuItem>
            <MenuItem onClick={() => { setOpenCustom(true); setAnchorEl(null); }}>Rentang Tanggal Custom</MenuItem>
          </Menu>

          {periodType === 'monthly' && (
            <Stack direction="row" alignItems="center" bgcolor="background.paper" sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ padding: '4px 10px', border: 'none', background: 'transparent', fontWeight: 700, cursor: 'pointer', outline: 'none', fontSize: '0.875rem' }}>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>)}
              </select>
              <Divider orientation="vertical" flexItem />
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: '4px 10px', border: 'none', background: 'transparent', fontWeight: 700, cursor: 'pointer', outline: 'none', fontSize: '0.875rem' }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Stack>
          )}

          {activeTab === 2 && (
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ borderRadius: 2, fontWeight: 700, py: 0.5 }} size="small">Cetak</Button>
          )}
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport} disabled={exporting}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2, py: 0.5 }} size="small">
            {exporting ? 'Mengunduh...' : 'Export Excel'}
          </Button>
        </Stack>
      </Portal>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label="Ringkasan" sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Buku Besar" sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Laporan Laba Rugi" sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Neraca Keuangan" sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Arus Kas" sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Anggaran" sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Hutang & Piutang" sx={{ fontWeight: 800, textTransform: 'none' }} />
      </Tabs>

      {/* TAB 0: RINGKASAN */}
      {activeTab === 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, md: 4 }}><SummaryCard title="Total Pendapatan" value={summary.revenue} icon={RevenueIcon} color={theme.palette.success.main} trend={12} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><SummaryCard title="Total Pengeluaran" value={summary.expense} icon={ExpenseIcon} color={theme.palette.error.main} trend={-5} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><SummaryCard title="Laba Bersih" value={summary.netProfit} icon={ProfitIcon} color={theme.palette.primary.main} /></Grid>
          </Grid>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ borderRadius: 5, p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Detail Laporan Laba Rugi</Typography>
                  <Typography variant="caption" color="text.secondary">Rincian pendapatan dan biaya berdasarkan kategori.</Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableBody>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 900, color: 'success.main', py: 2 }}>I. PENDAPATAN (REVENUE)</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                      {breakdown.income.map((item: any) => (
                        <TableRow key={item.category}>
                          <TableCell sx={{ pl: 4, fontWeight: 600 }}>{item.coa_code ? `[${item.coa_code}] ` : ''}{item.category}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow><TableCell sx={{ fontWeight: 800 }}>TOTAL PENDAPATAN</TableCell><TableCell align="right" sx={{ fontWeight: 900, color: 'success.main' }}>{formatCurrency(summary.revenue)}</TableCell></TableRow>
                      <TableRow sx={{ height: 20 }}><TableCell colSpan={2} /></TableRow>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 900, color: 'error.main', py: 2 }}>II. BIAYA OPERASIONAL (EXPENSES)</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                      {breakdown.expense.map((item: any) => (
                        <TableRow key={item.category}>
                          <TableCell sx={{ pl: 4, fontWeight: 600 }}>{item.coa_code ? `[${item.coa_code}] ` : ''}{item.category}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow><TableCell sx={{ fontWeight: 800 }}>TOTAL BIAYA</TableCell><TableCell align="right" sx={{ fontWeight: 900, color: 'error.main' }}>({formatCurrency(summary.expense)})</TableCell></TableRow>
                      <TableRow sx={{ height: 30 }}><TableCell colSpan={2} /></TableRow>
                      <TableRow sx={{ bgcolor: 'text.primary', color: 'white' }}>
                        <TableCell sx={{ fontWeight: 900, fontSize: '1.1rem', color: 'white', py: 3 }}>LABA BERSIH (NET PROFIT)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, fontSize: '1.2rem', color: 'white' }}>{formatCurrency(summary.netProfit)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3}>
                <Card sx={{ p: 4, borderRadius: 5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Trend Cashflow</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>Pergerakan harian pendapatan vs biaya.</Typography>
                  <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ height: 120, px: 1, mb: 4 }}>
                    {trend.slice(-10).map((t: any, i: number) => {
                      const maxVal = Math.max(...trend.map((x: any) => Math.max(x.revenue || 0, x.expense || 0)));
                      return (
                        <Stack key={i} spacing={0.5} alignItems="center" flex={1}>
                          <Stack direction="row" spacing={0.3}>
                            <MiniBar value={t.revenue} maxValue={maxVal} color={theme.palette.success.main} />
                            <MiniBar value={t.expense} maxValue={maxVal} color={theme.palette.error.main} />
                          </Stack>
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary', transform: 'rotate(-45deg)', mt: 1 }}>
                            {t.month ? getMonthName(t.month).slice(0, 3) : t.label?.split('-').pop()}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    {[{ label: 'Pendapatan', val: summary.revenue, color: 'success.main' }, { label: 'Pengeluaran', val: summary.expense, color: 'error.main' }].map(item => (
                      <Stack key={item.label} direction="row" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>{formatCurrency(item.val)}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Card>
                <Card sx={{ p: 4, borderRadius: 5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Top Expenses</Typography>
                  <Stack spacing={2.5}>
                    {breakdown.expense.sort((a: any, b: any) => b.amount - a.amount).slice(0, 5).map((item: any) => {
                      const pct = summary.expense > 0 ? (item.amount / summary.expense) * 100 : 0;
                      return (
                        <Box key={item.category}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.category}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>{pct.toFixed(0)}%</Typography>
                          </Stack>
                          <Box sx={{ width: '100%', height: 6, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 3, overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                              style={{ height: '100%', background: theme.palette.error.main }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </>
      )}

      {/* TAB 1: BUKU BESAR */}
      {activeTab === 1 && (
        <Card sx={{ borderRadius: 5, overflow: 'hidden' }}>
          <Box sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.02), display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Buku Besar / Jurnal Transaksi</Typography>
              <Typography variant="caption" color="text.secondary">Daftar seluruh arus kas masuk dan keluar untuk periode terpilih.</Typography>
            </Box>
            
            <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Filter Kategori</InputLabel>
                <Select
                    value={ledgerCategoryFilter}
                    label="Filter Kategori"
                    onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                    sx={{ borderRadius: 2, fontWeight: 700, bgcolor: 'background.paper' }}
                >
                    <MenuItem value="ALL">Semua Kategori</MenuItem>
                    {uniqueCategories.map((cat: any) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                </Select>
            </FormControl>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Tanggal</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Deskripsi</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Masuk (Income)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Keluar (Expense)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((tx: any) => (
                  <TableRow key={tx.id} hover sx={{ opacity: tx.status === 'void' ? 0.3 : 1 }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {new Date(tx.trx_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Chip label={tx.category_name || 'Lainnya'} size="small" variant="outlined" sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{tx.notes || '-'}</TableCell>
                    <TableCell align="right">
                      {tx.type === 'income' ? <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main', textDecoration: tx.status === 'void' ? 'line-through' : 'none' }}>{formatCurrency(tx.amount)}</Typography> : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {tx.type === 'expense' ? <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main', textDecoration: tx.status === 'void' ? 'line-through' : 'none' }}>{formatCurrency(tx.amount)}</Typography> : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {tx.status === 'void' || tx.status === 'void_reversal'
                        ? <Chip label="VOID" size="small" color="error" variant="outlined" sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
                        : <Chip label="OK" size="small" color="success" variant="outlined" sx={{ fontWeight: 900, fontSize: '0.6rem' }} />
                      }
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><Typography color="text.secondary">Tidak ada data transaksi untuk filter ini.</Typography></TableCell></TableRow>
                )}
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 900, textAlign: 'right' }}>TOTAL PERIODE:</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main' }}>{formatCurrency(filteredTotals.income)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main' }}>({formatCurrency(filteredTotals.expense)})</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 2: LAPORAN LABA RUGI (FORMAL) */}
      {activeTab === 2 && (
        <Box sx={{ maxWidth: 850, mx: 'auto' }}>
          <Card sx={{ p: { xs: 4, md: 8 }, borderRadius: 0, boxShadow: 'none', border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5, letterSpacing: 2 }}>ITNET INDOTUNGKAL NET</Typography>
              <Divider sx={{ borderBottomWidth: 2, mb: 1, mt: 2 }} />
              <Divider sx={{ mb: 4 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>Laporan Laba Rugi</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Periode: {periodType === 'monthly' ? `${getMonthName(selectedMonth)} ${selectedYear}` : `${customRange.start} s/d ${customRange.end}`}
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <TableCell sx={{ fontWeight: 800, py: 2 }} colSpan={2}>I. PENDAPATAN (REVENUE)</TableCell>
                  </TableRow>
                  {breakdown.income.map((item: any) => (
                    <TableRow key={item.category}>
                      <TableCell sx={{ pl: 4, fontWeight: 600 }}>{item.coa_code ? `[${item.coa_code}] ` : ''}{item.category}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow><TableCell sx={{ fontWeight: 900 }}>TOTAL PENDAPATAN</TableCell><TableCell align="right" sx={{ fontWeight: 900, textDecoration: 'underline' }}>{formatCurrency(summary.revenue)}</TableCell></TableRow>
                  <TableRow sx={{ height: 30 }}><TableCell colSpan={2} /></TableRow>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <TableCell sx={{ fontWeight: 800, py: 2 }} colSpan={2}>II. BIAYA OPERASIONAL (EXPENSES)</TableCell>
                  </TableRow>
                  {breakdown.expense.map((item: any) => (
                    <TableRow key={item.category}>
                      <TableCell sx={{ pl: 4, fontWeight: 600 }}>{item.coa_code ? `[${item.coa_code}] ` : ''}{item.category}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow><TableCell sx={{ fontWeight: 900 }}>TOTAL BIAYA OPERASIONAL</TableCell><TableCell align="right" sx={{ fontWeight: 900, textDecoration: 'underline' }}>({formatCurrency(summary.expense)})</TableCell></TableRow>
                  <TableRow sx={{ height: 50 }}><TableCell colSpan={2} /></TableRow>
                  <TableRow sx={{ borderTop: '3px double black' }}>
                    <TableCell sx={{ fontWeight: 900, fontSize: '1.2rem', py: 3 }}>LABA BERSIH (NET INCOME)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, fontSize: '1.2rem' }}>{formatCurrency(summary.netProfit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 10, display: { xs: 'none', md: 'block' } }}>
              <Grid container spacing={4} justifyContent="flex-end" sx={{ textAlign: 'center' }}>
                <Grid size={{ xs: 5 }}>
                  <Typography variant="body2" sx={{ mb: 10 }}>Jambi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, textDecoration: 'underline' }}>DIREKTUR UTAMA</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>ITNET INDOTUNGKAL NET</Typography>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Box>
      )}

      {/* TAB 3: NERACA KEUANGAN */}
      {activeTab === 3 && (
        <Box>
          {!balanceSheet ? <CircularProgress /> : (
            <>
              <Box sx={{ mb: 3, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
                <Typography variant="caption" color="info.main" sx={{ fontWeight: 800 }}>NERACA KEUANGAN — Per Tanggal {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>Total Aset: {formatCurrency(balanceSheet.assets.total)}</Typography>
              </Box>
              <Grid container spacing={4}>
                {/* AKTIVA */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: 5, overflow: 'hidden', height: '100%' }}>
                    <Box sx={{ p: 3, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.dark' }}>AKTIVA (ASSETS)</Typography>
                      <Typography variant="caption" color="text.secondary">Semua kekayaan yang dimiliki perusahaan</Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableBody>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }} colSpan={2}>AKTIVA LANCAR</TableCell>
                          </TableRow>
                          {[
                            { label: 'Kas & Bank (Akumulasi)', val: balanceSheet.assets.cash, icon: <WalletIcon sx={{ fontSize: 16 }} /> },
                            { label: 'Piutang Usaha', val: balanceSheet.assets.receivables, icon: <PayableIcon sx={{ fontSize: 16 }} /> },
                            { label: 'Persediaan Barang (at cost)', val: balanceSheet.assets.inventory, icon: <InventoryIcon sx={{ fontSize: 16 }} /> },
                          ].map(item => (
                            <TableRow key={item.label} hover>
                              <TableCell sx={{ pl: 4 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box sx={{ color: 'success.main' }}>{item.icon}</Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(item.val)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                            <TableCell sx={{ fontWeight: 900, color: 'success.dark' }}>TOTAL AKTIVA</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: 'success.dark', fontSize: '1rem' }}>{formatCurrency(balanceSheet.assets.total)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Grid>

                {/* PASIVA */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: 5, overflow: 'hidden', height: '100%' }}>
                    <Box sx={{ p: 3, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.dark' }}>PASIVA (LIABILITIES + EQUITY)</Typography>
                      <Typography variant="caption" color="text.secondary">Sumber pendanaan aset perusahaan</Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableBody>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }} colSpan={2}>KEWAJIBAN (LIABILITIES)</TableCell>
                          </TableRow>
                          <TableRow hover>
                            <TableCell sx={{ pl: 4 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PayableIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Hutang Usaha (ke Vendor)</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(balanceSheet.liabilities.payables)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>TOTAL KEWAJIBAN</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main' }}>{formatCurrency(balanceSheet.liabilities.total)}</TableCell>
                          </TableRow>
                          <TableRow sx={{ height: 16 }}><TableCell colSpan={2} /></TableRow>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }} colSpan={2}>MODAL (EQUITY)</TableCell>
                          </TableRow>
                          <TableRow hover>
                            <TableCell sx={{ pl: 4 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <SavingsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Laba Ditahan (Akumulasi)</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(balanceSheet.equity.retained_earnings)}</TableCell>
                          </TableRow>
                          <TableRow hover>
                            <TableCell sx={{ pl: 4 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <RevenueIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Laba Tahun Berjalan ({selectedYear})</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: balanceSheet.equity.current_year_profit >= 0 ? 'success.main' : 'error.main' }}>
                              {formatCurrency(balanceSheet.equity.current_year_profit)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>TOTAL MODAL</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatCurrency(balanceSheet.equity.total)}</TableCell>
                          </TableRow>
                          <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                            <TableCell sx={{ fontWeight: 900, color: 'error.dark' }}>TOTAL PASIVA</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: 'error.dark', fontSize: '1rem' }}>{formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, p: 2, bgcolor: Math.abs(balanceSheet.assets.total - balanceSheet.totalLiabilitiesAndEquity) < 1
                ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.warning.main, 0.05), 
                borderRadius: 2, border: '1px solid', borderColor: Math.abs(balanceSheet.assets.total - balanceSheet.totalLiabilitiesAndEquity) < 1 ? alpha(theme.palette.success.main, 0.2) : 'warning.light' }}>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  {Math.abs(balanceSheet.assets.total - balanceSheet.totalLiabilitiesAndEquity) < 1
                    ? '✅ Neraca BALANCE — Total Aktiva = Total Pasiva'
                    : `⚠️ Selisih: ${formatCurrency(Math.abs(balanceSheet.assets.total - balanceSheet.totalLiabilitiesAndEquity))}`
                  }
                </Typography>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* TAB 4: ARUS KAS */}
      {activeTab === 4 && (
        <Box>
          {!cashFlow ? <CircularProgress /> : (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                  { label: 'Arus Kas Operasional', val: cashFlow.operational.net, color: theme.palette.primary.main },
                  { label: 'Arus Kas Investasi', val: cashFlow.investment.net, color: theme.palette.info.main },
                  { label: 'Arus Kas Pembiayaan', val: cashFlow.financing.net, color: theme.palette.warning.main },
                  { label: 'Saldo Kas Akhir', val: cashFlow.summary.closingCash, color: theme.palette.success.main },
                ].map(item => (
                  <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: alpha(item.color, 0.1) }}>
                      <Typography variant="caption" sx={{ fontWeight: 800 }} color="text.secondary">{item.label}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: item.val >= 0 ? 'success.main' : 'error.main', mt: 0.5 }}>
                        {item.val >= 0 ? '' : '-'}{formatCurrency(Math.abs(item.val))}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={4}>
                {/* Operasional */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: 5, overflow: 'hidden', height: '100%' }}>
                    <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>Aktivitas Operasional</Typography>
                      <Typography variant="caption" color="text.secondary">Arus kas dari kegiatan usaha utama</Typography>
                    </Box>
                    <TableContainer><Table size="small">
                      <TableBody>
                        <TableRow><TableCell sx={{ fontWeight: 700, color: 'success.main', pl: 3 }}>Penerimaan</TableCell><TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{formatCurrency(cashFlow.operational.totalIn)}</TableCell></TableRow>
                        {cashFlow.operational.inflows.map((r: any) => (
                          <TableRow key={r.category}><TableCell sx={{ pl: 5, fontSize: '0.8rem', color: 'text.secondary' }}>{r.category || 'Lainnya'}</TableCell><TableCell align="right" sx={{ fontSize: '0.8rem' }}>{formatCurrency(Number(r.total))}</TableCell></TableRow>
                        ))}
                        <TableRow><TableCell sx={{ fontWeight: 700, color: 'error.main', pl: 3 }}>Pembayaran</TableCell><TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>({formatCurrency(cashFlow.operational.totalOut)})</TableCell></TableRow>
                        {cashFlow.operational.outflows.map((r: any) => (
                          <TableRow key={r.category}><TableCell sx={{ pl: 5, fontSize: '0.8rem', color: 'text.secondary' }}>{r.category || 'Lainnya'}</TableCell><TableCell align="right" sx={{ fontSize: '0.8rem' }}>({formatCurrency(Number(r.total))})</TableCell></TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                          <TableCell sx={{ fontWeight: 900 }}>NET OPERASIONAL</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: cashFlow.operational.net >= 0 ? 'success.main' : 'error.main' }}>{formatCurrency(cashFlow.operational.net)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table></TableContainer>
                  </Card>
                </Grid>

                {/* Investasi */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: 5, overflow: 'hidden', height: '100%' }}>
                    <Box sx={{ p: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>Aktivitas Investasi</Typography>
                      <Typography variant="caption" color="text.secondary">Pembelian/penjualan aset dan inventori</Typography>
                    </Box>
                    <TableContainer><Table size="small">
                      <TableBody>
                        <TableRow><TableCell sx={{ pl: 3, color: 'text.secondary' }}>Pembelian Inventori</TableCell><TableCell align="right" sx={{ color: 'error.main', fontWeight: 700 }}>({formatCurrency(cashFlow.investment.purchases)})</TableCell></TableRow>
                        <TableRow><TableCell sx={{ pl: 3, color: 'text.secondary' }}>Penjualan Inventori</TableCell><TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>{formatCurrency(cashFlow.investment.sales)}</TableCell></TableRow>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.03) }}>
                          <TableCell sx={{ fontWeight: 900 }}>NET INVESTASI</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: cashFlow.investment.net >= 0 ? 'success.main' : 'error.main' }}>{formatCurrency(cashFlow.investment.net)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table></TableContainer>
                  </Card>
                </Grid>

                {/* Pembiayaan */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: 5, overflow: 'hidden', height: '100%' }}>
                    <Box sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>Aktivitas Pembiayaan</Typography>
                      <Typography variant="caption" color="text.secondary">Hutang, piutang, dan pembayarannya</Typography>
                    </Box>
                    <TableContainer><Table size="small">
                      <TableBody>
                        <TableRow><TableCell sx={{ pl: 3, color: 'text.secondary' }}>Pembayaran Hutang</TableCell><TableCell align="right" sx={{ color: 'error.main', fontWeight: 700 }}>({formatCurrency(cashFlow.financing.debtPayments)})</TableCell></TableRow>
                        <TableRow><TableCell sx={{ pl: 3, color: 'text.secondary' }}>Penagihan Piutang</TableCell><TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>{formatCurrency(cashFlow.financing.receivableCollection)}</TableCell></TableRow>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.03) }}>
                          <TableCell sx={{ fontWeight: 900 }}>NET PEMBIAYAAN</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: cashFlow.financing.net >= 0 ? 'success.main' : 'error.main' }}>{formatCurrency(cashFlow.financing.net)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table></TableContainer>
                  </Card>
                </Grid>

                {/* Cash Reconciliation */}
                <Grid size={{ xs: 12 }}>
                  <Card sx={{ p: 4, borderRadius: 5, border: '2px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Rekonsiliasi Saldo Kas</Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>Saldo Kas Awal Periode</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(cashFlow.summary.openingCash)}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ pl: 3, color: 'text.secondary' }}>+ Net Arus Kas Operasional</TableCell><TableCell align="right" sx={{ color: cashFlow.summary.netOperational >= 0 ? 'success.main' : 'error.main' }}>{formatCurrency(cashFlow.summary.netOperational)}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ pl: 3, color: 'text.secondary' }}>+ Net Arus Kas Investasi</TableCell><TableCell align="right" sx={{ color: cashFlow.summary.netInvestment >= 0 ? 'success.main' : 'error.main' }}>{formatCurrency(cashFlow.summary.netInvestment)}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ pl: 3, color: 'text.secondary' }}>+ Net Arus Kas Pembiayaan</TableCell><TableCell align="right" sx={{ color: cashFlow.summary.netFinancing >= 0 ? 'success.main' : 'error.main' }}>{formatCurrency(cashFlow.summary.netFinancing)}</TableCell></TableRow>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                          <TableCell sx={{ fontWeight: 900, fontSize: '1rem' }}>Saldo Kas Akhir Periode</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, fontSize: '1rem', color: 'success.dark' }}>{formatCurrency(cashFlow.summary.closingCash)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      )}

      {/* TAB 5: ANGGARAN VS REALISASI */}
      {activeTab === 5 && (
        <Box>
          {!budgetData ? <CircularProgress /> : (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                  { label: 'Anggaran Pendapatan', val: budgetData.summary.totalBudgetIncome, color: theme.palette.success.light },
                  { label: 'Realisasi Pendapatan', val: budgetData.summary.totalActualIncome, color: theme.palette.success.main },
                  { label: 'Anggaran Pengeluaran', val: budgetData.summary.totalBudgetExpense, color: theme.palette.error.light },
                  { label: 'Realisasi Pengeluaran', val: budgetData.summary.totalActualExpense, color: theme.palette.error.main },
                ].map(item => (
                  <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: alpha(item.color, 0.2) }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>{item.label}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: item.color, mt: 0.5 }}>{formatCurrency(item.val)}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {(['income', 'expense'] as const).map(type => (
                <Card key={type} sx={{ borderRadius: 5, overflow: 'hidden', mb: 3 }}>
                  <Box sx={{ p: 3, bgcolor: type === 'income' ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.error.main, 0.05) }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: type === 'income' ? 'success.dark' : 'error.dark' }}>
                      {type === 'income' ? 'Pendapatan (Income)' : 'Pengeluaran (Expense)'} — Anggaran vs Realisasi
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getMonthName(budgetData.period.month)} {budgetData.period.year} — Klik tombol Edit untuk mengubah anggaran
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Kategori</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Anggaran</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Realisasi</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Selisih</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 160 }}>Progres</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800 }}>Aksi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {budgetData[type].map((row: any) => {
                          const budget = Number(row.budget_amount);
                          const actual = Number(row.actual_amount);
                          const diff = type === 'income' ? actual - budget : budget - actual;
                          const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : (actual > 0 ? 100 : 0);
                          const isOver = type === 'expense' ? actual > budget && budget > 0 : false;
                          const isEditing = editingBudget === row.id;
                          return (
                            <TableRow key={row.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{row.category_name}</TableCell>
                              <TableCell align="right">
                                {isEditing ? (
                                  <TextField size="small" type="number" value={budgetInput}
                                    onChange={e => setBudgetInput(e.target.value)}
                                    sx={{ width: 130, '& input': { py: 0.5, fontSize: '0.875rem' } }}
                                    autoFocus />
                                ) : (
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {budget > 0 ? formatCurrency(budget) : <span style={{ color: 'rgba(0,0,0,0.3)' }}>Belum diset</span>}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(actual)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: diff >= 0 ? 'success.main' : 'error.main' }}>
                                {diff >= 0 ? '+' : ''}{budget > 0 ? formatCurrency(diff) : '-'}
                              </TableCell>
                              <TableCell>
                                {budget > 0 ? (
                                  <Stack spacing={0.5}>
                                    <LinearProgress variant="determinate" value={pct}
                                      color={isOver ? 'error' : pct >= 80 ? 'warning' : 'success'}
                                      sx={{ height: 6, borderRadius: 3 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{pct.toFixed(0)}%</Typography>
                                  </Stack>
                                ) : '-'}
                              </TableCell>
                              <TableCell align="center">
                                {isEditing ? (
                                  <Stack direction="row" spacing={0.5} justifyContent="center">
                                    <IconButton size="small" color="success" onClick={() => handleSaveBudget(row.id, Number(budgetInput))}>
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => setEditingBudget(null)}>
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                ) : (
                                  <IconButton size="small" onClick={() => { setEditingBudget(row.id); setBudgetInput(budget.toString()); }}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              ))}
            </>
          )}
        </Box>
      )}

      {/* TAB 6: HUTANG & PIUTANG */}
      {activeTab === 6 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}><SummaryCard title="Total Piutang Berjalan" value={debts.totalReceivable} icon={RevenueIcon} color={theme.palette.warning.main} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><SummaryCard title="Total Hutang Berjalan" value={debts.totalPayable} icon={ExpenseIcon} color={theme.palette.error.main} /></Grid>
          </Grid>
          <Grid container spacing={4}>
            {([
              { key: 'receivable', label: 'Daftar Piutang (Receivables)', color: theme.palette.warning.main, subtitle: 'Uang perusahaan yang ada di pihak luar/pegawai.' },
              { key: 'payable', label: 'Daftar Hutang (Payables)', color: theme.palette.error.main, subtitle: 'Kewajiban perusahaan kepada pihak luar/vendor.' },
            ] as any[]).map(({ key, label, color, subtitle }) => (
              <Grid key={key} size={{ xs: 12, md: 6 }}>
                <Card sx={{ borderRadius: 5, overflow: 'hidden' }}>
                  <Box sx={{ p: 3, bgcolor: alpha(color, 0.05) }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Nama / Entitas</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Sisa Saldo</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(debts as any)[key]?.map((d: any) => (
                          <TableRow key={d.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.entity_name || d.title}</Typography>
                              <Typography variant="caption" color="text.secondary">{d.entity_type === 'staff' ? 'Pegawai' : d.entity_type === 'vendor' ? 'Vendor Material' : 'Lainnya'}</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: key === 'payable' ? 'error.main' : 'warning.dark' }}>
                              {formatCurrency(d.total_amount - d.paid_amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(debts as any)[key]?.length === 0 && (
                          <TableRow><TableCell colSpan={2} align="center" sx={{ py: 4 }}>Tidak ada data aktif.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Custom Range Dialog */}
      <Dialog open={openCustom} onClose={() => setOpenCustom(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Pilih Rentang Tanggal</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="Mulai Tanggal" type="date" fullWidth value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Sampai Tanggal" type="date" fullWidth value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCustom(false)}>Batal</Button>
          <Button variant="contained" onClick={() => { setPeriodType('custom'); setOpenCustom(false); }} sx={{ fontWeight: 800 }}>Tampilkan</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.type} sx={{ fontWeight: 700 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
