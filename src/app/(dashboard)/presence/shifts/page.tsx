'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, IconButton, 
  Tooltip, Divider, Chip
} from "@mui/material";
import { 
  AccessTime as AccessTimeIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from "@mui/icons-material";

export default function ShiftsPage() {
  const theme = useTheme();
  const [shifts, setShifts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '08:00',
    end_time: '17:00',
    color: '#0a84ff'
  });

  const fetchShifts = () => {
    fetch('/api/presence/shifts')
      .then(res => res.json())
      .then(data => {
        if(data.success) setShifts(data.data);
      });
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setSelectedShift(null);
    setFormData({ name: '', start_time: '08:00', end_time: '17:00', color: '#0a84ff' });
    setOpen(true);
  };

  const handleOpenEdit = (shift: any) => {
    setEditMode(true);
    setSelectedShift(shift);
    setFormData({
      name: shift.name,
      start_time: shift.start_time.substring(0, 5),
      end_time: shift.end_time.substring(0, 5),
      color: shift.color
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;
    const url = editMode ? `/api/presence/shifts/${selectedShift.id}` : '/api/presence/shifts';
    const method = editMode ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setOpen(false);
      fetchShifts();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus aturan shift ini?')) return;
    const res = await fetch(`/api/presence/shifts/${id}`, { method: 'DELETE' });
    if (res.ok) fetchShifts();
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccessTimeIcon color="primary" /> Aturan Shift
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Definisikan waktu kerja dan shift untuk seluruh pegawai.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 600 }}
        >
          Tambah Shift
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, px: 4 }}>NAMA SHIFT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>JAM MASUK</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>JAM PULANG</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>LABEL</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, px: 4 }}>AKSI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id} hover>
                  <TableCell sx={{ fontWeight: 700, px: 4 }}>{shift.name}</TableCell>
                  <TableCell>{shift.start_time.substring(0, 5)}</TableCell>
                  <TableCell>{shift.end_time.substring(0, 5)}</TableCell>
                  <TableCell>
                    <Box sx={{ width: 40, height: 20, bgcolor: shift.color, borderRadius: 1 }} />
                  </TableCell>
                  <TableCell align="right" sx={{ px: 4 }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => handleOpenEdit(shift)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(shift.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 4, minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit Shift' : 'Tambah Shift Baru'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              label="Nama Shift" 
              fullWidth 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Shift Pagi"
            />
            <Stack direction="row" spacing={2}>
              <TextField 
                label="Jam Masuk" 
                type="time" 
                fullWidth 
                InputLabelProps={{ shrink: true }}
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
              <TextField 
                label="Jam Pulang" 
                type="time" 
                fullWidth 
                InputLabelProps={{ shrink: true }}
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </Stack>
            <TextField 
              label="Warna Label (Hex)" 
              fullWidth 
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#000000"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Batal</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ px: 4, borderRadius: 2 }}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
