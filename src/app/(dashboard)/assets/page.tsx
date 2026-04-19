'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  AccountBalance as AssetIcon, 
  Delete as DeleteIcon,
  Timeline as DepreciationIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  KeyboardReturn as ReturnIcon
} from '@mui/icons-material';

const categories = [
  { value: 'land', label: 'Tanah (Land)' },
  { value: 'infrastructure', label: 'Infrastruktur (Tower/Kabel)' },
  { value: 'equipment', label: 'Perangkat (OLT/Router/Server)' },
  { value: 'vehicle', label: 'Kendaraan (Vehicle)' },
  { value: 'other', label: 'Lainnya' }
];

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'equipment',
    purchase_date: new Date().toISOString().split('T')[0],
    cost_price: 0,
    useful_life_months: 60,
    location: '',
    notes: ''
  });
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedAssetForReturn, setSelectedAssetForReturn] = useState<any>(null);
  const [returnForm, setReturnForm] = useState({ condition: 'used', notes: '' });

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets/fixed-assets');
      const data = await res.json();
      if (data.success) setAssets(data.data);
    } catch (error) {
      console.error('Fetch assets error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAddAsset = async () => {
    try {
      const res = await fetch('/api/assets/fixed-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      const data = await res.json();
      if (data.success) {
        setOpen(false);
        fetchAssets();
      }
    } catch (error) {
      console.error('Add asset error:', error);
    }
  };
  const handleReturnAsset = async () => {
    if (!selectedAssetForReturn) return;
    try {
      const res = await fetch('/api/assets/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: selectedAssetForReturn.id,
          condition: returnForm.condition,
          notes: returnForm.notes,
          user: 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setReturnDialogOpen(false);
        fetchAssets();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Return asset error:', error);
    }
  };

  const calculateTotalValue = () => assets.reduce((sum, a) => sum + Number(a.current_value), 0);
  const calculateTotalCost = () => assets.reduce((sum, a) => sum + Number(a.cost_price), 0);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">Managemen Aset Tetap</Typography>
          <Typography variant="body2" color="text.secondary">Kelola daftar kekayaan fisik dan nilai penyusutan infrastruktur ITNET</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: 2 }}>
          Tambah Aset Manual
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" opacity={0.8}>Total Nilai Buku (Current)</Typography>
              <Typography variant="h4" fontWeight="bold">Rp {calculateTotalValue().toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Investasi Aset (Initial Cost)</Typography>
              <Typography variant="h4" fontWeight="bold">Rp {calculateTotalCost().toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Akumulasi Penyusutan</Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                Rp {(calculateTotalCost() - calculateTotalValue()).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell>Nama Aset</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Tgl Akuisisi</TableCell>
              <TableCell align="right">Harga Beli</TableCell>
              <TableCell align="right">Nilai Sekarang</TableCell>
              <TableCell>SN / Lokasi</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}>Belum ada aset terdaftar</TableCell></TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssetIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2">{asset.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{asset.location || 'Lokasi tidak diset'}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={asset.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{new Date(asset.purchase_date).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell align="right">Rp {Number(asset.cost_price).toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rp {Number(asset.current_value).toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{asset.serial_number || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{asset.location || 'Lokasi tidak diset'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={asset.status === 'active' ? 'TERPASANG' : 'DITARIK'} 
                      color={asset.status === 'active' ? 'success' : 'default'} 
                      size="small" 
                      sx={{ fontWeight: 900, borderRadius: 1.5, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {asset.status === 'active' && asset.inventory_item_id && (
                        <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => {
                                setSelectedAssetForReturn(asset);
                                setReturnDialogOpen(true);
                            }}
                            title="Tarik Barang ke Gudang"
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                        >
                            <ReturnIcon fontSize="small" />
                        </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Manual Add Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Aktiva Tetap Baru</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Nama Aset" 
                value={newAsset.name} 
                onChange={(e) => setNewAsset({...newAsset, name: e.target.value})} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                select fullWidth label="Kategori" 
                value={newAsset.category} 
                onChange={(e) => setNewAsset({...newAsset, category: e.target.value})}
              >
                {categories.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth type="date" label="Tanggal Pembelian" 
                value={newAsset.purchase_date} 
                onChange={(e) => setNewAsset({...newAsset, purchase_date: e.target.value})} 
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth type="number" label="Harga Perolehan (Rp)" 
                value={newAsset.cost_price} 
                onChange={(e) => setNewAsset({...newAsset, cost_price: e.target.value})} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth type="number" label="Masa Manfaat (Bulan)" 
                value={newAsset.useful_life_months} 
                onChange={(e) => setNewAsset({...newAsset, useful_life_months: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Lokasi Penempatan" 
                value={newAsset.location} 
                onChange={(e) => setNewAsset({...newAsset, location: e.target.value})} 
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleAddAsset}>Simpan Aset</Button>
        </DialogActions>
      </Dialog>

      {/* Return Asset Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Tarik Barang ke Gudang</DialogTitle>
        <DialogContent dividers>
          {selectedAssetForReturn && (
            <>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Anda akan menarik <strong>{selectedAssetForReturn.name}</strong> kembali ke stok gudang sebagai barang bekas.
              </Typography>
              <Stack spacing={3}>
                <TextField
                  select
                  fullWidth
                  label="Kondisi Barang saat ditarik"
                  value={returnForm.condition}
                  onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                >
                  <MenuItem value="used">Bekas (Masih Layak Pakai)</MenuItem>
                  <MenuItem value="broken">Rusak (Perlu Perbaikan)</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Alasan Penarikan / Catatan"
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                />
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReturnDialogOpen(false)} sx={{ fontWeight: 700 }}>Batal</Button>
          <Button variant="contained" color="primary" onClick={handleReturnAsset} sx={{ px: 4, borderRadius: 2, fontWeight: 900 }}>
            Proses Penarikan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
