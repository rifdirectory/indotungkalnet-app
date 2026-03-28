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
  Chip
} from "@mui/material";
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  ReceiptLong as ReceiptIcon, 
  CalendarToday as CalendarIcon, 
  Download as DownloadIcon 
} from "@mui/icons-material";

export default function FinancePage() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/finances')
      .then(res => res.json())
      .then(data => {
        if(data.success) setTransactions(Array.isArray(data.data) ? data.data : []);
      });
  }, []);

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
                Laporan Keuangan
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Pantau arus kas, pendapatan, dan pengeluaran ITNET.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="outlined" 
                startIcon={<CalendarIcon />}
                sx={{ borderRadius: 3, borderColor: 'divider', color: 'text.primary', bgcolor: 'rgba(0, 0, 0, 0.02)' }}
              >
                Maret 2024
              </Button>
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 3, fontWeight: 600 }}
              >
                Export PDF
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Total Pendapatan (Bulan Ini)</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Rp 142.850.000</Typography>
                  <TrendingUpIcon color="success" />
                </Stack>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Total Pengeluaran (Bulan Ini)</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>Rp 28.400.000</Typography>
                  <TrendingDownIcon color="error" />
                </Stack>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Laba Bersih (Estimasi)</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>Rp 114.450.000</Typography>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ReceiptIcon color="primary" />
                Transaksi Terakhir
              </Typography>
              <Button size="small" sx={{ fontWeight: 700 }}>Lihat Semua</Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f1f3f4' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tanggal</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Keterangan</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Jumlah</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary', fontFamily: 'monospace' }}>{String(tx.trx_date).split('T')[0]}</TableCell>
                      <TableCell>
                        <Chip label={tx.category} size="small" sx={{ borderRadius: 3, fontSize: '0.625rem', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{tx.user}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: tx.type === 'income' ? 'success.main' : 'error.main' }}>
                        {tx.type === 'income' ? "+" : "-"}Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tx.status} 
                          size="small" 
                          sx={{ 
                            height: 22, 
                            borderRadius: 3,
                            fontSize: '0.625rem', 
                            fontWeight: 800, 
                            textTransform: 'uppercase',
                            bgcolor: alpha(tx.status === 'completed' ? theme.palette.success.main : theme.palette.warning.main, 0.1),
                            color: tx.status === 'completed' ? 'success.main' : 'warning.main',
                            border: '1px solid'
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
  );
}
