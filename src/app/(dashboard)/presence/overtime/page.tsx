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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme
} from "@mui/material";
import { 
  Add as AddIcon
} from "@mui/icons-material";

export default function OvertimeManagementPage() {
  const theme = useTheme();
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [openOvertime, setOpenOvertime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [overtimeForm, setOvertimeForm] = useState({
    employee_id: '',
    pic_id: '', 
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    task_desc: '',
    ticket_id: ''
  });

  const fetchData = async (currentUser?: any) => {
    const session = currentUser || user;
    let empUrl = '/api/employees';
    if (session && session.role !== 'admin') {
      empUrl += `?pic_id=${session.id}`;
    }

    try {
      const [oRes, eRes, tRes] = await Promise.all([
        fetch('/api/presence/overtime').then(res => res.json()),
        fetch(empUrl).then(res => res.json()),
        fetch('/api/support?status=active').then(res => res.json())
      ]);

      if (oRes.success) setOvertimes(oRes.data);
      if (eRes.success) setEmployees(eRes.data);
      if (tRes.success) setTickets(tRes.data);
    } catch (error) {
      console.error('Failed to fetch overtime data:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const url = `${window.location.origin}/api/auth/session`;
        const response = await fetch(url, { cache: 'no-store' });
        
        if (!response.ok) {
          fetchData();
          return;
        }
        
        const res = await response.json();
        if (res.success && res.user) {
          setUser(res.user);
          setOvertimeForm(prev => ({ ...prev, pic_id: res.user.id.toString() }));
          fetchData(res.user);
        } else {
          fetchData();
        }
      } catch (err) {
        console.error('Failed to fetch session detail:', err);
        fetchData();
      }
    };
    init();
  }, []);

  const handleCreateOvertime = async () => {
    setLoading(true);
    const res = await fetch('/api/presence/overtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overtimeForm)
    });
    if (res.ok) {
      setOpenOvertime(false);
      setOvertimeForm(prev => ({
        ...prev,
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        duration_minutes: 60,
        task_desc: '',
        ticket_id: ''
      }));
      fetchData();
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Penugasan Lembur</Typography>
          <Typography variant="body1" color="text.secondary">Kelola dan tugaskan lembur kepada teknisi lapangan.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenOvertime(true)}
          sx={{ borderRadius: 3 }}
        >
          Tambah Lembur
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 3, p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>TANGGAL</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PEGAWAI</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>DURASI</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>TUGAS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>TIKET TERKAIT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PIC (LEADER)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overtimes.map((o) => (
                <TableRow key={o.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{o.date}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{o.employee_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{o.position_name}</Typography>
                  </TableCell>
                  <TableCell>{o.duration_minutes} Menit</TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>{o.task_desc}</TableCell>
                  <TableCell>
                    {o.ticket_id ? (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>#T-{o.ticket_id}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{o.ticket_subject}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">Tanpa Tiket</Typography>
                    )}
                  </TableCell>
                  <TableCell>{o.pic_name}</TableCell>
                </TableRow>
              ))}
              {overtimes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">Tidak ada penugasan lembur.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openOvertime} onClose={() => setOpenOvertime(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: 450 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Tambah Penugasan Lembur</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label="Pilih Pegawai"
              value={overtimeForm.employee_id}
              onChange={(e) => setOvertimeForm({ ...overtimeForm, employee_id: e.target.value })}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.position_name})</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Lembur"
              InputLabelProps={{ shrink: true }}
              value={overtimeForm.date}
              onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })}
            />
            <TextField
              fullWidth
              type="number"
              label="Durasi (Menit)"
              value={overtimeForm.duration_minutes}
              onChange={(e) => setOvertimeForm({ ...overtimeForm, duration_minutes: parseInt(e.target.value) })}
            />
            <TextField
              select
              fullWidth
              label="Terhubung ke Tiket (Opsional)"
              value={overtimeForm.ticket_id}
              onChange={(e) => setOvertimeForm({ ...overtimeForm, ticket_id: e.target.value })}
              helperText="Pilih tiket support aktif jika ada"
            >
              <MenuItem value=""><em>-- Tidak ada tiket --</em></MenuItem>
              {tickets.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>#T-{t.id} - {t.category}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{t.customer_name}: {t.subject}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Deskripsi Tugas"
              placeholder="Contoh: Maintenance server NOC, Penarikan kabel FO..."
              value={overtimeForm.task_desc}
              onChange={(e) => setOvertimeForm({ ...overtimeForm, task_desc: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenOvertime(false)} color="inherit">Batal</Button>
          <Button 
            disabled={loading} 
            onClick={handleCreateOvertime} 
            variant="contained" 
            sx={{ borderRadius: 3 }}
          >
            Simpan Penugasan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
