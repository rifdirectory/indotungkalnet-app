'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  IconButton, Tooltip, Chip, Avatar, Grid, Autocomplete, Checkbox
} from "@mui/material";
import { 
  Assignment as TaskIcon, 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as DoneIcon,
  PendingActions as PendingIcon,
  PlayArrow as ProgressIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon
} from "@mui/icons-material";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function TasksPage() {
  const theme = useTheme();
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    employee_ids: [] as number[],
    title: '',
    description: '',
    due_date: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
        const [taskRes, empRes] = await Promise.all([
          fetch('/api/tasks').then(res => res.json()),
          fetch('/api/employees').then(res => res.json())
        ]);
        if(taskRes.success) setTasks(taskRes.data);
        if(empRes.success) setEmployees(empRes.data.filter((e: any) => e.use_presence === 1));
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (data.success) {
      setOpen(false);
      setFormData({ employee_ids: [], title: '', description: '', due_date: '' });
      fetchData();
    } else {
      alert(data.message || 'Gagal membuat tugas');
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('Hapus tugas ini?')) return;
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed': return <Chip size="small" icon={<DoneIcon />} label="Selesai" color="success" sx={{ fontWeight: 800, borderRadius: 1.5 }} />;
      case 'in_progress': return <Chip size="small" icon={<ProgressIcon />} label="Proses" color="primary" sx={{ fontWeight: 800, borderRadius: 1.5 }} />;
      default: return <Chip size="small" icon={<PendingIcon />} label="Menunggu" color="warning" sx={{ fontWeight: 800, borderRadius: 1.5 }} />;
    }
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TaskIcon color="primary" /> Penugasan Tim
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Buat tugas dan tunjuk satu atau beberapa orang teknisi sekaligus.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
        >
          Buat Penugasan Baru
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 25px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, px: 4 }}>TUGAS / PEKERJAAN</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>TIM TEKNISI</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>DEADLINE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, px: 4 }}>AKSI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell sx={{ px: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                        {task.employee_names?.split(',')[0].trim().charAt(0)}
                      </Avatar>
                      <Tooltip title={task.employee_names || 'Belum ditugaskan'}>
                        <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.employee_names || 'Unassigned'}
                        </Typography>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(task.status)}</TableCell>
                  <TableCell align="right" sx={{ px: 4 }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Hapus">
                        <IconButton size="small" color="error" onClick={() => handleDelete(task.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>Belum ada tugas yang dibuat.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 4, minWidth: 500 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Buat Penugasan Baru</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              multiple
              options={employees}
              disableCloseOnSelect
              getOptionLabel={(option) => option.full_name}
              value={employees.filter(e => formData.employee_ids.includes(e.id))}
              onChange={(_, value) => setFormData({ ...formData, employee_ids: value.map(v => v.id) })}
              getOptionDisabled={(option) => option.current_status === 'Izin'}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                const isIzin = option.current_status === 'Izin';
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                      disabled={isIzin}
                    />
                    <Box sx={{ flexGrow: 1, opacity: isIzin ? 0.5 : 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: isIzin ? 400 : 600 }}>
                            {option.full_name} 
                            {isIzin && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'error.main', fontWeight: 900 }}>(SEDANG IZIN)</Typography>}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {option.position_name}
                        </Typography>
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Pilih Anggota Tim (Bisa Banyak)" placeholder="Cari nama pegawai..." />
              )}
            />
            <TextField
              fullWidth
              label="Judul Tugas"
              placeholder="Contoh: Perbaikan FO Jalan Melati"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Deskripsi Detail"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              fullWidth
              type="datetime-local"
              label="Batas Waktu (Deadline)"
              InputLabelProps={{ shrink: true }}
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Batal</Button>
          <Button onClick={handleCreate} variant="contained" sx={{ borderRadius: 2, px: 4 }}>Kirim Tugas</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
