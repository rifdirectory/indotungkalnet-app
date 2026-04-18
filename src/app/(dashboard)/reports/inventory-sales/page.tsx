'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Grid, Paper, 
  CircularProgress, Chip, Avatar, Tabs, Tab
} from "@mui/material";
import { 
  TrendingUp as TrendingUpIcon,
  ShoppingCart as SalesIcon,
  AttachMoney as ProfitIcon,
  LocalShipping as ShippingIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Portal from '@/components/Portal';

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

export default function InventorySalesReportPage() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [activeTab, setActiveTab] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/inventory-sales?start=${dateRange.start}&end=${dateRange.end}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (err) {
            console.error('Error fetching sales report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading && !data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const summary = data?.summary || { total_items_sold: 0, total_revenue: 0, total_profit: 0 };
    const bestSellers = data?.best_sellers || [];
    const trend = data?.trend || [];

    const statCards = [
        { label: 'Item Terjual', value: summary.total_items_sold, icon: <ShippingIcon />, color: 'primary' },
        { label: 'Total Omzet', value: formatCurrency(summary.total_revenue), icon: <SalesIcon />, color: 'success' },
        { label: 'Total Profit', value: formatCurrency(summary.total_profit), icon: <ProfitIcon />, color: 'warning' },
        { label: 'Avg Margin', value: summary.total_revenue > 0 ? `${Math.round((summary.total_profit / (summary.total_revenue - summary.total_profit)) * 100)}%` : '0%', icon: <TrendingUpIcon />, color: 'info' }
    ];

    return (
        <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
            <Portal>
                <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 2, fontWeight: 700, py: 0.5 }} size="small">Export CSV</Button>
            </Portal>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((stat, idx) => {
                    const color = (theme.palette as any)[stat.color].main;
                    return (
                        <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper sx={{ p: 3, borderRadius: 5, border: '1px solid', borderColor: alpha(color, 0.1), bgcolor: alpha(color, 0.02) }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color, borderRadius: 3 }}>{stat.icon}</Avatar>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>{stat.label}</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900 }}>{stat.value}</Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Tab label="Grafik & Terlaris" sx={{ fontWeight: 800, textTransform: 'none' }} />
                <Tab label="Performa Barang" sx={{ fontWeight: 800, textTransform: 'none' }} />
            </Tabs>

            {/* TAB 0: Grafik + Barang Terlaris */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    {/* Trend Chart */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Card sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Tren Penjualan & Profit</Typography>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trend}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                            formatter={(val: number) => formatCurrency(val)}
                                        />
                                        <Legend />
                                        <Area type="monotone" name="Omzet" dataKey="revenue" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                                        <Area type="monotone" name="Profit" dataKey="profit" stroke={theme.palette.warning.main} fillOpacity={0} strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Best Sellers */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Card sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Barang Terlaris</Typography>
                            <Stack spacing={2}>
                                {bestSellers.map((item: any, idx: number) => (
                                    <Box key={idx} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.05) }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{item.category}</Typography>
                                            </Box>
                                            <Chip label={`${item.sold_qty} Pcs`} size="small" color="primary" sx={{ fontWeight: 900, borderRadius: 1.5 }} />
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>Rp {item.total_revenue.toLocaleString()}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main' }}>Profit: {formatCurrency(item.total_profit)}</Typography>
                                        </Stack>
                                    </Box>
                                ))}
                                {bestSellers.length === 0 && (
                                    <Box sx={{ py: 5, textAlign: 'center' }}>
                                        <Typography color="text.secondary" variant="body2">Belum ada data penjualan.</Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* TAB 1: Daftar Performa Barang */}
            {activeTab === 1 && (
                <Card sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <Box sx={{ p: 4, pb: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Daftar Performa Barang</Typography>
                        <Typography variant="caption" color="text.secondary">Rincian penjualan, omzet, modal, dan profit per item barang.</Typography>
                    </Box>
                    <TableContainer sx={{ px: 2, pb: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                    <TableCell sx={{ fontWeight: 900 }}>NAMA BARANG</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>TERJUAL</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>OMZET</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>MODAL</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>TOTAL PROFIT</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>MARGIN</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bestSellers.map((item: any, idx: number) => {
                                    const margin = item.total_revenue > 0 ? Math.round((item.total_profit / (item.total_revenue - item.total_profit)) * 100) : 0;
                                    return (
                                        <TableRow key={idx} hover>
                                            <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>{item.sold_qty} Unit</TableCell>
                                            <TableCell>{formatCurrency(item.total_revenue)}</TableCell>
                                            <TableCell>{formatCurrency(item.total_revenue - item.total_profit)}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'success.main' }}>{formatCurrency(item.total_profit)}</TableCell>
                                            <TableCell>
                                                <Chip label={`${margin}%`} size="small" variant="filled" sx={{ fontWeight: 900, borderRadius: 1.5, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {bestSellers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">Belum ada data barang.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}
        </Box>
    );
}
