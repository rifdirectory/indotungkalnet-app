'use client';

import { useState, useEffect } from 'react';
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
  alpha,
  useTheme,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton
} from "@mui/material";
import { 
  Plus as AddIcon,
  Settings as SettingsIcon,
  Tag as TagIcon,
  ArrowLeft as BackIcon
} from "lucide-react";
import Link from 'next/link';
import Portal from '@/components/Portal';

export default function CategoriesPage() {
  const theme = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finances/categories');
      const data = await res.json();
      if(data.success) setCategories(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/finances/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if((await res.json()).success) {
        setOpenAdd(false);
        fetchCategories();
        setFormData({ name: '', type: 'expense' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>

      <Portal container={typeof document !== 'undefined' ? document.getElementById('header-actions-portal') : null}>
        <Stack direction="row" justifyContent="flex-end">
          <Button 
            variant="contained" 
            startIcon={<AddIcon size={18} />}
            onClick={() => setOpenAdd(true)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2, py: 0.5 }}
            size="small"
          >
            Kategori
          </Button>
        </Stack>
      </Portal>

      <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Nama Kategori</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tipe</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Jenis</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : categories.map((cat) => (
                <TableRow key={cat.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                            <TagIcon size={16} />
                        </Box>
                        <Typography sx={{ fontWeight: 700 }}>{cat.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} 
                        size="small" 
                        color={cat.type === 'income' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontWeight: 800, borderRadius: 1.5, textTransform: 'uppercase', fontSize: '0.65rem' }} 
                    />
                  </TableCell>
                  <TableCell>
                    {cat.is_system ? (
                        <Chip label="Sistem" size="small" variant="filled" sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
                    ) : (
                        <Chip label="Custom" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {!cat.is_system && (
                        <IconButton size="small"><SettingsIcon size={16} /></IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Tambah Kategori Baru</DialogTitle>
        <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField label="Nama Kategori" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Misal: Biaya Promosi" />
                <TextField select label="Tipe" fullWidth value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <MenuItem value="income">Pemasukan (Income)</MenuItem>
                    <MenuItem value="expense">Pengeluaran (Expense)</MenuItem>
                </TextField>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenAdd(false)}>Batal</Button>
            <Button onClick={handleCreate} variant="contained" sx={{ fontWeight: 800 }}>Tambah Kategori</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
