'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Avatar, 
  Chip, TextField, InputAdornment, Grid, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Snackbar, Alert,
  Menu, Divider, Tabs, Tab, Checkbox, Autocomplete, Skeleton
} from "@mui/material";
import { 
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Business as WarehouseIcon,
  Warning as WarningIcon,
  ArrowUpward as OutIcon,
  ArrowDownward as InIcon,
  History as HistoryIcon,
  Sync as SyncIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

const getJakartaToday = () => {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Jakarta', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(new Date());
};

import Link from 'next/link';
import Portal from '@/components/Portal';
import AssetAssignment from '@/components/inventory/AssetAssignment';
import SalesHistory from '@/components/inventory/SalesHistory';
import { logActivity } from '@/lib/audit';
import LogisticsInvoicing from '@/components/inventory/LogisticsInvoicing';
import SalesPOS from '@/components/inventory/SalesPOS';
import ReceivableDashboard from '@/components/inventory/ReceivableDashboard';
import { useSearchParams } from 'next/navigation';

export default function InventoryPage() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'stock';
  
  // Internal state for inventory sub-tabs (only for stock/assets view)
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (view === 'assets') setActiveTab(1);
    else if (view === 'stock') setActiveTab(0);
  }, [view]);

  // State
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });
  
  // Dialog States
  const [openAdd, setOpenAdd] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [openAdjust, setOpenAdjust] = useState(false);
  const [openIncoming, setOpenIncoming] = useState(false);
  const [openOutgoing, setOpenOutgoing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({
      name: '', item_code: '', category: '', stock: 0, unit: 'Unit', min_stock: 5, price: 0, purchase_price: 0, location: '', postel_number: '',
      conversion_factor: 1, secondary_unit: '', track_sn: false
  });
  const [adjustment, setAdjustment] = useState({ 
    type: 'IN', quantity: 1, sale_price: 0, purchase_price: 0, notes: '', reference_id: '',
    trx_unit: '', trx_factor: 1
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Gagal memuat data inventaris', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.success) {
            // Filter only logistics customers for inventory transactions
            setCustomers(data.data.filter((c: any) => c.customer_type === 'logistics'));
        }
    } catch (err) {}
  };

  const fetchCategories = async () => {
    try {
        const res = await fetch('/api/inventory/categories');
        const data = await res.json();
        if (data.success) setCategories(data.data);
    } catch (err) {}
  };

  const fetchLocations = async () => {
    try {
        const res = await fetch('/api/inventory/locations');
        const data = await res.json();
        if (data.success) setLocations(data.data);
    } catch (err) {}
  };

  const fetchTickets = async () => {
    try {
        const res = await fetch('/api/support');
        const data = await res.json();
        if (data.success) setTickets(data.data.filter((t: any) => t.status !== 'Closed'));
    } catch (err) {}
  };



    useEffect(() => {
      const handleRefresh = () => fetchItems();
      window.addEventListener('inventory-updated', handleRefresh);
      
      fetchItems();
      fetchCustomers();
      fetchTickets();
      fetchCategories();
      fetchLocations();

      return () => window.removeEventListener('inventory-updated', handleRefresh);
    }, []);

  const handleSaveItem = async () => {
    try {
        const method = editMode ? 'PUT' : 'POST';
        const res = await fetch('/api/inventory', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editMode ? { ...newItem, id: selectedItem.id, user: 'Admin' } : { ...newItem, user: 'Admin' })
        });
        const data = await res.json();
        if (data.success) {
            setSnackbar({ open: true, message: editMode ? 'Barang berhasil diupdate' : 'Barang berhasil ditambahkan', type: 'success' });
            setOpenAdd(false);
            setEditMode(false);
            setSelectedItem(null);
            setNewItem({ name: '', item_code: '', category: '', stock: 0, unit: 'Unit', min_stock: 5, price: 0, purchase_price: 0, location: 'Gudang Utama', postel_number: '', conversion_factor: 1, secondary_unit: '', track_sn: false });
            fetchItems();
        } else {
            throw new Error(data.message);
        }
    } catch (err: any) {
        setSnackbar({ open: true, message: err.message, type: 'error' });
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!confirm(`Arsip barang "${item.name}"? \n\nRiwayat transaksi lama akan tetap tersimpan di laporan, namun barang ini tidak akan muncul lagi di daftar katalog aktif.`)) return;
    
    try {
        const res = await fetch(`/api/inventory?id=${item.id}&user=Admin`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            setSnackbar({ open: true, message: 'Barang berhasil diarsipkan', type: 'success' });
            fetchItems();
        } else {
            throw new Error(data.message);
        }
    } catch (err: any) {
        setSnackbar({ open: true, message: err.message, type: 'error' });
    }
  };

  const handleAdjustStock = async () => {
    try {
        const res = await fetch('/api/inventory/transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...adjustment,
                item_id: selectedItem.id,
                user: 'Admin'
            })
        });
        const data = await res.json();
        if (data.success) {
            setSnackbar({ open: true, message: 'Stok berhasil diperbarui', type: 'success' });
            setOpenAdjust(false);
            setAdjustment({ type: 'IN', quantity: 1, sale_price: 0, purchase_price: 0, notes: '', reference_id: '', trx_unit: '', trx_factor: 1 });
            fetchItems();
        } else {
            throw new Error(data.message);
        }
    } catch (err: any) {
        setSnackbar({ open: true, message: err.message, type: 'error' });
    }
  };

  const handleIncomingGoods = async () => {
    if (!selectedItem) return;
    try {
        const res = await fetch('/api/inventory/transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_id: selectedItem.id,
                type: 'IN',
                quantity: adjustment.quantity,
                purchase_price: adjustment.purchase_price,
                notes: adjustment.notes,
                user: 'Admin'
            })
        });
        const data = await res.json();
        if (data.success) {
            setSnackbar({ 
                open: true, 
                message: data.message || `Berhasil menerima ${adjustment.quantity} ${selectedItem.unit} ${selectedItem.name}`, 
                type: data.warning ? 'warning' : 'success' 
            });
            setOpenIncoming(false);
            setSelectedItem(null);
            setAdjustment({ type: 'IN', quantity: 1, sale_price: 0, purchase_price: 0, notes: '', reference_id: '', transaction_date: getJakartaToday(), trx_unit: '', trx_factor: 1 });
            fetchItems();
        } else {
            throw new Error(data.message);
        }
    } catch (err: any) {
        setSnackbar({ open: true, message: err.message, type: 'error' });
    }
  };

  const handleOutgoingGoods = async () => {
    if (!selectedItem) return;
    try {
        const res = await fetch('/api/inventory/transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...adjustment,
                item_id: selectedItem.id,
                type: 'OUT',
                entity_type: (adjustment.scenario === 'SALE_DEBT' || adjustment.scenario === 'SALE_CASH') ? 'customer' : (adjustment.scenario === 'TICKET' ? 'staff' : undefined),
                user: 'Admin'
            })
        });
        const data = await res.json();
        if (data.success) {
            setSnackbar({ open: true, message: 'Pengeluaran barang berhasil dicatat & disinkronkan', type: 'success' });
            setOpenOutgoing(false);
            setSelectedItem(null);
            setAdjustment({ type: 'OUT', quantity: 1, sale_price: 0, purchase_price: 0, notes: '', reference_id: '', scenario: 'SALE_CASH', entity_id: '', ticket_id: '', due_date: '', transaction_date: getJakartaToday(), trx_unit: '', trx_factor: 1, capitalization_useful_life: 60 } as any);
            fetchItems();
        } else {
            throw new Error(data.message);
        }
    } catch (err: any) {
        setSnackbar({ open: true, message: err.message, type: 'error' });
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Item', value: items.length, icon: <InventoryIcon />, color: 'primary' },
    { label: 'Low/Critical', value: items.filter(i => i.status !== 'In Stock').length, icon: <WarningIcon />, color: 'error' },
    { label: 'Total Aset (Modal)', value: formatCurrency(items.reduce((acc, i) => acc + (i.stock * i.purchase_price), 0)), icon: <WarehouseIcon />, color: 'success' },
    { label: 'Categories', value: Array.from(new Set(items.map(i => i.category))).length, icon: <FilterIcon />, color: 'warning' },
  ];


  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Portal>
        {view === 'stock' && (
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button 
              onClick={fetchItems}
              sx={{ 
                borderRadius: 3, 
                fontWeight: 800, 
                px: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                color: 'primary.main',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
              }}
            >
              <SyncIcon sx={{ mr: 1, fontSize: 18 }} /> Refresh
            </Button>
            
            <Button 
              onClick={() => {
                setAdjustment({ type: 'OUT', quantity: 1, sale_price: 0, purchase_price: 0, notes: '', reference_id: '', scenario: 'SALE_CASH', entity_id: '', ticket_id: '', due_date: '', transaction_date: getJakartaToday() } as any);
                setOpenOutgoing(true);
              }}
              sx={{ 
                borderRadius: 3, 
                fontWeight: 800, 
                px: 2,
                bgcolor: alpha(theme.palette.error.main, 0.05),
                color: 'error.main',
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
              }}
            >
              <OutIcon sx={{ mr: 1, fontSize: 18 }} /> Pengeluaran
            </Button>

            <Button 
              onClick={() => {
                setAdjustment({ type: 'IN', quantity: 1, sale_price: 0, purchase_price: 0, notes: '', reference_id: '', transaction_date: getJakartaToday() });
                setOpenIncoming(true);
              }}
              sx={{ 
                borderRadius: 3, 
                fontWeight: 800, 
                px: 2,
                bgcolor: alpha(theme.palette.success.main, 0.05),
                color: 'success.main',
                '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) }
              }}
            >
              <InIcon sx={{ mr: 1, fontSize: 18 }} /> Penerimaan
            </Button>

            <Button 
              variant="contained" 
              onClick={() => {
                  setEditMode(false);
                  setSelectedItem(null);
                  setNewItem({ name: '', item_code: '', category: '', stock: 0, unit: 'Unit', min_stock: 5, price: 0, purchase_price: 0, location: 'Gudang Utama', postel_number: '', conversion_factor: 1, secondary_unit: '', track_sn: false });
                  setOpenAdd(true);
              }}
              sx={{ 
                borderRadius: 3, 
                px: 3, 
                py: 1, 
                fontWeight: 900, 
                boxShadow: '0 8px 16px ' + alpha(theme.palette.primary.main, 0.2),
                '&:hover': { boxShadow: '0 12px 20px ' + alpha(theme.palette.primary.main, 0.3) }
              }}
            >
              <AddIcon sx={{ mr: 1 }} /> Tambah Katalog
            </Button>
          </Stack>
        )}
      </Portal>

      {/* Tabs Navigation (Only for Inventory context) */}
      {(view === 'stock' || view === 'assets') && (
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)} 
          sx={{ 
            mb: 4, 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', minWidth: 150, fontSize: '0.95rem' }
          }}
        >
          <Tab label="Katalog & Stok" />
          <Tab label="Aset di Pelanggan" />
        </Tabs>
      )}

      {(view === 'stock' || view === 'assets') && activeTab === 0 && (
        <>

        {loading && items.length === 0 ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 3, borderRadius: 5, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Stack spacing={1}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="text" sx={{ fontSize: '1rem', width: '60%' }} />
                    <Skeleton variant="text" sx={{ fontSize: '1.5rem', width: '40%' }} />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, idx) => {
              const color = (theme.palette as any)[stat.color]?.main || theme.palette.primary.main;
              return (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ 
                      p: 3, 
                      borderRadius: 5, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2.5, 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      border: '1px solid',
                      borderColor: alpha(color, 0.1),
                      bgcolor: alpha(color, 0.02)
                  }}>
                    <Avatar sx={{ 
                        bgcolor: alpha(color, 0.1), 
                        color: color, 
                        width: 60, 
                        height: 60,
                        borderRadius: 3
                    }}>
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>{stat.value}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Search Bar Skeleton / Table Skeleton */}
        {loading && items.length === 0 ? (
          <Card sx={{ borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', mb: 3 }}>
             <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 4 }} />
             </Box>
             <TableContainer>
                <Table>
                    <TableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                                <TableCell sx={{ pl: 4 }}><Skeleton variant="rectangular" height={30} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={20} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={20} width={60} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={20} /></TableCell>
                                <TableCell><Skeleton variant="rectangular" height={20} /></TableCell>
                                <TableCell align="center" sx={{ pr: 4 }}><Skeleton variant="circular" width={30} height={30} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
          </Card>
        ) : (
          <Card sx={{ borderRadius: 5, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
              <TextField
                placeholder="Cari barang, kategori, atau lokasi..."
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'background.paper' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="disabled" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <TableCell sx={{ fontWeight: 900, pl: 4 }}>DATA BARANG</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>KATEGORI</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>STOK SAAT INI</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>HARGA KEUANGAN</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>LOKASI</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>STATUS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900, fontSize: '0.75rem', color: 'text.secondary', pr: 4 }}>AKSI CEPAT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ pl: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>CODE: {item.item_code || `ITN-${(1000 + item.id).toString()}`}</Typography>
                        {item.postel_number && (
                            <Chip size="small" label={`POSTEL: ${item.postel_number}`} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(0,0,0,0.05)' }} />
                        )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category || 'General'} size="small" variant="filled" sx={{ fontWeight: 800, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ fontWeight: 900, color: item.status !== 'In Stock' ? 'error.main' : 'text.primary' }}>
                      {item.conversion_factor > 1 && item.secondary_unit ? (() => {
                        const factor = Number(item.conversion_factor);
                        const rolls = Math.floor(item.stock / factor);
                        const meters = Math.round(item.stock % factor);
                        return (
                          <Stack direction="row" spacing={0.5} alignItems="baseline">
                            {rolls > 0 && <Box component="span" sx={{ fontSize: '0.9rem' }}>{rolls} {item.secondary_unit}</Box>}
                            {meters > 0 && <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>{meters} {item.unit}</Box>}
                            {rolls === 0 && meters === 0 && <Box component="span">0 {item.unit}</Box>}
                          </Stack>
                        );
                      })() : `${item.stock} ${item.unit}`}
                    </Box>
                    <Typography variant="caption" color="text.secondary">Min: {item.min_stock}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        <span style={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>Beli:</span> {formatCurrency(item.purchase_price)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>
                        <span style={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>Jual:</span> {formatCurrency(item.price)}
                    </Typography>
                    {item.price > 0 && item.purchase_price > 0 && (
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.1), px: 0.5, borderRadius: 1 }}>
                            Margin: {Math.round(((item.price - item.purchase_price) / item.purchase_price) * 100)}%
                        </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <WarehouseIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.location}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.status} 
                      size="small" 
                      color={item.status === 'In Stock' ? 'success' : item.status === 'Low Stock' ? 'warning' : 'error'}
                      sx={{ fontWeight: 900, borderRadius: 1.5, fontSize: '0.65rem', minWidth: 80 }} 
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                         <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                                setEditMode(true);
                                setSelectedItem(item);
                                setNewItem({
                                    name: item.name,
                                    item_code: item.item_code || '',
                                    category: item.category || '',
                                    stock: item.stock,
                                    unit: item.unit || 'Unit',
                                    min_stock: item.min_stock,
                                    price: item.price,
                                    purchase_price: item.purchase_price,
                                    location: item.location || 'Gudang Utama',
                                    postel_number: item.postel_number || '',
                                    conversion_factor: item.conversion_factor || 1,
                                    secondary_unit: item.secondary_unit || '',
                                    track_sn: !!item.track_sn
                                });
                                setOpenAdd(true);
                            }}
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}
                         >
                             <EditIcon fontSize="small" />
                         </IconButton>
                         
                         <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteItem(item)}
                            sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 2 }}
                         >
                             <DeleteIcon fontSize="small" />
                         </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Tidak ada data barang yang ditemukan.</Typography>
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
          )}
        </>
      )}

      {(view === 'stock' || view === 'assets') && activeTab === 1 && (
        <ReceivableDashboard />
      )}

      {view === 'billing' && (
        <LogisticsInvoicing customers={customers} />
      )}

      {view === 'invoices' && (
        <SalesHistory />
      )}



      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.type} sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Common Dialogs moved to global scope */}
      <Dialog open={openAdd} onClose={() => { setOpenAdd(false); setEditMode(false); }} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 900 }}>{editMode ? 'Edit Informasi Katalog' : 'Tambah Barang Baru'}</DialogTitle>
          <DialogContent>
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField fullWidth label="Nama Barang" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Kode Barang" value={newItem.item_code} onChange={(e) => setNewItem({...newItem, item_code: e.target.value})} placeholder="SKU-XXXX" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Nomor POSTEL (Opsional)" value={newItem.postel_number ?? ''} onChange={(e) => setNewItem({...newItem, postel_number: e.target.value})} placeholder="X-XXXXX/XXXX/XXXX" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                          <InputLabel>Kategori Barang</InputLabel>
                          <Select 
                              label="Kategori Barang"
                              value={newItem.category} 
                              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                          >
                              {categories.map(cat => (
                                <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
                              ))}
                              {categories.length === 0 && <MenuItem disabled>Tidak ada kategori. Tambah di Master Data.</MenuItem>}
                          </Select>
                      </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Satuan Utama" value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} placeholder="Pcs, Meter, Unit" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Satuan Sekunder" value={newItem.secondary_unit} onChange={(e) => setNewItem({...newItem, secondary_unit: e.target.value})} placeholder="Roll, Box, Dll" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField 
                        fullWidth 
                        label="Faktor Konversi" 
                        type="number" 
                        value={newItem.conversion_factor} 
                        onChange={(e) => setNewItem({...newItem, conversion_factor: Number(e.target.value)})} 
                        helperText={newItem.secondary_unit ? `1 ${newItem.secondary_unit} = ${newItem.conversion_factor} ${newItem.unit}` : "Berapa satuan utama dlm 1 satuan sekunder"}
                      />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Stok Awal" type="number" value={newItem.stock} onChange={(e) => setNewItem({...newItem, stock: Number(e.target.value)})} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Min. Stok (Warning)" type="number" value={newItem.min_stock} onChange={(e) => setNewItem({...newItem, min_stock: Number(e.target.value)})} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Harga Jual Unit" type="number" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                          <InputLabel>Lokasi Penyimpanan</InputLabel>
                          <Select 
                              label="Lokasi Penyimpanan"
                              value={newItem.location} 
                              onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                          >
                              {locations.map(loc => (
                                <MenuItem key={loc.id} value={loc.name}>{loc.name}</MenuItem>
                              ))}
                              {locations.length === 0 && <MenuItem disabled>Tidak ada lokasi. Tambah di Master Data.</MenuItem>}
                          </Select>
                      </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Paper 
                      elevation={0} 
                      onClick={() => setNewItem({...newItem, track_sn: !newItem.track_sn})}
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        bgcolor: newItem.track_sn ? alpha(theme.palette.primary.main, 0.05) : 'rgba(0,0,0,0.02)', 
                        border: '1px solid', 
                        borderColor: newItem.track_sn ? 'primary.main' : 'divider',
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Checkbox checked={newItem.track_sn} sx={{ p: 0 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Lacak Serial Number (SN)</Typography>
                        <Typography variant="caption" color="text.secondary">Wajibkan input SN saat barang ini digunakan di tiket / transaksi luar.</Typography>
                      </Box>
                    </Paper>
                  </Grid>
              </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
              <Button onClick={() => { setOpenAdd(false); setEditMode(false); }} sx={{ fontWeight: 700, color: 'text.secondary' }}>Batal</Button>
              <Button onClick={handleSaveItem} variant="contained" sx={{ px: 4, borderRadius: 2, fontWeight: 900 }}>
                  {editMode ? 'Simpan Perubahan' : 'Simpan Barang'}
              </Button>
          </DialogActions>
      </Dialog>

      {/* Dialog: Adjust Stock */}
      <Dialog open={openAdjust} onClose={() => setOpenAdjust(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 900 }}>Update Stok: {selectedItem?.name}</DialogTitle>
          <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                  <FormControl fullWidth>
                      <InputLabel>Jenis Transaksi</InputLabel>
                      <Select 
                        value={adjustment.type} 
                        label="Jenis Transaksi"
                        onChange={(e) => setAdjustment({...adjustment, type: e.target.value})}
                      >
                          <MenuItem value="IN">Masuk (Gudang Baru/Produksi)</MenuItem>
                          <MenuItem value="OUT">Keluar (Pemakaian/Dijual)</MenuItem>
                          <MenuItem value="ADJUST">Penyesuaian (Audit/Opname)</MenuItem>
                      </Select>
                  </FormControl>
                  <TextField fullWidth label="Jumlah" type="number" value={adjustment.quantity} onChange={(e) => setAdjustment({...adjustment, quantity: Number(e.target.value)})} />
                  
                  {adjustment.type === 'IN' && (
                    <TextField 
                        fullWidth 
                        label="Update Harga Beli Baru" 
                        type="number" 
                        helperText={`Harga beli saat ini: ${formatCurrency(selectedItem?.purchase_price || 0)}`}
                        value={adjustment.purchase_price} 
                        onChange={(e) => setAdjustment({...adjustment, purchase_price: Number(e.target.value)})} 
                    />
                  )}

                  {adjustment.type === 'OUT' && (
                    <TextField 
                        fullWidth 
                        label="Harga Jual Riil" 
                        type="number" 
                        helperText="Biarkan 0 jika bukan untuk dijual (Pemakaian Internal)"
                        value={adjustment.sale_price} 
                        onChange={(e) => setAdjustment({...adjustment, sale_price: Number(e.target.value)})} 
                    />
                  )}

                  <TextField fullWidth label="Catatan / Referensi" placeholder="No Invoice, Nama Teknisi, dll" value={adjustment.notes} onChange={(e) => setAdjustment({...adjustment, notes: e.target.value})} />
              </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenAdjust(false)} sx={{ fontWeight: 700 }}>Batal</Button>
              <Button onClick={handleAdjustStock} variant="contained" color="primary" sx={{ fontWeight: 900, borderRadius: 2 }}>Update Sekarang</Button>
          </DialogActions>
      </Dialog>

      {/* Dialog: Penerimaan Barang (Incoming) */}
      <Dialog open={openIncoming} onClose={() => setOpenIncoming(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InIcon color="success" /> Penerimaan Barang Masuk
          </DialogTitle>
          <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                Gunakan menu ini untuk mencatat kedatangan stok baru dari Supplier atau Vendor.
              </Typography>
              <Stack spacing={3}>
                  <TextField 
                    fullWidth 
                    label="Tanggal Transaksi" 
                    type="date" 
                    InputLabelProps={{ shrink: true }}
                    value={adjustment.transaction_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAdjustment({...adjustment, transaction_date: e.target.value} as any)}
                  />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: 'text.secondary' }}>CARI BARANG YANG DATANG</Typography>
                    <Autocomplete
                      options={items}
                      getOptionLabel={(option) => `${option.name} (${option.category}) - Stok: ${option.stock}`}
                      value={selectedItem}
                      onChange={(_, newValue) => setSelectedItem(newValue)}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Ketik nama atau kategori barang..." variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                      )}
                      noOptionsText="Barang tidak ditemukan"
                    />
                  </Box>

                  {selectedItem && (
                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                        {selectedItem.secondary_unit && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: 'text.secondary' }}>PILIH SATUAN INPUT</Typography>
                            <Stack direction="row" spacing={1}>
                              <Button 
                                size="small" 
                                variant={(!adjustment.trx_unit || adjustment.trx_unit === selectedItem.unit) ? "contained" : "outlined"}
                                onClick={() => setAdjustment({ ...adjustment, trx_unit: selectedItem.unit, trx_factor: 1 })}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                              >
                                {selectedItem.unit}
                              </Button>
                              <Button 
                                size="small" 
                                variant={adjustment.trx_unit === selectedItem.secondary_unit ? "contained" : "outlined"}
                                onClick={() => setAdjustment({ ...adjustment, trx_unit: selectedItem.secondary_unit, trx_factor: selectedItem.conversion_factor })}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                              >
                                {selectedItem.secondary_unit} (x{selectedItem.conversion_factor})
                              </Button>
                            </Stack>
                          </Box>
                        )}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField 
                                    fullWidth 
                                    label={`Jumlah [${adjustment.trx_unit || selectedItem.unit}]`} 
                                    type="number" 
                                    value={adjustment.quantity} 
                                    onChange={(e) => setAdjustment({...adjustment, quantity: Number(e.target.value)})} 
                                    helperText={adjustment.trx_unit && adjustment.trx_unit === selectedItem.secondary_unit ? `= ${Number(adjustment.quantity) * Number(selectedItem.conversion_factor)} ${selectedItem.unit}` : ""}
                                    FormHelperTextProps={{ sx: { fontWeight: 800, color: 'success.main' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField 
                                    fullWidth 
                                    label="Harga Beli Baru" 
                                    type="number" 
                                    helperText={`Lama: ${formatCurrency(selectedItem.purchase_price)}`}
                                    value={adjustment.purchase_price} 
                                    onChange={(e) => setAdjustment({...adjustment, purchase_price: Number(e.target.value)})} 
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField 
                                    fullWidth 
                                    multiline
                                    rows={2}
                                    label="Catatan (No Invoice / Nama Vendor)" 
                                    value={adjustment.notes} 
                                    onChange={(e) => setAdjustment({...adjustment, notes: e.target.value})} 
                                />
                            </Grid>
                        </Grid>
                    </Box>
                  )}
              </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenIncoming(false)} sx={{ fontWeight: 700 }}>Batal</Button>
              <Button 
                onClick={handleIncomingGoods} 
                variant="contained" 
                color="success" 
                disabled={!selectedItem || adjustment.quantity <= 0}
                sx={{ fontWeight: 900, borderRadius: 2, px: 4 }}
              >
                Konfirmasi Barang Masuk
              </Button>
          </DialogActions>
      </Dialog>

      {/* Dialog: Pengeluaran Barang (Strategic) */}
      <Dialog open={openOutgoing} onClose={() => setOpenOutgoing(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <OutIcon color="error" /> Pengeluaran Barang Strategic
          </DialogTitle>
          <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                Catat pengeluaran barang berdasarkan kasus (Penjualan, Hutang, atau Maintenance).
              </Typography>
              <Stack spacing={3}>
                  <TextField 
                    fullWidth 
                    label="Tanggal Transaksi" 
                    type="date" 
                    InputLabelProps={{ shrink: true }}
                    value={adjustment.transaction_date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAdjustment({...adjustment, transaction_date: e.target.value} as any)}
                  />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: 'text.secondary' }}>PILIH BARANG</Typography>
                    <Autocomplete
                      options={items.filter(i => i.stock > 0)}
                      getOptionLabel={(option) => `${option.name} (${option.category}) - Stok: ${option.stock}`}
                      value={selectedItem}
                      onChange={(_, newValue) => {
                          setSelectedItem(newValue);
                          if(newValue) setAdjustment({...adjustment, sale_price: newValue.price || 0} as any);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Cari barang yang akan dikirim..." variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                      )}
                      noOptionsText="Barang tidak ditemukan atau stok kosong"
                    />
                  </Box>

                  <FormControl fullWidth>
                      <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, color: 'text.secondary' }}>SKENARIO PENGELUARAN</Typography>
                      <Select 
                        value={adjustment.scenario || ''} 
                        onChange={(e) => setAdjustment({...adjustment, scenario: e.target.value} as any)}
                        sx={{ borderRadius: 3 }}
                      >
                          <MenuItem value="SALE_CASH">Penjualan Tunai (Uang Masuk Kas)</MenuItem>
                          <MenuItem value="SALE_DEBT">Penjualan Hutang (Masuk Piutang)</MenuItem>
                          <MenuItem value="TICKET">Pemakaian Lapangan (Maintenance/Tiket)</MenuItem>
                          <MenuItem value="CAPITALIZE">Jadikan Aset Infrastruktur (Aktiva Tetap)</MenuItem>
                      </Select>
                  </FormControl>

                  {selectedItem && adjustment.scenario && (
                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1) }}>
                        {selectedItem.secondary_unit && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: 'text.secondary' }}>PILIH SATUAN INPUT</Typography>
                            <Stack direction="row" spacing={1}>
                              <Button 
                                size="small" 
                                variant={(!adjustment.trx_unit || adjustment.trx_unit === selectedItem.unit) ? "contained" : "outlined"}
                                onClick={() => setAdjustment({ ...adjustment, trx_unit: selectedItem.unit, trx_factor: 1 })}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                              >
                                {selectedItem.unit}
                              </Button>
                              <Button 
                                size="small" 
                                variant={adjustment.trx_unit === selectedItem.secondary_unit ? "contained" : "outlined"}
                                onClick={() => setAdjustment({ ...adjustment, trx_unit: selectedItem.secondary_unit, trx_factor: selectedItem.conversion_factor })}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                              >
                                {selectedItem.secondary_unit} (x{selectedItem.conversion_factor})
                              </Button>
                            </Stack>
                          </Box>
                        )}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField 
                                  fullWidth 
                                  label={`Jumlah [${adjustment.trx_unit || selectedItem.unit}]`} 
                                  type="number" 
                                  value={adjustment.quantity} 
                                  onChange={(e) => setAdjustment({...adjustment, quantity: Number(e.target.value)} as any)} 
                                  helperText={adjustment.trx_unit && adjustment.trx_unit === selectedItem.secondary_unit ? `= ${Number(adjustment.quantity) * Number(selectedItem.conversion_factor)} ${selectedItem.unit}` : ""}
                                  FormHelperTextProps={{ sx: { fontWeight: 800, color: 'error.main' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                    <TextField 
                                        fullWidth 
                                        label={adjustment.scenario === 'TICKET' ? 'Sifat Biaya' : (adjustment.scenario === 'CAPITALIZE' ? 'Nilai Kapitalisasi' : 'Harga Jual Unit')} 
                                        type="number" 
                                        disabled={adjustment.scenario === 'TICKET' || adjustment.scenario === 'CAPITALIZE'}
                                        value={adjustment.scenario === 'TICKET' ? 0 : (adjustment.scenario === 'CAPITALIZE' ? (selectedItem.purchase_price * (adjustment.quantity || 1)) : adjustment.sale_price)} 
                                        onChange={(e) => setAdjustment({...adjustment, sale_price: Number(e.target.value)} as any)} 
                                    />
                                </Grid>

                                {adjustment.scenario === 'CAPITALIZE' && (
                                    <Grid size={{ xs: 12 }}>
                                        <TextField 
                                            fullWidth 
                                            label="Masa Manfaat (Bulan)" 
                                            type="number" 
                                            helperText="Contoh: 60 (5 Tahun). Digunakan untuk hitung penyusutan."
                                            value={(adjustment as any).capitalization_useful_life || 60} 
                                            onChange={(e) => setAdjustment({...adjustment, capitalization_useful_life: Number(e.target.value)} as any)} 
                                        />
                                    </Grid>
                                )}

                             {(adjustment.scenario === 'SALE_DEBT' || adjustment.scenario === 'SALE_CASH') && (
                                <Grid size={{ xs: 12 }}>
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Pilih Customer (Penanggung Hutang)</InputLabel>
                                            <Select 
                                                value={adjustment.entity_id || ''} 
                                                label="Pilih Customer (Penanggung Hutang)"
                                                onChange={(e) => setAdjustment({...adjustment, entity_id: e.target.value} as any)}
                                            >
                                                {customers.map(c => (
                                                    <MenuItem key={c.id} value={c.id}>{c.full_name} ({c.phone})</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField 
                                            fullWidth 
                                            label="Jatuh Tempo Bayar" 
                                            type="date" 
                                            InputLabelProps={{ shrink: true }}
                                            value={adjustment.due_date}
                                            onChange={(e) => setAdjustment({...adjustment, due_date: e.target.value} as any)}
                                        />
                                    </Stack>
                                </Grid>
                            )}

                            {adjustment.scenario === 'TICKET' && (
                                <Grid size={{ xs: 12 }}>
                                    <FormControl fullWidth sx={{ mt: 1 }}>
                                        <InputLabel>Hubungkan ke Tiket Support</InputLabel>
                                        <Select 
                                            value={adjustment.ticket_id || ''} 
                                            label="Hubungkan ke Tiket Support"
                                            onChange={(e) => setAdjustment({...adjustment, ticket_id: e.target.value} as any)}
                                        >
                                            {tickets.map(t => (
                                                <MenuItem key={t.id} value={t.id}>#{t.id} - {t.title} ({t.customer_name})</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}

                            <Grid size={{ xs: 12 }}>
                                <TextField 
                                    fullWidth 
                                    multiline
                                    rows={2}
                                    label="Catatan Pengeluaran" 
                                    placeholder="Misal: Bonus pelanggan, atau Rusak saat dipasang"
                                    value={adjustment.notes} 
                                    onChange={(e) => setAdjustment({...adjustment, notes: e.target.value} as any)} 
                                />
                            </Grid>
                        </Grid>
                    </Box>
                  )}
              </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenOutgoing(false)} sx={{ fontWeight: 700 }}>Batal</Button>
              <Button 
                onClick={handleOutgoingGoods} 
                variant="contained" 
                color="error" 
                disabled={!selectedItem || !adjustment.scenario || (adjustment.scenario === 'SALE_DEBT' && !adjustment.entity_id)}
                sx={{ fontWeight: 900, borderRadius: 2, px: 4 }}
              >
                Konfirmasi Pengeluaran
              </Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
}
