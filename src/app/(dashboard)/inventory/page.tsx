'use client';

import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Avatar, 
  Chip, TextField, InputAdornment, Grid, Paper, IconButton
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
  ArrowDownward as InIcon
} from "@mui/icons-material";

export default function InventoryPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data for UI
  const inventoryItems = [
    { id: 1, name: 'Modem FiberHome HG6145F', category: 'ONU/ONT', stock: 45, unit: 'Unit', status: 'In Stock', location: 'Gudang Utama' },
    { id: 2, name: 'Kabel Dropcore 1 Core 1000m', category: 'Kabel', stock: 12, unit: 'Roll', status: 'Low Stock', location: 'Gudang Utama' },
    { id: 3, name: 'Patch-cord SC-UPC 3m', category: 'Aksesoris', stock: 150, unit: 'Pcs', status: 'In Stock', location: 'Gudang Utama' },
    { id: 4, name: 'SFP OLT C++', category: 'Network', stock: 5, unit: 'Unit', status: 'Critical', location: 'Core Room' },
    { id: 5, name: 'Mikrotik RB1100AHx4', category: 'Router', stock: 2, unit: 'Unit', status: 'In Stock', location: 'Core Room' },
  ];

  const stats = [
    { label: 'Total Item', value: '124', icon: <InventoryIcon />, color: 'primary' },
    { label: 'Menipis', value: '8', icon: <WarningIcon />, color: 'warning' },
    { label: 'Masuk (Bulan Ini)', value: '450', icon: <InIcon />, color: 'success' },
    { label: 'Keluar (Bulan Ini)', value: '312', icon: <OutIcon />, color: 'error' },
  ];

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <InventoryIcon color="primary" /> Inventaris Barang
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Manajemen stok material dan perangkat jaringan ITNET.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
        >
          Tambah Barang
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, idx) => {
          const color = (theme.palette as any)[stat.color]?.main || theme.palette.primary.main;
          return (
            <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Avatar sx={{ bgcolor: alpha(color, 0.1), color: `${stat.color}.main`, width: 56, height: 56 }}>
                  {stat.icon}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{stat.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Cari barang atau kategori..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="disabled" />
                </InputAdornment>
              ),
            }}
          />
          <IconButton sx={{ bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <FilterIcon />
          </IconButton>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <TableCell sx={{ fontWeight: 800, pl: 4 }}>BARANG</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>KATEGORI</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STOK</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>LOKASI</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, pr: 4 }} align="right">AKSI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ pl: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: ITN-{(1000 + item.id).toString()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.stock} {item.unit}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <WarehouseIcon sx={{ fontSize: '0.9rem', color: 'text.disabled' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.location}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.status} 
                      size="small" 
                      color={item.status === 'In Stock' ? 'success' : item.status === 'Low Stock' ? 'warning' : 'error'}
                      sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem' }} 
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
                    <IconButton size="small">
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
