'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Card, Stack, alpha, useTheme, Grid, Button,
  CircularProgress, Chip
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, AccountBalanceWallet as WalletIcon,
  Assessment as AssessmentIcon, TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function ValuationContent() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);

  const fetchValuationData = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/reports/finance?periodType=yearly&year=${new Date().getFullYear()}`).then(r => r.json()),
        fetch(`/api/reports/finance/balance-sheet?year=${new Date().getFullYear()}`).then(r => r.json()),
      ]);
      if (r1.success) setReportData(r1.data);
      if (r2.success) setBalanceSheet(r2.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchValuationData();
  }, [fetchValuationData]);

  if (loading || !reportData || !balanceSheet) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Menghitung Valuasi Perusahaan...</Typography>
      </Box>
    );
  }

  const { summary } = reportData;
  const equityValue = balanceSheet.equity.total;
  const annualizedProfit = summary.netProfit * (summary.revenue > 0 && summary.revenue < 50000000 ? 12 : 1); 
  const earningsValue = annualizedProfit * 5; 
  const customerValue = (summary.totalActiveCustomers || 0) * 2500000;
  
  const averageValuation = (equityValue + earningsValue + customerValue) / 3;

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      maxWidth: 1600, 
      mx: 'auto',
      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#F9FAFB',
      minHeight: '100vh'
    }}>
      {/* Header Bar */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -1.5, color: 'text.primary' }}>
            Valuasi Perusahaan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
            Enterprise Intelligence ITNET • {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Chip 
          label="Live Analysis" 
          color="success" 
          size="small" 
          sx={{ fontWeight: 800, px: 1 }} 
          variant="outlined" 
        />
      </Box>

      <Grid container spacing={4}>
        {/* LEFT COLUMN: MAIN METRICS (8/12) */}
        <Grid item xs={12} lg={8.5}>
          <Stack spacing={3}>
            {/* 1. Hero Card: Total Enterprise Value */}
            <Card sx={{ 
              p: 5, borderRadius: 6, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1),
              bgcolor: 'background.paper',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)'
            }}>
              <Box sx={{ 
                position: 'absolute', top: -50, right: -50, width: 200, height: 200, 
                bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: '50%' 
              }} />
              
              <Typography variant="overline" sx={{ fontWeight: 850, color: 'primary.main', letterSpacing: 2, mb: 1.5, display: 'block' }}>
                ESTIMASI NILAI PERUSAHAAN (ENTERPRISE VALUE)
              </Typography>
              <Typography variant="h1" sx={{ fontWeight: 1000, color: 'text.primary', mb: 3, letterSpacing: -3, fontSize: { xs: '3rem', md: '4.5rem' } }}>
                {formatCurrency(averageValuation)}
              </Typography>
              
              <Stack direction="row" spacing={3} alignItems="center">
                <Box sx={{ px: 2, py: 1, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.dark', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 900 }}>KONSOLIDASI 3 MODEL</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Aset Riil + Kapitalisasi Profit + Nilai Basis Pelanggan
                </Typography>
              </Stack>
            </Card>

            {/* 2. Three Model Breakdown Row */}
            <Grid container spacing={3}>
              {[
                { title: 'Asset Based (Equity)', val: equityValue, icon: <WalletIcon />, color: theme.palette.info.main },
                { title: 'Earnings (5x EBITDA)', val: earningsValue, icon: <TrendingUpIcon />, color: theme.palette.success.main },
                { title: 'Subscriber Based', val: customerValue, icon: <AssessmentIcon />, color: theme.palette.warning.main },
              ].map((v) => (
                <Grid item key={v.title} xs={12} md={4}>
                  <Card sx={{ 
                    p: 3, borderRadius: 5, border: '1px solid', borderColor: 'divider', boxShadow: 'none',
                    height: '100%', display: 'flex', flexDirection: 'column', gap: 2,
                    transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', borderColor: v.color, boxShadow: `0 10px 20px ${alpha(v.color, 0.05)}` }
                  }}>
                    <Box sx={{ p: 1, width: 'fit-content', borderRadius: 2, bgcolor: alpha(v.color, 0.1), color: v.color }}>
                      {React.cloneElement(v.icon as React.ReactElement, { sx: { fontSize: 22 } })}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>{v.title}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{formatCurrency(v.val)}</Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: SIDEBAR (4/12) */}
        <Grid item xs={12} lg={3.5}>
          <Stack spacing={3}>
            {/* 3. Actions & Parameters */}
            <Card sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Button 
                fullWidth 
                variant="contained" 
                disableElevation 
                sx={{ mb: 4, bgcolor: 'text.primary', color: 'background.paper', borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 800, '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.8) } }}
              >
                Unduh Laporan Lengkap (PDF)
              </Button>

              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                DASAR PERHITUNGAN
              </Typography>
              
              <Stack spacing={2.5}>
                {[
                  { label: 'Subscribers Aktif', value: `${summary.totalActiveCustomers || 0} User` },
                  { label: 'Earnings Multiple', value: '5.0x' },
                  { label: 'Nilai per Subscriber', value: 'Rp 2,5 Jt' },
                  { label: 'Laba Bersih Tahunan', value: formatCurrency(annualizedProfit) },
                ].map(p => (
                  <Box key={p.label}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 850, display: 'block', mb: 0.5 }}>{p.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 850, fontSize: '0.95rem' }}>{p.value}</Typography>
                  </Box>
                ))}
              </Stack>
            </Card>

            {/* 4. Strategic Insight Card */}
            <Card sx={{ 
              p: 4, borderRadius: 5, bgcolor: alpha(theme.palette.warning.main, 0.04), 
              border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.2),
              boxShadow: 'none'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, color: 'warning.dark' }}>ANALISIS STRATEGIS</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8, fontWeight: 500 }}>
                Valuasi ITNET saat ini menunjukkan rasio aset terhadap hutang yang sangat sehat. Investasi pada <strong>Infrastruktur Jaringan</strong> menjadi penggerak utama nilai perusahaan.
              </Typography>
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>GROWTH INSIGHT</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, mt: 0.5 }}>+100 User = +Rp 250 Juta EV</Typography>
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
