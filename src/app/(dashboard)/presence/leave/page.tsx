'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip,
  IconButton,
  Tabs,
  Tab,
  alpha,
  useTheme,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  LinearProgress
} from "@mui/material";
import { 
  Check as CheckIcon, 
  Close as CloseIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import { formatToJakartaDate } from '@/lib/dateUtils';

export default function LeaveManagementPage() {
  const theme = useTheme();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      if (search) params.append('search', search);

      const res = await fetch(`/api/presence/leave?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, month, year, search]);

  const handleUpdateLeave = async (id: number, status: string) => {
    const res = await fetch('/api/presence/leave', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, approved_by: 1 }) // Hardcoded admin ID
    });
    if (res.ok) fetchData();
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Permohonan Izin</Typography>
        <Typography variant="body1" color="text.secondary">Tinjau dan setujui permohonan izin, sakit, atau cuti pegawai.</Typography>
      </Box>

      {!mounted ? null : (
      <Card sx={{ borderRadius: 3, p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            size="small"
            placeholder="Cari nama pegawai..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={20} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Bulan</InputLabel>
            <Select value={month} label="Bulan" onChange={(e) => setMonth(Number(e.target.value))}>
              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                <MenuItem key={i} value={i + 1}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Tahun</InputLabel>
            <Select value={year} label="Tahun" onChange={(e) => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Tabs 
          value={statusFilter} 
          onChange={(_, val) => setStatusFilter(val)}
          sx={{ 
            mb: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 700, px: 3 }
          }}
        >
          <Tab label="Pending" value="pending" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
          <Tab label="Semua" value="all" />
        </Tabs>
        <Box sx={{ height: 4 }}>
          {loading && <LinearProgress />}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>PEGAWAI</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>JENIS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>TANGGAL</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ALASAN</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>AKSI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{l.employee_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.position_name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={l.type.toUpperCase()} size="small" color={l.type === 'sakit' ? 'warning' : 'primary'} variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    {l.start_date === l.end_date 
                      ? formatToJakartaDate(l.start_date) 
                      : `${formatToJakartaDate(l.start_date)} - ${formatToJakartaDate(l.end_date)}`}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>{l.reason}</TableCell>
                  <TableCell>
                    <Chip 
                      label={l.status.toUpperCase()} 
                      size="small" 
                      color={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'error' : 'default'} 
                      sx={{ fontWeight: 700 }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    {l.status === 'pending' && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton color="success" onClick={() => handleUpdateLeave(l.id, 'approved')}><CheckIcon /></IconButton>
                        <IconButton color="error" onClick={() => handleUpdateLeave(l.id, 'rejected')}><CloseIcon /></IconButton>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leaves.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center">Tidak ada permohonan izin.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      )}
    </Box>
  );
}
