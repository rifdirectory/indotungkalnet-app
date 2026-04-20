'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Stack, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme,
  Chip, IconButton, TextField, Autocomplete, Divider, 
  InputAdornment, Alert, Badge, Tooltip, Paper
} from "@mui/material";
import { 
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  CreditCard as CashIcon,
  Schedule as DebtIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  ShoppingBag as BagIcon,
  QrCode as SNIcon,
  ChevronRight as ArrowIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from 'framer-motion';
import { safeFetch } from '@/lib/fetchUtils';

export default function SalesPOS({ items: initialItems, customers: initialCustomers }: { items: any[], customers: any[] }) {
    const theme = useTheme();
    const [cart, setCart] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [paymentMode, setPaymentMode] = useState<'cash' | 'debt'>('cash');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const availableItems = useMemo(() => initialItems.filter(i => i.stock > 0), [initialItems]);
    const [searchKey, setSearchKey] = useState(0);

    const searchInputRef = React.useRef<HTMLInputElement>(null);

    const addToCart = (item: any) => {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.id === item.id ? { ...c, quantity: Math.min(c.quantity + 1, item.stock) } : c));
        } else {
            setCart([...cart, { 
                ...item, 
                quantity: 1, 
                price: item.price || 0, 
                asset_type: item.category_asset_type === 'fixed' ? 'fixed' : 'current',
                sn: ''
            }]);
        }
        
        // After adding to cart, refocus the search input
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 0);
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const updateCartItem = (id: number, field: string, value: any) => {
        setCart(cart.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (!selectedCustomer && paymentMode === 'debt') {
            setError('Pilih pelanggan untuk pembayaran Tempo');
            return;
        }
        if (cart.length === 0) return;

        setLoading(true);
        setError(null);
        try {
            const { success, data, message: errMessage } = await safeFetch('/api/inventory/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: selectedCustomer?.id,
                    payment_mode: paymentMode,
                    items: cart.map(item => ({
                        item_id: item.id,
                        quantity: item.quantity,
                        price: item.price,
                        asset_type: item.asset_type,
                        sn: item.sn
                    })),
                    notes,
                    user: 'Admin'
                })
            });
            
            if (success && data?.success) {
                setSuccess(`Berhasil! #${data.saleId}`);
                setCart([]);
                setSelectedCustomer(null);
                setNotes('');
                if (window) window.dispatchEvent(new CustomEvent('inventory-updated'));
                setTimeout(() => setSuccess(null), 5000);
            } else {
                throw new Error(errMessage || data?.message || 'Gagal memproses penjualan');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            width: '100%', 
            height: '100%', 
            bgcolor: '#f8f9fa',
            overflow: 'hidden'
        }}>
            {/* LEFT: CATALOG & CART (80%) */}
            <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                borderRight: '1px solid #e0e0e0',
                bgcolor: '#fff',
                height: '100%',
                overflow: 'hidden' // Main container doesn't scroll
            }}>
                {/* SEARCH BAR (STICKY TOP) */}
                <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid #f1f3f4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    position: 'sticky',
                    top: 0,
                    bgcolor: '#fff',
                    zIndex: 10
                }}>
                    <Autocomplete
                        key={searchKey}
                        fullWidth
                        options={availableItems}
                        getOptionLabel={(option) => `${option.name} (${option.category}) - Stok: ${option.stock} ${option.unit}`}
                        onChange={(_, newValue) => { 
                            if (newValue) {
                                addToCart(newValue);
                                // Increment key to force reset the component (clears the input)
                                setSearchKey(prev => prev + 1);
                                // Focus back to search input after a short delay
                                setTimeout(() => {
                                    if (searchInputRef.current) {
                                        searchInputRef.current.focus();
                                    }
                                }, 50);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                inputRef={searchInputRef}
                                placeholder="Telusuri katalog barang, scan barcode, atau ketik S/N..." 
                                variant="outlined" 
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: 3, 
                                        bgcolor: '#f8f9fa',
                                        '& fieldset': { border: 'none' }
                                    } 
                                }}
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'primary.main', ml: 1 }} />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        )}
                    />
                </Box>

                {/* ITEM TABLE (SCROLLABLE) */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                    <AnimatePresence mode="popLayout">
                    {cart.length === 0 ? (
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.4, py: 10 }}>
                            <BagIcon sx={{ fontSize: 120, mb: 2, color: 'divider' }} />
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>TRANSAKSI BARU</Typography>
                            <Typography variant="body2">Cari barang di kolom atas untuk memulai operasional.</Typography>
                        </Box>
                    ) : (
                        <Table stickyHeader sx={{ '& .MuiTableCell-stickyHeader': { zIndex: 5, bgcolor: '#f1f3f4' } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>DESKRIPSI BARANG</TableCell>
                                    <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">STOK</TableCell>
                                    <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">JUMLAH</TableCell>
                                    <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="right">HARGA</TableCell>
                                    <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="right">SUBTOTAL</TableCell>
                                    <TableCell sx={{ fontWeight: 800, py: 1.5 }} width={50}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cart.map((item) => (
                                    <TableRow key={item.id} hover sx={{ '& td': { py: 1.5 } }}>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>{item.name}</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{item.category?.toUpperCase() || 'GENERAL'}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography sx={{ fontWeight: 700 }}>{item.stock} {item.unit}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                                <IconButton size="small" onClick={() => updateCartItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} sx={{ border: '1px solid #e0e0e0' }}>
                                                    <Typography sx={{ fontWeight: 900, px: 0.5 }}>-</Typography>
                                                </IconButton>
                                                <Typography sx={{ fontWeight: 900, width: 30, textAlign: 'center' }}>{item.quantity}</Typography>
                                                <IconButton size="small" onClick={() => addToCart(item)} sx={{ border: '1px solid #e0e0e0' }}>
                                                    <AddIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography sx={{ fontWeight: 700 }}>{formatCurrency(item.price)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography sx={{ fontWeight: 900, color: 'primary.main' }}>{formatCurrency(item.price * item.quantity)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" color="error" onClick={() => removeFromCart(item.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    </AnimatePresence>
                </Box>

                {/* LOG INFO (BOTTOM) */}
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                        TERMINAL OPERASIONAL • SESI: ADMIN • {new Date().toLocaleDateString('id-ID')}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button size="small" startIcon={<ArrowIcon sx={{ transform: 'rotate(180deg)' }} />} sx={{ fontWeight: 800, textTransform: 'none' }}>Back to Inventory</Button>
                    </Stack>
                </Box>
            </Box>

            {/* RIGHT: SETTLEMENT PANEL (20-25%) */}
            <Box sx={{ 
                width: 400, 
                display: 'flex', 
                flexDirection: 'column', 
                p: 4,
                bgcolor: '#fff'
            }}>
                <Stack spacing={4} sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: '#fff' }}>
                            <ReceiptIcon fontSize="small" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Check-out Terminal</Typography>
                    </Box>

                    {/* CUSTOMER */}
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', mb: 1.5, display: 'block' }}>PILIH PELANGGAN</Typography>
                        <Autocomplete
                            options={initialCustomers}
                            getOptionLabel={(option) => {
                                const code = option.customer_code ? ` (${option.customer_code})` : '';
                                return `${option.full_name}${code}`;
                            }}
                            value={selectedCustomer}
                            onChange={(_, newValue) => setSelectedCustomer(newValue)}
                            renderInput={(params) => <TextField {...params} placeholder="Cari Nama/ID..." variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8f9fa' } }} />}
                        />
                    </Box>

                    {/* PAYMENT MODE */}
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', mb: 1.5, display: 'block' }}>METODE PEMBAYARAN</Typography>
                        <Stack direction="row" spacing={1}>
                            <Button 
                                fullWidth 
                                variant={paymentMode === 'cash' ? 'contained' : 'outlined'} 
                                onClick={() => setPaymentMode('cash')}
                                sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none', py: 1.5, flex: 1 }}
                            >
                                <CashIcon sx={{ mr: 1, fontSize: 18 }} /> Tunai
                            </Button>
                            <Button 
                                fullWidth 
                                variant={paymentMode === 'debt' ? 'contained' : 'outlined'} 
                                color="warning"
                                onClick={() => setPaymentMode('debt')}
                                sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none', py: 1.5, flex: 1 }}
                            >
                                <DebtIcon sx={{ mr: 1, fontSize: 18 }} /> Tempo
                            </Button>
                        </Stack>
                    </Box>

                    {/* NOTES */}
                    <TextField 
                        fullWidth 
                        multiline 
                        rows={3} 
                        placeholder="Ketik catatan transaksi (opsional)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        label="Catatan"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />

                    {/* TOTAL */}
                    <Box sx={{ mt: 'auto', p: 3, borderRadius: 4, bgcolor: '#000', color: '#fff', textAlign: 'right', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.6 }}>TOTAL TAGIHAN</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 900 }}>{totalAmount > 0 ? formatCurrency(totalAmount).replace('Rp', '').trim() : '0'}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Rupiah</Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.75rem' }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.75rem' }}>{success}</Alert>}

                    <Button 
                        fullWidth 
                        variant="contained" 
                        size="large"
                        disabled={loading || cart.length === 0}
                        onClick={handleCheckout}
                        sx={{ 
                            py: 2.5, 
                            borderRadius: 3, 
                            fontWeight: 900, 
                            fontSize: '1.2rem',
                            boxShadow: '0 8px 32px ' + alpha(theme.palette.primary.main, 0.4),
                            textTransform: 'none'
                        }}
                    >
                        {loading ? 'MEMPROSES...' : ' KONFIRMASI PEMBAYARAN'}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}
