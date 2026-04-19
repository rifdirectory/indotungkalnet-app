'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Stack, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, 
  CircularProgress, alpha, useTheme, Button, TextField, 
  InputAdornment, Paper, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Grid
} from "@mui/material";
import { 
  Search as SearchIcon, 
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  CreditCard as CashIcon,
  Schedule as DebtIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  CheckCircle as PaidIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebIcon,
  LocationOn as LocationIcon
} from "@mui/icons-material";

export default function SalesHistory() {
    const theme = useTheme();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    // Detail States
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [saleItems, setSaleItems] = useState<any[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory/sales');
            const data = await res.json();
            if (data.success) {
                setSales(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch sales history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDetail = async (sale: any) => {
        setSelectedSale(sale);
        setDetailOpen(true);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/inventory/sales?id=${sale.id}`);
            const data = await res.json();
            if (data.success) {
                setSaleItems(data.items);
            }
        } catch (err) {
            console.error('Failed to fetch sale details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handlePayInvoice = async () => {
        if (!selectedSale) return;
        if (!confirm(`Konfirmasi pelunasan invoice #${selectedSale.sale_number}?`)) return;

        setSubmittingPayment(true);
        try {
            const res = await fetch('/api/inventory/sales', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saleId: selectedSale.id, user: 'Admin' })
            });
            const data = await res.json();
            if (data.success) {
                setSales(prev => prev.map(s => s.id === selectedSale.id ? { ...s, payment_status: 'paid' } : s));
                setSelectedSale(prev => ({ ...prev, payment_status: 'paid' }));
                alert('Invoice berhasil dilunaskan!');
            } else {
                alert('Gagal melunaskan invoice: ' + data.message);
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert('Terjadi kesalahan saat memproses pembayaran.');
        } finally {
            setSubmittingPayment(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const filteredSales = sales.filter(s => 
        s.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    if (loading && sales.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Global Style for Print */}
            <style jsx global>{`
                @media screen {
                    .print-only {
                        display: none !important;
                    }
                }
                @media print {
                    html, body {
                        height: 100vh;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden;
                        background: #fff !important;
                        visibility: hidden !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-only {
                        visibility: visible !important;
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        z-index: 9999999 !important;
                    }
                    .print-only * {
                        visibility: visible !important;
                    }
                    /* Forcefully hide EVERYTHING else */
                    #padding-provider, #root, .MuiDialog-root, .MuiBackdrop-root, #__next, .layout-root {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Header / Search Area */}
            <Stack direction="row" spacing={2} sx={{ mb: 4 }} alignItems="center" justifyContent="space-between">
                <TextField 
                    placeholder="Cari transaksi by Invoice atau Pelanggan..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 400, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="disabled" />
                            </InputAdornment>
                        ),
                    }}
                />
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" startIcon={<DownloadIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}>Export CSV</Button>
                </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>INVOICE</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>PELANGGAN</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>TANGGAL</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center">ITEM</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">TOTAL</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center">PEMBAYARAN</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center">STATUS</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">AKSI</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                    <Typography variant="body2" color="text.secondary">Belum ada data transaksi.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSales.map((s) => (
                                <TableRow key={s.id} hover sx={{ '& td': { py: 2 } }}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.9rem' }}>#{s.sale_number}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Oleh: {s.user}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 700 }}>{s.customer_name || 'Umum / Walk-in'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={`${s.item_count} Item`} size="small" sx={{ fontWeight: 800, borderRadius: 1.5, height: 20 }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography sx={{ fontWeight: 900 }}>{formatCurrency(s.total_amount)}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                                            {s.payment_mode === 'cash' ? <CashIcon fontSize="inherit" color="primary" /> : <DebtIcon fontSize="inherit" color="warning" />}
                                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{s.payment_mode}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={s.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'} 
                                            size="small" 
                                            color={s.payment_status === 'paid' ? 'success' : 'warning'} 
                                            sx={{ fontWeight: 900, borderRadius: 1.5, px: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleOpenDetail(s)}
                                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                                        >
                                            <ViewIcon fontSize="small" color="primary" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Detail Modal */}
            <Dialog 
                open={detailOpen} 
                onClose={() => setDetailOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ReceiptIcon color="primary" />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Detail Transaksi</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>#{selectedSale?.sale_number}</Typography>
                            </Box>
                        </Stack>
                        <IconButton onClick={() => setDetailOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent dividers>
                    {detailLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : (
                        <Box>
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Pelanggan</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{selectedSale?.customer_name || 'Umum / Walk-in'}</Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Tanggal</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{selectedSale && new Date(selectedSale.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Status</Typography>
                                    <Box>
                                        <Chip label={selectedSale?.payment_status === 'paid' ? 'LUNAS' : 'TEMPO'} size="small" color={selectedSale?.payment_status === 'paid' ? 'success' : 'warning'} sx={{ fontWeight: 900, height: 20 }} />
                                    </Box>
                                </Grid>
                            </Grid>

                            <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Nama Barang</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>SN / Serial</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }} align="right">Qty</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }} align="right">Harga</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }} align="right">Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {saleItems.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ fontWeight: 600 }}>{item.item_name}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.sn || '-'}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{item.quantity} {item.unit}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(item.price * item.quantity)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={4} align="right" sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>TOTAL AKHIR</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02), fontSize: '1rem' }}>
                                                {formatCurrency(selectedSale?.total_amount || 0)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {selectedSale?.notes && (
                                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>CATATAN:</Typography>
                                    <Typography variant="body2">{selectedSale.notes}</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Box>
                        {selectedSale?.payment_status === 'unpaid' && (
                            <Button 
                                variant="contained" 
                                color="success"
                                startIcon={submittingPayment ? <CircularProgress size={20} color="inherit" /> : <PaidIcon />}
                                onClick={handlePayInvoice}
                                disabled={submittingPayment}
                                sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
                            >
                                Lunaskan Sekarang
                            </Button>
                        )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button onClick={() => setDetailOpen(false)} sx={{ fontWeight: 800 }}>Tutup</Button>
                        <Button 
                            variant="outlined" 
                            startIcon={<PrintIcon />} 
                            onClick={handlePrint}
                            sx={{ borderRadius: 2, fontWeight: 800 }}
                        >
                            Cetak Invoice
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>

            {/* --- OFFICIAL INVOICE DISPLAY (PRINT ONLY) --- */}
            <div className="print-only">
                <Box sx={{ p: 0, color: '#000', fontFamily: '"Arial", sans-serif' }}>
                    {/* Header: Official Banner Image from Docx */}
                    <Box sx={{ width: '100%', mb: 4, overflow: 'hidden' }}>
                        <img 
                            src="/invoice_banner.png" 
                            alt="Indotungkal Net Header" 
                            style={{ width: '100%', height: 'auto', display: 'block' }} 
                        />
                    </Box>

                    <Typography variant="h4" align="center" sx={{ fontWeight: 900, mb: 4, letterSpacing: 2, color: '#000' }}>INVOICE</Typography>

                    {/* Metadata Section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, px: 3 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.85rem' }}>Kepada / To :</Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>{selectedSale?.customer_name || 'WALK-IN CUSTOMER'}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'left' }}>
                            <table style={{ borderCollapse: 'collapse', width: 'auto' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '2px 0', verticalAlign: 'top' }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#333', pr: 2 }}>Invoice Number</Typography>
                                        </td>
                                        <td style={{ padding: '2px 8px', verticalAlign: 'top' }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>:</Typography>
                                        </td>
                                        <td style={{ padding: '2px 0', verticalAlign: 'top' }}>
                                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedSale?.sale_number}</Typography>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '2px 0', verticalAlign: 'top' }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#333', pr: 2 }}>Invoice Date</Typography>
                                        </td>
                                        <td style={{ padding: '2px 8px', verticalAlign: 'top' }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>:</Typography>
                                        </td>
                                        <td style={{ padding: '2px 0', verticalAlign: 'top' }}>
                                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                                {selectedSale && new Date(selectedSale.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </Typography>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Box>
                    </Box>

                    {/* Styled Table Section */}
                    <Box sx={{ px: 3, mb: 5 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                            <thead style={{ backgroundColor: '#A6C9EC' }}>
                                <tr>
                                    <th style={{ border: '1px solid #000', padding: '8px', fontSize: '0.65rem', fontWeight: 900 }}>TANGGAL / DATE</th>
                                    <th style={{ border: '1px solid #000', padding: '8px', fontSize: '0.65rem', fontWeight: 900 }}>DESCRIPTION / JENIS PRODUK</th>
                                    <th style={{ border: '1px solid #000', padding: '8px', fontSize: '0.65rem', fontWeight: 900 }}>KATEGORI / CATEGORY</th>
                                    <th style={{ border: '1px solid #000', padding: '8px', fontSize: '0.65rem', fontWeight: 900 }}>QTY</th>
                                    <th style={{ border: '1px solid #000', padding: '8px', fontSize: '0.65rem', fontWeight: 900 }}>SATUAN / UNIT</th>
                                    <th style={{ border: '1px solid #000', padding: '8px', fontSize: '0.65rem', fontWeight: 900 }}>HARGA / UNIT PRICE</th>
                                    <th style={{ border: '1px solid #000', padding: '8px', fontSize: '0.65rem', fontWeight: 900 }}>TOTAL AMOUNT / JUMLAH</th>
                                </tr>
                            </thead>
                            <tbody>
                                {saleItems.length > 0 ? saleItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                                            {selectedSale && new Date(selectedSale.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td style={{ border: '1px solid #000', padding: '8px', fontSize: '0.85rem' }}>{item.item_name} {item.sn ? `| SN: ${item.sn}` : ''}</td>
                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>hardware</td>
                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>{item.quantity}</td>
                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>{item.unit || 'Bh'}</td>
                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '0.85rem' }}>{formatCurrency(item.price)}</td>
                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 800 }}>{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} style={{ border: '1px solid #000', padding: '16px', textAlign: 'center' }}>No Items</td>
                                    </tr>
                                )}
                                {/* Add placeholder rows if items are few to match the "official" length */}
                                {[...Array(Math.max(0, 10 - saleItems.length))].map((_, i) => (
                                    <tr key={`empty-${i}`}>
                                        <td style={{ border: '1px solid #000', padding: '16px' }}></td>
                                        <td style={{ border: '1px solid #000', padding: '16px' }}></td>
                                        <td style={{ border: '1px solid #000', padding: '16px' }}></td>
                                        <td style={{ border: '1px solid #000', padding: '16px' }}></td>
                                        <td style={{ border: '1px solid #000', padding: '16px' }}></td>
                                        <td style={{ border: '1px solid #000', padding: '16px' }}></td>
                                        <td style={{ border: '1px solid #000', padding: '16px' }}></td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#fff' }}>
                                    <td colSpan={6} style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 800 }}>Total</td>
                                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'right', fontWeight: 900, fontSize: '1.2rem' }}>{formatCurrency(selectedSale?.total_amount || 0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </Box>

                    {/* Final Footer Section */}
                    <Box sx={{ px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ width: '60%' }}>
                            <Typography sx={{ fontWeight: 800, mb: 1, borderBottom: '1.5px solid #000', display: 'inline-block', fontSize: '0.9rem' }}>Payment Information</Typography>
                            <Typography sx={{ fontSize: '0.85rem', mb: 0.5, fontWeight: 600 }}>1. Payment to Account: BANK BCA 619-592-6666</Typography>
                            <Typography sx={{ fontSize: '0.85rem', pl: 14, mb: 1, fontWeight: 800 }}>a/n : PT. INDO TUNGKAL NET</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>2. Please include the company name and invoice number on the proof of transfer.</Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center', width: '35%', position: 'relative' }}>
                            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>PT. INDO TUNGKAL NET</Typography>
                            <Typography sx={{ fontSize: '0.85rem', mb: 8 }}>Komisaris Keuangan dan Bisnis</Typography>
                            
                            <Typography sx={{ fontWeight: 600, textDecoration: 'underline', fontSize: '1rem', mt: 0, position: 'relative', zIndex: 2 }}>SOPIANSYAH</Typography>
                        </Box>
                    </Box>
                </Box>
            </div>
        </Box>
    );
}
