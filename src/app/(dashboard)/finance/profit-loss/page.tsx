'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Button, Card, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  alpha, useTheme, Chip, CircularProgress, MenuItem, TextField, Divider
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BalanceIcon,
  Download as DownloadIcon,
  BarChart as ChartIcon
} from "@mui/icons-material";
import Portal from '@/components/Portal';

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function ProfitLossPage() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        periodType,
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });
      const res = await fetch(`/api/reports/finance?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [periodType, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const handleExport = () => {
    const params = new URLSearchParams({
      periodType,
      year: selectedYear.toString(),
      month: selectedMonth.toString(),
    });
    window.location.href = `/api/finances/export?${params}`;
  };

  const periodLabel = periodType === 'yearly'
    ? `Tahun ${selectedYear}`
    : `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Portal>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ borderRadius: 2, px: 2, py: 0.5, borderColor: 'divider', textTransform: 'none', fontWeight: 600 }}
            size="small"
          >
            Export Excel
          </Button>
        </Stack>
      </Portal>

      {/* Period Selector */}
      <Card sx={{ p: 3, borderRadius: 4, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 100 }}>Periode:</Typography>
          <Stack direction="row" spacing={1}>
            {(['monthly', 'yearly'] as const).map(pt => (
              <Button
                key={pt}
                variant={periodType === pt ? 'contained' : 'outlined'}
                onClick={() => setPeriodType(pt)}
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: 'divider' }}
              >
                {pt === 'monthly' ? 'Bulanan' : 'Tahunan'}
              </Button>
            ))}
          </Stack>
          <TextField
            select size="small" label="Tahun"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            sx={{ minWidth: 100 }}
          >
            {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
          {periodType === 'monthly' && (
            <TextField
              select size="small" label="Bulan"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              sx={{ minWidth: 120 }}
            >
              {MONTHS.map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
            </TextField>
          )}
          <Chip label={periodLabel} color="primary" sx={{ fontWeight: 700 }} />
        </Stack>
      </Card>

      {loading ? (
        <Box sx={{ py: 20, textAlign: 'center' }}><CircularProgress /></Box>
      ) : data ? (
        <>
          {/* Summary Cards — Laporan Laba Rugi Utama */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 4, borderRadius: 4, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.3) }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.06 }}>
                  <TrendingUpIcon sx={{ fontSize: 90, color: 'success.main' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                  Total Pendapatan
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main', mt: 1 }}>
                  {formatCurrency(data.summary.revenue)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {periodLabel}
                </Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 4, borderRadius: 4, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.3) }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.06 }}>
                  <TrendingDownIcon sx={{ fontSize: 90, color: 'error.main' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                  Total Beban
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main', mt: 1 }}>
                  {formatCurrency(data.summary.expense)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {periodLabel}
                </Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{
                p: 4, borderRadius: 4, position: 'relative', overflow: 'hidden',
                bgcolor: data.summary.netProfit >= 0 ? theme.palette.primary.main : theme.palette.error.main,
                color: '#fff'
              }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.15 }}>
                  <BalanceIcon sx={{ fontSize: 90 }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', opacity: 0.85, letterSpacing: 1 }}>
                  Laba / Rugi Bersih
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                  {formatCurrency(data.summary.netProfit)}
                </Typography>
                <Box sx={{ mt: 1.5, px: 1.5, py: 0.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, display: 'inline-block' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {data.summary.netProfit >= 0 ? '✅ Laba' : '⚠️ Rugi'} — Margin {data.summary.revenue > 0 ? ((data.summary.netProfit / data.summary.revenue) * 100).toFixed(1) : 0}%
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Breakdown per Kategori */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Pendapatan per Kategori */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ChartIcon color="success" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Rincian Pendapatan</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Kategori</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Jumlah</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.breakdown.income.length === 0 ? (
                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.disabled' }}>Tidak ada data pendapatan</TableCell></TableRow>
                      ) : data.breakdown.income.map((row: any, i: number) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.category}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main' }}>{formatCurrency(row.amount)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${data.summary.revenue > 0 ? ((row.amount / data.summary.revenue) * 100).toFixed(1) : 0}%`}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.dark' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {data.breakdown.income.length > 0 && (
                  <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <Typography sx={{ fontWeight: 800 }}>Total</Typography>
                    <Typography sx={{ fontWeight: 900, color: 'success.main' }}>{formatCurrency(data.summary.revenue)}</Typography>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Beban per Kategori */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ChartIcon color="error" />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Rincian Beban</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Kategori</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Jumlah</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.breakdown.expense.length === 0 ? (
                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.disabled' }}>Tidak ada data beban</TableCell></TableRow>
                      ) : data.breakdown.expense.map((row: any, i: number) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.category}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main' }}>{formatCurrency(row.amount)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${data.summary.expense > 0 ? ((row.amount / data.summary.expense) * 100).toFixed(1) : 0}%`}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.dark' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {data.breakdown.expense.length > 0 && (
                  <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                    <Typography sx={{ fontWeight: 800 }}>Total</Typography>
                    <Typography sx={{ fontWeight: 900, color: 'error.main' }}>{formatCurrency(data.summary.expense)}</Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>

          {/* Buku Besar — Raw Transactions */}
          <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Buku Besar — Detail Transaksi</Typography>
              <Typography variant="caption" color="text.secondary">
                Periode: {periodLabel} · {data.transactions.length} transaksi (void dikecualikan)
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper' }}>Tanggal</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper' }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper' }}>Keterangan</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper' }}>Tipe</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'background.paper' }}>Debit (Masuk)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'background.paper' }}>Kredit (Keluar)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, bgcolor: 'background.paper' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>Tidak ada transaksi di periode ini</TableCell></TableRow>
                  ) : data.transactions.map((tx: any) => (
                    <TableRow key={tx.id} hover sx={{ opacity: tx.status === 'void' ? 0.5 : 1 }}>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {new Date(tx.trx_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.category_name || 'Lainnya'} size="small"
                          sx={{ fontWeight: 700, fontSize: '0.65rem', borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }} />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={tx.notes}>{tx.notes || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">Oleh: {tx.user}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.type === 'income' ? 'Masuk' : 'Keluar'} size="small"
                          color={tx.type === 'income' ? 'success' : 'error'} variant="outlined"
                          sx={{ fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase' }} />
                      </TableCell>
                      <TableCell align="right">
                        {tx.type === 'income' && (
                          <Typography sx={{ fontWeight: 800, color: 'success.main' }}>
                            {formatCurrency(tx.amount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {tx.type === 'expense' && (
                          <Typography sx={{ fontWeight: 800, color: 'error.main' }}>
                            {formatCurrency(tx.amount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={tx.status === 'void' ? 'VOID' : 'Valid'}
                          size="small"
                          color={tx.status === 'void' ? 'error' : 'success'}
                          variant="outlined"
                          sx={{ fontWeight: 900, fontSize: '0.6rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Running totals at the bottom */}
            <Box sx={{ p: 2.5, borderTop: '2px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <Stack direction="row" justifyContent="flex-end" spacing={4}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TOTAL DEBIT</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'success.main' }}>{formatCurrency(data.summary.revenue)}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TOTAL KREDIT</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'error.main' }}>{formatCurrency(data.summary.expense)}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>LABA / RUGI</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: data.summary.netProfit >= 0 ? 'primary.main' : 'error.main' }}>
                    {formatCurrency(data.summary.netProfit)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
        </>
      ) : (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography color="text.secondary">Gagal memuat laporan. Coba lagi.</Typography>
        </Box>
      )}
    </Box>
  );
}
