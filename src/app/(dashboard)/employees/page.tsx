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
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid
} from "@mui/material";
import { 
  Badge as BadgeIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  BusinessCenter as WorkIcon,
  PhoneIphone as MobileIcon,
  Home as HomeIcon,
  Payments as SalaryIcon,
  AccountBalanceWallet as WalletIcon
} from "@mui/icons-material";

export default function EmployeesPage() {
  const theme = useTheme();
  const [employees, setEmployees] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuEmployee, setMenuEmployee] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    position_id: '',
    phone: '',
    status: 'active',
    join_date: new Date().toISOString().split('T')[0],
    password: ''
  });

  const fetchData = async () => {
    const [empRes, posRes] = await Promise.all([
      fetch('/api/employees').then(res => res.json()),
      fetch('/api/positions').then(res => res.json())
    ]);
    if(empRes.success) setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    if(posRes.success) setPositions(Array.isArray(posRes.data) ? posRes.data : []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setSelectedEmployee(null);
    setFormData({ 
      full_name: '', 
      position_id: '', 
      phone: '', 
      status: 'active',
      join_date: new Date().toISOString().split('T')[0],
      password: ''
    });
    setOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditMode(true);
    setSelectedEmployee(emp);
    setFormData({
      full_name: emp.full_name,
      position_id: emp.position_id,
      phone: emp.phone || '',
      status: emp.status,
      join_date: String(emp.join_date).split('T')[0],
      password: ''
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.position_id) return;
    const url = editMode ? `/api/employees/${selectedEmployee.id}` : '/api/employees';
    const method = editMode ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) return;
    
    const res = await fetch(`/api/employees/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchData();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, emp: any) => {
    setAnchorEl(event.currentTarget);
    setMenuEmployee(emp);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuEmployee(null);
  };

  const handleActionDetail = () => {
    setSelectedEmployee(menuEmployee);
    setDetailOpen(true);
    handleMenuClose();
  };

  const handleActionEdit = () => {
    handleOpenEdit(menuEmployee);
    handleMenuClose();
  };

  const handleActionDelete = () => {
    handleDelete(menuEmployee.id);
    handleMenuClose();
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 2 }}>
                <BadgeIcon color="primary" /> Data Pegawai
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Manajemen data SDM dan teknisi ITNET.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 600, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
            >
              Tambah Pegawai
            </Button>
          </Stack>

          <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, px: 4 }}>KODE</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>NAMA PEGAWAI</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>JABATAN</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TELEPON</TableCell>
                     <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TGL BERGABUNG</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, px: 4 }}>AKSI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ px: 4, fontWeight: 700, color: 'primary.main' }}>
                        {emp.employee_code}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 700 }}>
                            {emp.full_name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{emp.full_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={emp.position_name} 
                          size="small" 
                          sx={{ fontWeight: 600, bgcolor: 'rgba(0,0,0,0.04)' }} 
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {emp.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={emp.status} 
                          size="small" 
                          color={emp.status === 'active' ? 'success' : 'default'}
                          sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {emp.join_date ? new Date(emp.join_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ px: 4 }}>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, emp)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                        <Typography color="text.secondary">Belum ada data pegawai.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editMode ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nama Lengkap"
              fullWidth
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
            <TextField
              select
              label="Jabatan"
              fullWidth
              value={formData.position_id}
              onChange={(e) => setFormData({...formData, position_id: e.target.value})}
            >
              {positions.map((pos) => (
                <MenuItem key={pos.id} value={pos.id}>{pos.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Nomor Telepon"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Status"
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
              <TextField
                label="Tanggal Bergabung"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.join_date}
                onChange={(e) => setFormData({...formData, join_date: e.target.value})}
              />
            </Stack>

            <TextField
              label={editMode ? "Kata Sandi Baru (Kosongkan jika tidak diubah)" : "Kata Sandi Login"}
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              helperText={editMode ? "Isi hanya jika ingin mengganti password pegawai" : "Password untuk login ke aplikasi mobile"}
            />

            <Divider sx={{ my: 1 }}><Chip label="Preview Gaji (Otomatis dari Jabatan)" size="small" /></Divider>

            {formData.position_id ? (
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                {(() => {
                  const pos = positions.find(p => p.id === formData.position_id);
                  if (!pos) return null;
                  return (
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Gaji Pokok</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(pos.basic_salary || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Total Tunjangan</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
                            Number(pos.allowance_pos || 0) + 
                            Number(pos.allowance_trans || 0) + 
                            Number(pos.allowance_meal || 0) + 
                            Number(pos.allowance_presence || 0)
                          )}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                        <Typography variant="body2">Potongan BPJS</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          - Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(pos.deduction_bpjs || 0)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'primary.main' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>ESTIMASI TAKE HOME PAY</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
                            Number(pos.basic_salary || 0) + 
                            Number(pos.allowance_pos || 0) + 
                            Number(pos.allowance_trans || 0) + 
                            Number(pos.allowance_meal || 0) + 
                            Number(pos.allowance_presence || 0) - 
                            Number(pos.deduction_bpjs || 0)
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })()}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic', display: 'block' }}>
                Pilih jabatan untuk melihat rincian gaji
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Batal</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: 2 }}>
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
        <MenuItem onClick={handleActionDetail}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Lihat Detail</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleActionEdit}>
          <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Edit Data</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleActionDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Hapus Pegawai</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <DialogContent sx={{ p: 0 }}>
          {selectedEmployee && (
            <Grid container sx={{ minHeight: 500 }}>
              {/* Sisi Kiri: Profil & Karir */}
              <Grid size={{ xs: 12, md: 5 }} sx={{ p: { xs: 4, md: 6 }, bgcolor: alpha(theme.palette.primary.main, 0.02), borderRight: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                  <Avatar 
                    sx={{ 
                      width: 90, 
                      height: 90, 
                      bgcolor: 'primary.main', 
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
                      fontSize: '2rem',
                      fontWeight: 800,
                      mx: 'auto',
                      mb: 2,
                      border: '4px solid white'
                    }}
                  >
                    {selectedEmployee.full_name.charAt(0)}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                    {selectedEmployee.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedEmployee.employee_code}
                  </Typography>
                  <Chip 
                    label={selectedEmployee.status === 'active' ? 'AKTIF' : 'NON-AKTIF'} 
                    size="small" 
                    color={selectedEmployee.status === 'active' ? 'success' : 'default'}
                    sx={{ height: 24, fontWeight: 900, fontSize: '0.65rem', px: 1 }}
                  />
                </Box>

                <Stack spacing={2.5}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'white', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <WorkIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Jabatan Saat Ini</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedEmployee.position_name}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'white', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                      <PhoneIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Kontak Person</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedEmployee.phone || '-'}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'white', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}>
                      <CalendarIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Bergabung Sejak</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {selectedEmployee.join_date 
                          ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(selectedEmployee.join_date)) 
                          : '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Grid>

              {/* Sisi Kanan: Rekapitulasi Gaji */}
              <Grid size={{ xs: 12, md: 7 }} sx={{ p: { xs: 4, md: 6 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <WalletIcon color="primary" /> Rincian Penggajian
                  </Typography>
                </Box>

                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>Gaji Pokok Dasar</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(selectedEmployee.basic_salary || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1.5, display: 'block', textTransform: 'uppercase' }}>Tunjangan Bulanan</Typography>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Tunj. Jabatan Struktural</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(selectedEmployee.allowance_pos || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Tunj. Transportasi & BBM</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(selectedEmployee.allowance_trans || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Uang Makan & Operasional</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(selectedEmployee.allowance_meal || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Bonus Insentif Kehadiran</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(selectedEmployee.allowance_presence || 0)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>Potongan Wajib BPJS</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      - Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(selectedEmployee.deduction_bpjs || 0))}
                    </Typography>
                  </Box>

                  <Box 
                    sx={{ 
                      mt: 3, 
                      p: 3, 
                      borderRadius: 3, 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', mb: 1 }}>Kalkulasi Gaji Bersih</Typography>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, opacity: 0.8 }}>Rp</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: -1.5 }}>
                          {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
                            Number(selectedEmployee.basic_salary || 0) + 
                            Number(selectedEmployee.allowance_pos || 0) + 
                            Number(selectedEmployee.allowance_trans || 0) + 
                            Number(selectedEmployee.allowance_meal || 0) + 
                            Number(selectedEmployee.allowance_presence || 0) - 
                            Number(selectedEmployee.deduction_bpjs || 0)
                          )}
                        </Typography>
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, letterSpacing: 0.5 }}>TAKE HOME PAY</Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }}>
                      <SalaryIcon sx={{ fontSize: '130px' }} />
                    </Box>
                  </Box>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => setDetailOpen(false)} 
                    sx={{ mt: 3, p: 1.5, borderRadius: 3, fontWeight: 800, textTransform: 'none', fontSize: '1rem' }}
                  >
                    Tutup Profil
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
