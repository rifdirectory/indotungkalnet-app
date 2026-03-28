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
  useTheme
} from "@mui/material";
import { 
  Check as CheckIcon, 
  Close as CloseIcon 
} from "@mui/icons-material";

export default function LeaveManagementPage() {
  const theme = useTheme();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/presence/leave');
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
    fetchData();
  }, []);

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

      <Card sx={{ borderRadius: 3, p: 2 }}>
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
                  <TableCell>{l.start_date === l.end_date ? l.start_date : `${l.start_date} - ${l.end_date}`}</TableCell>
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
    </Box>
  );
}
