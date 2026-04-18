'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Avatar, 
  Chip, Grid, Paper, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, CircularProgress, Divider
} from "@mui/material";
import { 
  Plus as AddIcon,
  Search as SearchIcon,
  CircleDollarSign as MoneyIcon,
  History as HistoryIcon,
  ArrowRight as ArrowIcon,
  FileText as InvoiceIcon,
  Calendar as CalendarIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon
} from "lucide-react";

interface LogisticsInvoicingProps {
    customers: any[];
}

export default function LogisticsInvoicing({ customers: initialCustomers }: LogisticsInvoicingProps) {
    const theme = useTheme();
    const [statements, setStatements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openGenerate, setOpenGenerate] = useState(false);
    const [openPayment, setOpenPayment] = useState(false);
    const [selectedStatement, setSelectedStatement] = useState<any>(null);
    const [genData, setGenData] = useState({ customer_id: '', month: new Date().toISOString().substring(0, 7) });
    const [payData, setPayData] = useState({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });

    const fetchStatements = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/logistics/statements');
            const data = await res.json();
            if (data.success) setStatements(data.data);
        } catch (err) {
            console.error('Failed to fetch statements:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatements();
    }, []);

    const handleGenerate = async () => {
        try {
            const res = await fetch('/api/logistics/statements/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(genData)
            });
            const data = await res.json();
            if (data.success) {
                setOpenGenerate(false);
                fetchStatements();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePayment = async () => {
        try {
            const res = await fetch('/api/logistics/statements/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    statement_id: selectedStatement.id,
                    amount: payData.amount,
                    payment_date: payData.date,
                    notes: payData.notes,
                    user: 'Admin'
                })
            });
            const data = await res.json();
            if (data.success) {
                setOpenPayment(false);
                setPayData({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
                fetchStatements();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'success';
            case 'partially_paid': return 'warning';
            case 'issued': return 'primary';
            case 'overdue': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            {/* Header / Summary Card */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 1), color: '#fff' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                                <MoneyIcon size={24} />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>Total Tagihan Berjalan</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                    {formatCurrency(statements.reduce((acc, s) => acc + Number(s.closing_balance), 0))}
                                </Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, borderRadius: 5, bgcolor: alpha(theme.palette.primary.main, 0.03), height: '100%', border: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                        <Stack direction="row" spacing={3} sx={{ width: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>GENERASI TAGIHAN</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5 }}>Buat invoice bulanan terkonsolidasi untuk pelanggan.</Typography>
                                <Button 
                                    variant="contained" 
                                    startIcon={<InvoiceIcon size={16} />} 
                                    onClick={() => setOpenGenerate(true)}
                                    sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}
                                >
                                    Generate Manual
                                </Button>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            {/* Statements List Table */}
            <Card sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Statement History (Kartu Piutang)</Typography>
                    <Stack direction="row" spacing={1}>
                        <TextField size="small" placeholder="Filter customer..." variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                    </Stack>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 900 }}>NO. STATEMENT</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>PELANGGAN</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>PERIODE</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>SALDO AWAL</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>BELANJA</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>BAYAR/CICIL</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>SALDO AKHIR</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 900 }} align="right">AKSI</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : statements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary">Belum ada statement yang dibuat.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : statements.map((s) => (
                                <TableRow key={s.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>{s.statement_number}</Typography>
                                        <Typography variant="caption" color="text.secondary">ID: {s.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{s.customer_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{s.customer_code}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <CalendarIcon size={14} color={theme.palette.text.disabled} />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {new Date(s.period_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{formatCurrency(s.opening_balance)}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>+ {formatCurrency(s.sales_amount)}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>- {formatCurrency(s.payment_amount)}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 900, color: Number(s.closing_balance) > 0 ? 'warning.dark' : 'success.main' }}>
                                            {formatCurrency(s.closing_balance)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={s.status.replace('_', ' ').toUpperCase()} 
                                            size="small" 
                                            color={getStatusColor(s.status) as any}
                                            sx={{ fontWeight: 900, borderRadius: 1.5, fontSize: '0.6rem' }} 
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton 
                                                size="small" 
                                                sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}
                                                onClick={() => { setSelectedStatement(s); setOpenPayment(true); }}
                                            >
                                                <ReceiptIcon size={16} />
                                            </IconButton>
                                            <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                                <DownloadIcon size={16} />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Dialog: Generate Statement */}
            <Dialog open={openGenerate} onClose={() => setOpenGenerate(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 900 }}>Generate Monthly Statement</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField 
                            select 
                            fullWidth 
                            label="Pilih Pelanggan" 
                            value={genData.customer_id} 
                            onChange={(e) => setGenData({...genData, customer_id: e.target.value})}
                        >
                            {initialCustomers.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.full_name} ({c.customer_code})</MenuItem>
                            ))}
                        </TextField>
                        <TextField 
                            fullWidth 
                            label="Bulan Periode" 
                            type="month" 
                            value={genData.month} 
                            onChange={(e) => setGenData({...genData, month: e.target.value})} 
                            InputLabelProps={{ shrink: true }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                            Sistem akan otomatis menghitung <strong>Saldo Awal</strong> dari hutang bulan lalu dan menjumlahkan semua transaksi di bulan yang dipilih.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenGenerate(false)}>Batal</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleGenerate} 
                        disabled={!genData.customer_id || !genData.month}
                        sx={{ fontWeight: 800, borderRadius: 2 }}
                    >
                        Buat Statement Sekarang
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: Record Payment / Angsuran */}
            <Dialog open={openPayment} onClose={() => setOpenPayment(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 900 }}>Input Angsuran / Cicilan</DialogTitle>
                <DialogContent>
                    {selectedStatement && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary">Cicitan Untuk:</Typography>
                            <Typography sx={{ fontWeight: 800 }}>{selectedStatement.customer_name}</Typography>
                            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>{selectedStatement.statement_number}</Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="caption">Sisa Tagihan: <strong>{formatCurrency(selectedStatement.closing_balance)}</strong></Typography>
                        </Box>
                    )}
                    <Stack spacing={3}>
                        <TextField 
                            fullWidth 
                            label="Jumlah Bayar (Rp)" 
                            type="number" 
                            value={payData.amount} 
                            onChange={(e) => setPayData({...payData, amount: e.target.value})} 
                        />
                        <TextField 
                            fullWidth 
                            label="Tanggal Bayar" 
                            type="date" 
                            value={payData.date} 
                            onChange={(e) => setPayData({...payData, date: e.target.value})} 
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField 
                            fullWidth 
                            label="Keterangan / Ref" 
                            placeholder="Contoh: Transfer BCA, atau Tunai kpd Admin" 
                            value={payData.notes} 
                            onChange={(e) => setPayData({...payData, notes: e.target.value})} 
                            multiline 
                            rows={2} 
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenPayment(false)}>Batal</Button>
                    <Button 
                        variant="contained" 
                        color="success" 
                        onClick={handlePayment} 
                        disabled={!payData.amount}
                        sx={{ fontWeight: 800, borderRadius: 2 }}
                    >
                        Catat Pembayaran
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
