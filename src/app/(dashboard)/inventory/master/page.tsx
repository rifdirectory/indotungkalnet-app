'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Avatar, 
  TextField, Grid, Paper, IconButton, Button, Divider, Tabs, Tab,
  Snackbar, Alert, Chip
} from "@mui/material";
import { 
  Inventory as InventoryIcon,
  Business as WarehouseIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckIcon
} from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, DialogActions, Checkbox } from "@mui/material";

export default function MasterInventoryPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', has_sn: false });
  const [openLocForm, setOpenLocForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locForm, setLocForm] = useState({ name: '', address: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

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

  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, []);

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;
    try {
        const method = selectedCategory ? 'PUT' : 'POST';
        const res = await fetch('/api/inventory/categories', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedCategory 
                ? { ...categoryForm, id: selectedCategory.id, user: 'Admin' } 
                : { ...categoryForm, user: 'Admin' })
        });
        const data = await res.json();
        if (data.success) {
            setSnackbar({ open: true, message: `Kategori berhasil ${selectedCategory ? 'diperbarui' : 'ditambahkan'}`, type: 'success' });
            setCategoryForm({ name: '', description: '', has_sn: false });
            setSelectedCategory(null);
            setOpenForm(false);
            fetchCategories();
        }
    } catch (err) {}
  };

  const handleDeleteCategory = async (id: number) => {
      if (!confirm('Hapus kategori ini? Pastikan tidak ada barang yang sedang menggunakan kategori ini.')) return;
      try {
          const res = await fetch(`/api/inventory/categories?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
              setSnackbar({ open: true, message: 'Kategori berhasil dihapus', type: 'success' });
              fetchCategories();
          }
      } catch (err) {}
  };

  const handleSaveLocation = async () => {
    if (!locForm.name) return;
    try {
        const method = selectedLocation ? 'PUT' : 'POST';
        const res = await fetch('/api/inventory/locations', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedLocation 
                ? { ...locForm, id: selectedLocation.id, user: 'Admin' } 
                : { ...locForm, user: 'Admin' })
        });
        const data = await res.json();
        if (data.success) {
            setSnackbar({ open: true, message: `Lokasi berhasil ${selectedLocation ? 'diperbarui' : 'ditambahkan'}`, type: 'success' });
            setLocForm({ name: '', address: '' });
            setSelectedLocation(null);
            setOpenLocForm(false);
            fetchLocations();
        }
    } catch (err) {}
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Hapus lokasi ini?')) return;
    try {
        const res = await fetch(`/api/inventory/locations?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            setSnackbar({ open: true, message: 'Lokasi berhasil dihapus', type: 'success' });
            fetchLocations();
        }
    } catch (err) {}
  };

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>

      <Stack direction="row" spacing={2} sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: -0.1 }}>
          <Tab 
            icon={<CategoryIcon sx={{ fontSize: 20 }} />} 
            iconPosition="start" 
            label="Kategori Barang" 
            sx={{ fontWeight: 900, px: 4, minHeight: 64 }} 
          />
          <Tab 
            icon={<WarehouseIcon sx={{ fontSize: 20 }} />} 
            iconPosition="start" 
            label="Lokasi Gudang" 
            sx={{ fontWeight: 900, px: 4, minHeight: 64 }} 
          />
        </Tabs>
      </Stack>

      <Box sx={{ mt: 4 }}>
        {tabValue === 0 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Manajemen Kategori</Typography>
                    <Typography variant="body2" color="text.secondary">Kelola daftar label kategori dan aturan wajib SN perangkat ITNET.</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    onClick={() => {
                        setSelectedCategory(null);
                        setCategoryForm({ name: '', description: '', has_sn: false });
                        setOpenForm(true);
                    }}
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 3, fontWeight: 900, px: 3, boxShadow: 2 }}
                >
                    Tambah Kategori
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 900, pl: 3 }}>KATEGORI</TableCell>
                            <TableCell sx={{ fontWeight: 900 }}>DESKRIPSI</TableCell>
                            <TableCell sx={{ fontWeight: 900 }} align="center">STATUS SN</TableCell>
                            <TableCell sx={{ fontWeight: 900, pr: 3 }} align="right">AKSI</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((cat) => (
                            <TableRow key={cat.id} hover>
                                <TableCell sx={{ py: 2, pl: 3 }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 32, height: 32 }}>
                                            <CategoryIcon sx={{ fontSize: 18 }} />
                                        </Avatar>
                                        <Typography sx={{ fontWeight: 800 }}>{cat.name}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">{cat.description || '-'}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    {cat.has_sn ? (
                                        <Chip 
                                            label="WAJIB SN" 
                                            size="small" 
                                            color="primary" 
                                            sx={{ fontWeight: 900, borderRadius: 1.5, fontSize: '0.65rem' }} 
                                        />
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">Opsional</Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 3 }}>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => { 
                                            setSelectedCategory(cat); 
                                            setCategoryForm({ name: cat.name, description: cat.description || '', has_sn: !!cat.has_sn }); 
                                            setOpenForm(true); 
                                        }} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteCategory(cat.id)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                        {categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">Belum ada kategori terdaftar.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Form for Category */}
            <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 900 }}>{selectedCategory ? 'Edit Kategori' : 'Kategori Baru'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField 
                            fullWidth 
                            label="Nama Kategori" 
                            value={categoryForm.name} 
                            onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} 
                        />
                        <TextField 
                            fullWidth 
                            multiline 
                            rows={3} 
                            label="Deskripsi" 
                            value={categoryForm.description} 
                            onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} 
                        />
                        <Paper 
                            elevation={0} 
                            onClick={() => setCategoryForm({...categoryForm, has_sn: !categoryForm.has_sn})}
                            sx={{ 
                                p: 2, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2, 
                                bgcolor: categoryForm.has_sn ? alpha(theme.palette.primary.main, 0.05) : 'rgba(0,0,0,0.02)', 
                                border: '1px solid', 
                                borderColor: categoryForm.has_sn ? 'primary.main' : 'divider',
                                borderRadius: 3,
                                cursor: 'pointer'
                            }}
                        >
                            <Checkbox checked={categoryForm.has_sn} sx={{ p: 0 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, display: 'block' }}>Pelacakan SN</Typography>
                                <Typography variant="caption" color="text.secondary">Wajibkan input Serial Number untuk kategori ini.</Typography>
                            </Box>
                        </Paper>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenForm(false)} sx={{ fontWeight: 700 }}>Batal</Button>
                    <Button variant="contained" onClick={handleSaveCategory} sx={{ px: 4, borderRadius: 2, fontWeight: 900 }}>Simpan</Button>
                </DialogActions>
            </Dialog>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>Manajemen Lokasi / Gudang</Typography>
                    <Typography variant="body2" color="text.secondary">Daftar lokasi fisik penyimpanan perangkat ITNET.</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    color="warning"
                    onClick={() => {
                        setSelectedLocation(null);
                        setLocForm({ name: '', address: '' });
                        setOpenLocForm(true);
                    }}
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 3, fontWeight: 900, px: 3, boxShadow: 2 }}
                >
                    Tambah Lokasi
                </Button>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 900, pl: 3 }}>LOKASI GUDANG</TableCell>
                            <TableCell sx={{ fontWeight: 900 }}>ALAMAT / KETERANGAN</TableCell>
                            <TableCell sx={{ fontWeight: 900, pr: 3 }} align="right">AKSI</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {locations.map((loc) => (
                            <TableRow key={loc.id} hover>
                                <TableCell sx={{ py: 2, pl: 3 }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 32, height: 32 }}>
                                            <WarehouseIcon sx={{ fontSize: 18 }} />
                                        </Avatar>
                                        <Typography sx={{ fontWeight: 800 }}>{loc.name}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">{loc.address || '-'}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 3 }}>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => { 
                                            setSelectedLocation(loc); 
                                            setLocForm({ name: loc.name, address: loc.address || '' }); 
                                            setOpenLocForm(true); 
                                        }} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteLocation(loc.id)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                        {locations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">Belum ada lokasi terdaftar.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Form for Location */}
            <Dialog open={openLocForm} onClose={() => setOpenLocForm(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 900 }}>{selectedLocation ? 'Edit Lokasi' : 'Lokasi Gudang Baru'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField 
                            fullWidth 
                            label="Nama Lokasi / Gudang" 
                            value={locForm.name} 
                            onChange={(e) => setLocForm({...locForm, name: e.target.value})} 
                        />
                        <TextField 
                            fullWidth 
                            multiline 
                            rows={3} 
                            label="Alamat / Keterangan" 
                            value={locForm.address} 
                            onChange={(e) => setLocForm({...locForm, address: e.target.value})} 
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenLocForm(false)} sx={{ fontWeight: 700 }}>Batal</Button>
                    <Button variant="contained" color="warning" onClick={handleSaveLocation} sx={{ px: 4, borderRadius: 2, fontWeight: 900 }}>Simpan</Button>
                </DialogActions>
            </Dialog>
          </Box>
        )}
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.type} variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
