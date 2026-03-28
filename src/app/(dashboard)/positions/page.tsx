'use client';

import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from "@mui/material";
import { 
  BusinessCenter as WorkIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon
} from "@mui/icons-material";

const formatIDR = (val: number) => {
  return new Intl.NumberFormat('id-ID', { 
    maximumFractionDigits: 0 
  }).format(val || 0);
};

const parseIDR = (val: string) => {
  return Number(val.replace(/\./g, '')) || 0;
};

export default function PositionsPage() {
  const theme = useTheme();
  const [positions, setPositions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]); // For PIC selection
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPosition, setMenuPosition] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    basic_salary: 0,
    allowance_pos: 0,
    allowance_trans: 0,
    allowance_meal: 0,
    allowance_presence: 0,
    deduction_bpjs: 0,
    use_presence: 1,
    pic_id: ''
  });

  const fetchPositions = () => {
    fetch('/api/positions')
      .then(res => res.json())
      .then(data => {
        if(data.success) setPositions(data.data);
      });
  };

  const fetchEmployees = () => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if(data.success) setEmployees(data.data);
      });
  };

  useEffect(() => {
    fetchPositions();
    fetchEmployees();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setSelectedPosition(null);
    setFormData({
      name: '',
      basic_salary: 0,
      allowance_pos: 0,
      allowance_trans: 0,
      allowance_meal: 0,
      allowance_presence: 0,
      deduction_bpjs: 0,
      use_presence: 1,
      pic_id: ''
    });
    setOpen(true);
  };

  const handleOpenEdit = (pos: any) => {
    setEditMode(true);
    setSelectedPosition(pos);
    setFormData({
      name: pos.name,
      basic_salary: pos.basic_salary || 0,
      allowance_pos: pos.allowance_pos || 0,
      allowance_trans: pos.allowance_trans || 0,
      allowance_meal: pos.allowance_meal || 0,
      allowance_presence: pos.allowance_presence || 0,
      deduction_bpjs: pos.deduction_bpjs || 0,
      use_presence: pos.use_presence ?? 1,
      pic_id: pos.pic_id || ''
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) return;
    const url = editMode ? `/api/positions/${selectedPosition.id}` : '/api/positions';
    const method = editMode ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setOpen(false);
      fetchPositions();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jabatan ini?')) return;
    
    const res = await fetch(`/api/positions/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchPositions();
    } else {
      const data = await res.json();
      alert(data.message || 'Gagal menghapus jabatan.');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pos: any) => {
    setAnchorEl(event.currentTarget);
    setMenuPosition(pos);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPosition(null);
  };

  const handleActionEdit = () => {
    handleOpenEdit(menuPosition);
    handleMenuClose();
  };

  const handleActionDelete = () => {
    handleDelete(menuPosition.id);
    handleMenuClose();
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 2 }}>
                <WorkIcon color="primary" /> Data Jabatan
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Kelola daftar posisi dan jabatan pegawai ITNET.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 600, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
            >
              Tambah Jabatan
            </Button>
          </Stack>

          <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, px: 4 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>NAMA JABATAN</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>PIC (LEADER)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>GAJI POKOK</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>TOTAL PEGAWAI</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>ABSENSI</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, px: 4 }}>AKSI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.secondary', px: 4 }}>#{pos.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{pos.name}</TableCell>
                      <TableCell>
                        <Chip 
                            label={pos.pic_name || "Belum Set"} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 700, borderRadius: 1.5, borderColor: pos.pic_name ? 'primary.main' : 'divider', color: pos.pic_name ? 'primary.main' : 'text.disabled' }} 
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Rp {formatIDR(pos.basic_salary)}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: 'primary.main',
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          borderRadius: 3,
                          fontWeight: 700
                        }}>
                          {pos.employee_count || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={pos.use_presence ? "Aktif" : "Non-Aktif"} 
                          size="small" 
                          color={pos.use_presence ? "success" : "default"}
                          sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ px: 4 }}>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, pos)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit Jabatan' : 'Tambah Jabatan Baru'}</DialogTitle>
         <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nama Jabatan"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />

            <TextField
              select
              label="PIC (Supervisor/Leader)"
              fullWidth
              value={formData.pic_id}
              onChange={(e) => setFormData({...formData, pic_id: e.target.value})}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
                <option value="">-- Pilih PIC --</option>
                {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
            </TextField>
            
            <Divider sx={{ my: 1 }}><Chip label="Data Finansial Standar" size="small" /></Divider>

            <TextField
              label="Gaji Pokok (Rp)"
              fullWidth
              value={formatIDR(formData.basic_salary)}
              onChange={(e) => setFormData({...formData, basic_salary: parseIDR(e.target.value)})}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Tunj. Jabatan"
                fullWidth
                value={formatIDR(formData.allowance_pos)}
                onChange={(e) => setFormData({...formData, allowance_pos: parseIDR(e.target.value)})}
              />
              <TextField
                label="Tunj. Transpor"
                fullWidth
                value={formatIDR(formData.allowance_trans)}
                onChange={(e) => setFormData({...formData, allowance_trans: parseIDR(e.target.value)})}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Uang Makan"
                fullWidth
                value={formatIDR(formData.allowance_meal)}
                onChange={(e) => setFormData({...formData, allowance_meal: parseIDR(e.target.value)})}
              />
              <TextField
                label="Tunj. Kehadiran"
                fullWidth
                value={formatIDR(formData.allowance_presence)}
                onChange={(e) => setFormData({...formData, allowance_presence: parseIDR(e.target.value)})}
              />
            </Stack>

            <TextField
              label="Potongan BPJS (Rp)"
              fullWidth
              value={formatIDR(formData.deduction_bpjs)}
              onChange={(e) => setFormData({...formData, deduction_bpjs: parseIDR(e.target.value)})}
            />

            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Gunakan Absensi</Typography>
                  <Typography variant="caption" color="text.secondary">Gunakan data ini untuk sistem presensi & jadwal shift.</Typography>
                </Box>
                <Button 
                  size="small" 
                  variant={formData.use_presence ? "contained" : "outlined"}
                  color={formData.use_presence ? "primary" : "inherit"}
                  onClick={() => setFormData({ ...formData, use_presence: formData.use_presence ? 0 : 1 })}
                  sx={{ borderRadius: 2, minWidth: 80 }}
                >
                  {formData.use_presence ? "Aktif" : "Non-Aktif"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Batal</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: 3 }}>
            {editMode ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 150, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
      >
        <MenuItem onClick={handleActionEdit}>
          <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Edit Jabatan</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleActionDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Hapus Jabatan</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
