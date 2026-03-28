'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  InputBase,
  Chip,
  alpha,
  useTheme
} from "@mui/material";
import { 
  Inventory as InventoryIcon, 
  Smartphone as SmartphoneIcon, 
  Router as CpuIcon, 
  Add as AddIcon, 
  Search as SearchIcon,
  Warning as WarningIcon
} from "@mui/icons-material";

export default function InventoryPage() {
  const theme = useTheme();
  const [stockItems, setStockItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => {
        if(data.success) setStockItems(Array.isArray(data.data) ? data.data : []);
      });
  }, []);

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
                Inventory & Stock
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Kelola perangkat network dan perlengkapan teknisi ITNET.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ borderRadius: 3, 
fontWeight: 600 }}
            >
              Tambah Barang
            </Button>
          </Stack>

          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              { label: "Total Items", value: "452", icon: <InventoryIcon />, color: 'success.main' },
              { label: "ONT/ONU Deployed", value: "1,120", icon: <SmartphoneIcon />, color: 'warning.main' },
              { label: "Router Stock", value: "28", icon: <CpuIcon />, color: 'primary.main' },
              { label: "Low Stock Alerts", value: "4 Items", icon: <WarningIcon />, color: 'error.main' },
            ].map((stat) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.label}>
                <Card sx={{ p: 3, borderBottom: '3px solid', borderBottomColor: stat.color, borderRadius: 3 }}>
                  <Box sx={{ color: stat.color, mb: 1.5 }}>{stat.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{stat.value}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ overflow: 'hidden', borderRadius: 3 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'rgba(0, 0, 0, 0.03)', 
                px: 2, 
                py: 0.75, 
                borderRadius: 3,
                width: 320,
                border: '1px solid rgba(0, 0, 0, 0.06)',
              }}>
                <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
                <InputBase
                  placeholder="Cari perangkat, SN, atau brand..."
                  sx={{ color: 'text.primary', fontSize: '0.875rem', width: '100%' }}
                />
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f1f3f4' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Brand</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Current Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.item_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{item.category}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{item.item_code}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.stock} Unit</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.status} 
                          size="small" 
                          sx={{ 
                            height: 22, 
                            fontSize: '0.625rem', 
                            fontWeight: 800, 
                            textTransform: 'uppercase',
                            bgcolor: alpha(
                              item.status === 'In Stock' ? theme.palette.success.main : 
                              item.status === 'Low Stock' ? theme.palette.warning.main : 
                              theme.palette.error.main, 0.1
                            ),
                            color: 
                              item.status === 'In Stock' ? 'success.main' : 
                              item.status === 'Low Stock' ? 'warning.main' : 
                              'error.main',
                            borderRadius: 3,
                            border: '1px solid'
                          }} 
                        />
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
