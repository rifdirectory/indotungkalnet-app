'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  alpha,
  useTheme,
  IconButton,
  Tooltip
} from "@mui/material";
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Inventory as ProductIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";

const formatIDR = (val: number | string) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('id-ID', { 
    maximumFractionDigits: 0 
  }).format(num || 0);
};

const parseIDR = (val: string) => {
  return val.replace(/\./g, '');
};

function ProductsContent() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: categoryFilter || 'broadband',
    billing_type: 'fixed',
    speed_mbps: '',
    price: '',
    description: ''
  });

  const fetchData = async () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if(data.success) setProducts(Array.isArray(data.data) ? data.data : []);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (categoryFilter) {
      setFormData(prev => ({ ...prev, category: categoryFilter }));
    }
  }, [categoryFilter]);

  const handleOpenAdd = () => {
    setEditMode(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      category: categoryFilter || 'broadband',
      billing_type: 'fixed',
      speed_mbps: '',
      price: '',
      description: ''
    });
    setOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditMode(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      billing_type: product.billing_type || 'fixed',
      speed_mbps: product.speed_mbps,
      price: product.price,
      description: product.description || ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    const url = editMode ? `/api/products/${selectedProduct.id}` : '/api/products';
    const method = editMode ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      handleClose();
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchData();
    }
  };

  const filteredProducts = categoryFilter 
    ? products.filter(p => p.category.toLowerCase() === categoryFilter.toLowerCase())
    : products;

  const getPageTitle = () => {
    if (!categoryFilter) return "Data Produk";
    return `Produk ${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'operator': return theme.palette.error.main;
      case 'mitra': return theme.palette.warning.main;
      case 'enterprise': return theme.palette.info.main;
      case 'broadband': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 2 }}>
                <ProductIcon color="primary" /> {getPageTitle()}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {categoryFilter 
                  ? `Daftar paket internet khusus kategori ${categoryFilter}.`
                  : "Kelola seluruh paket layanan internet ITNET (Broadband, Enterprise, Mitra, Operator)."}
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{ borderRadius: 3, fontWeight: 600, px: 3, py: 1.2 }}
            >
              Tambah Produk
            </Button>
          </Stack>

          <Card sx={{ overflow: 'hidden', borderRadius: 3 }}>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: '#f1f3f4' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Nama Produk</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Kategori</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Kecepatan</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Harga</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {product.name}
                        </Typography>
                        {product.description && (
                          <Typography variant="caption" color="text.secondary">
                            {product.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.category}
                          size="small"
                          sx={{ 
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '0.65rem',
                            bgcolor: alpha(getCategoryColor(product.category), 0.1),
                            color: getCategoryColor(product.category),
                            border: `1px solid ${alpha(getCategoryColor(product.category), 0.2)}`
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.billing_type === 'usage_based' ? 'N/A' : `${product.speed_mbps} Mbps`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                          Rp {formatIDR(product.price)}
                          {product.billing_type === 'usage_based' ? ' / MB' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEdit(product)}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus">
                            <IconButton size="small" color="error" onClick={() => handleDelete(product.id)}><DeleteIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 700 }}>
              {editMode ? 'Edit Produk' : 'Tambah Produk'}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField
                  label="Nama Produk"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Paket 100 Mbps"
                />
                
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={formData.category}
                      label="Kategori"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <MenuItem value="broadband">Broadband</MenuItem>
                      <MenuItem value="enterprise">Enterprise</MenuItem>
                      <MenuItem value="mitra">Mitra</MenuItem>
                      <MenuItem value="operator">Operator</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Model Penagihan</InputLabel>
                    <Select
                      value={formData.billing_type}
                      label="Model Penagihan"
                      onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })}
                    >
                      <MenuItem value="fixed">Bulanan / Fixed</MenuItem>
                      <MenuItem value="usage_based">Pay As You Go</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Kecepatan (Mbps)"
                    fullWidth
                    type="number"
                    disabled={formData.billing_type === 'usage_based'}
                    value={formData.billing_type === 'usage_based' ? 0 : formData.speed_mbps}
                    onChange={(e) => setFormData({ ...formData, speed_mbps: e.target.value })}
                  />
                  <TextField
                    label={formData.billing_type === 'usage_based' ? "Harga per MB (Rp)" : "Harga per Bulan (Rp)"}
                    fullWidth
                    value={formatIDR(formData.price)}
                    onChange={(e) => setFormData({ ...formData, price: parseIDR(e.target.value) })}
                  />
                </Stack>

                <TextField
                  label="Deskripsi"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan tambahan produk..."
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleClose} color="inherit">Batal</Button>
              <Button onClick={handleSubmit} variant="contained" sx={{ px: 4 }}>
                {editMode ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 5 }}>Loading products...</Box>}>
      <ProductsContent />
    </Suspense>
  );
}
