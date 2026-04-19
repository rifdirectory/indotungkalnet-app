'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Card, CardContent, Grid, alpha, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Avatar, Chip, CircularProgress, Divider, Alert
} from "@mui/material";
import { 
  AccountBalance as AssetIcon,
  TrendingDown as DebtIcon,
  Devices as GoodsIcon,
  People as CustomersIcon,
  ReceiptLong as SalesIcon,
  AccountBalanceWallet as MoneyIcon
} from "@mui/icons-material";

export default function ReceivableDashboard() {
    const theme = useTheme();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/inventory/receivables');
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Listen for updates
        const handleRefresh = () => fetchData();
        window.addEventListener('inventory-updated', handleRefresh);
        return () => window.removeEventListener('inventory-updated', handleRefresh);
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
    if (!data) return <Alert severity="error">Gagal memuat data dashboard.</Alert>;

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>Dashboard Aset di Pelanggan</Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 4, height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}>
                                    <MoneyIcon />
                                </Avatar>
                                <Typography variant="subtitle2" color="text.secondary" fontWeight={800}>TOTAL PIUTANG (Uang)</Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>{formatCurrency(data.summary.receivables)}</Typography>
                            <Typography variant="caption" color="text.secondary">Dari {data.summary.receivableCount} transaksi material</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 4, height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                    <GoodsIcon />
                                </Avatar>
                                <Typography variant="subtitle2" color="text.secondary" fontWeight={800}>ASET BARANG (Fisik)</Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>{data.summary.equipmentCount}</Typography>
                            <Typography variant="caption" color="text.secondary">Nilai Buku: {formatCurrency(data.summary.equipmentValue)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 4, height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                                    <AssetIcon />
                                </Avatar>
                                <Typography variant="subtitle2" color="text.secondary" fontWeight={800}>TOTAL ASET LOGISTIK</Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main' }}>
                                {formatCurrency(data.summary.receivables + data.summary.equipmentValue)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Gabungan Uang & Barang di Pelanggan</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 4, height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
                                    <CustomersIcon />
                                </Avatar>
                                <Typography variant="subtitle2" color="text.secondary" fontWeight={800}>PELANGGAN BERHUTANG</Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>{data.topDebtors.length}</Typography>
                            <Typography variant="caption" color="text.secondary">Khusus untuk tagihan material saja</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                {/* List of Debtors */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DebtIcon color="error" /> Daftar Piutang Terbesar
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: alpha(theme.palette.error.main, 0.02) }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 900 }}>PELANGGAN</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 900 }}>TOTAL PIUTANG</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.topDebtors.map((debtor: any) => (
                                    <TableRow key={debtor.entity_id} hover>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" fontWeight={800}>{debtor.full_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{debtor.customer_code}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="subtitle2" color="error.main" fontWeight={900}>
                                                {formatCurrency(debtor.total_unpaid)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data.topDebtors.length === 0 && (
                                    <TableRow><TableCell colSpan={2} align="center" sx={{ py: 4 }}>Semua tagihan material lunas.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* Recent Sales History */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SalesIcon color="primary" /> Penjualan Terakhir
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 900 }}>INVOICE</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>PELANGGAN</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 900 }}>TOTAL</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.recentSales.map((sale: any) => (
                                    <TableRow key={sale.id} hover>
                                        <TableCell sx={{ py: 1.5 }}>
                                            <Typography variant="body2" fontWeight={800}>{sale.sale_number}</Typography>
                                            <Chip 
                                                label={sale.payment_mode === 'cash' ? 'TUNAI' : 'TEMPO'} 
                                                size="small" 
                                                variant="outlined"
                                                color={sale.payment_mode === 'cash' ? 'success' : 'warning'}
                                                sx={{ height: 16, fontSize: '0.6rem', mt: 0.5 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{sale.full_name || 'Umum'}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="subtitle2" fontWeight={900}>{formatCurrency(sale.total_amount)}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
}
