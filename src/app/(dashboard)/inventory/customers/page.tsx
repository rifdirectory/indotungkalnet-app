'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Avatar, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  CircularProgress, Alert, Snackbar, InputBase, Paper
} from "@mui/material";
import { 
  People as PeopleIcon,
  Add as AddIcon,
  Search as SearchIcon,
  WhatsApp as WhatsAppIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon
} from "@mui/icons-material";

export default function LogisticsCustomersPage() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        address: '',
        email: '',
        customer_type: 'logistics',
        status: 'active'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/customers?type=logistics');
            const result = await res.json();
            if (result.success) {
                setCustomers(result.data);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAdd = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({
            full_name: '',
            phone_number: '',
            address: '',
            email: '',
            customer_type: 'logistics',
            status: 'active'
        });
        setOpen(true);
    };

    const handleOpenEdit = (customer: any) => {
        setEditMode(true);
        setSelectedId(customer.id);
        setFormData({
            full_name: customer.full_name,
            phone_number: customer.phone_number || '',
            address: customer.address || '',
            email: customer.email || '',
            customer_type: 'logistics',
            status: customer.status || 'active'
        });
        setOpen(true);
    };

    const handleSubmit = async () => {
        const url = editMode ? `/api/customers/${selectedId}` : '/api/customers';
        const method = editMode ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.success) {
                setSnackbar({ open: true, message: `Customer berhasil ${editMode ? 'diperbarui' : 'ditambahkan'}`, type: 'success' });
                setOpen(false);
                fetchData();
            }
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message, type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus customer logistik ini?')) return;
        try {
            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSnackbar({ open: true, message: 'Customer berhasil dihapus', type: 'success' });
                fetchData();
            }
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message, type: 'error' });
        }
    };

    const filtered = customers.filter(c => 
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone_number || '').includes(searchTerm)
    );

    if (loading && customers.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 4 }}>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleOpenAdd}
                    sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 800, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                >
                    Tambah Customer Logistik
                </Button>
            </Stack>

            <Card sx={{ borderRadius: 5, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        bgcolor: 'background.paper', 
                        px: 2, 
                        py: 0.75, 
                        borderRadius: 4,
                        width: 400,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                        <InputBase
                            placeholder="Cari nama atau nomor WhatsApp..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ color: 'text.primary', fontSize: '0.9rem', width: '100%' }}
                        />
                    </Box>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                <TableCell sx={{ fontWeight: 900, pl: 4 }}>NAMA CUSTOMER</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>WHATSAPP</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>ALAMAT</TableCell>
                                <TableCell sx={{ fontWeight: 900 }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 900, pr: 4 }} align="right">AKSI</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((customer) => (
                                <TableRow key={customer.id} hover>
                                    <TableCell sx={{ pl: 4 }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800, borderRadius: 2 }}>
                                                {customer.full_name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }}>{customer.full_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{customer.email || 'No Email'}</Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Button 
                                            size="small" 
                                            startIcon={<WhatsAppIcon sx={{ fontSize: '1rem' }} />}
                                            href={`https://wa.me/${customer.phone_number?.replace(/\D/g, '')}`}
                                            target="_blank"
                                            sx={{ fontWeight: 700, borderRadius: 2, color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.05) }}
                                        >
                                            {customer.phone_number || '-'}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <LocationIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{customer.address || '-'}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main', textTransform: 'uppercase' }}>
                                            {customer.status}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ pr: 4 }}>
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" onClick={() => handleOpenEdit(customer)}>
                                                <EditIcon fontSize="small" color="primary" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(customer.id)}>
                                                <DeleteIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Belum ada customer logistik yang terdaftar.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 900 }}>{editMode ? 'Edit' : 'Tambah'} Customer Logistik</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField 
                            fullWidth 
                            label="Nama Lengkap" 
                            variant="outlined"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        />
                        <TextField 
                            fullWidth 
                            label="Nomor WhatsApp" 
                            placeholder="62812..."
                            value={formData.phone_number}
                            onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                        />
                        <TextField 
                            fullWidth 
                            label="Email (Opsional)" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                        <TextField 
                            fullWidth 
                            label="Alamat Lengkap" 
                            multiline
                            rows={3}
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700 }}>Batal</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        disabled={!formData.full_name}
                        sx={{ fontWeight: 900, borderRadius: 2, px: 4 }}
                    >
                        {editMode ? 'Simpan Perubahan' : 'Tambah Customer'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.type as any} sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
