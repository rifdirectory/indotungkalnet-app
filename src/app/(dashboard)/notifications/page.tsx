'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  FormGroup, 
  Divider, 
  Alert, 
  Snackbar, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Chip
} from '@mui/material';
import { 
  Send as SendIcon, 
  Search as SearchIcon, 
  Person as PersonIcon, 
  NotificationsActive as NotifIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import Link from 'next/link';

interface Employee {
  id: number;
  full_name: string;
  employee_code: string;
  phone: string | null;
}

export default function NotificationsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('Fetch employees failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: number, hasPhone: boolean) => {
    if (!hasPhone) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(filteredEmployees.filter(e => e.phone).map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const sendNotification = async () => {
    if (selectedIds.length === 0) return;
    if (!message) return; // Title is optional for WA

    setSending(true);
    setStatus(null);

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_ids: selectedIds,
          title: title,
          body: message
        })
      });

      const result = await response.json();
      if (result.success) {
        setStatus({ type: 'success', msg: result.message });
        setTitle('');
        setMessage('');
        setSelectedIds([]);
      } else {
        setStatus({ type: 'error', msg: result.message });
      }
    } catch (error: any) {
      setStatus({ type: 'error', msg: 'Terjadi kesalahan sistem.' });
    } finally {
      setSending(false);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.full_name.toLowerCase().includes(search.toLowerCase()) || 
    e.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        {/* User Selection Card */}
        <Card sx={{ flex: 1, width: '100%', borderRadius: 4, height: 600, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Target Penerima</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Cari nama atau ID Pegawai..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <FormControlLabel
              control={
                <Checkbox 
                  checked={selectedIds.length === filteredEmployees.filter(e => e.phone).length && selectedIds.length > 0} 
                  onChange={handleSelectAll}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredEmployees.filter(e => e.phone).length}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Pilih Semua ({filteredEmployees.filter(e => e.phone).length})</Typography>}
              sx={{ mb: 1, ml: 1 }}
            />

            <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
              ) : filteredEmployees.length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Tidak ada karyawan yang ditemukan.</Typography>
                </Box>
              ) : (
                <List>
                  {filteredEmployees.map((e) => (
                    <ListItem 
                      key={e.id} 
                      disablePadding
                      sx={{ 
                        mb: 0.5, 
                        borderRadius: 2,
                        opacity: e.phone ? 1 : 0.6,
                        bgcolor: selectedIds.includes(e.id) ? 'action.hover' : 'transparent'
                      }}
                    >
                      <ListItemButton onClick={() => handleToggle(e.id, !!e.phone)} sx={{ borderRadius: 2 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Checkbox 
                            checked={selectedIds.includes(e.id)} 
                            disabled={!e.phone}
                            disableRipple 
                          />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.full_name}</Typography>
                              {!e.phone && (
                                <Chip label="No WA Tidak Ada" size="small" variant="outlined" color="default" sx={{ height: 16, fontSize: '0.6rem' }} />
                              )}
                            </Stack>
                          }
                          secondary={e.employee_code}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Message Creation Card */}
        <Card sx={{ flex: 1, width: '100%', borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Pesan Notifikasi</Typography>
            
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
                  JUDUL NOTIFIKASI
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Contoh: Pengumuman Penting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>
                  ISI PESAN
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Tuliskan pesan Anda di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>

              <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 3, opacity: 0.8 }}>
                <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                  📍 Tips:
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Notifikasi akan dikirimkan ke {selectedIds.length} karyawan terpilih. Pastikan isi pesan sudah benar sebelum dikirim.
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                disabled={sending || selectedIds.length === 0 || !title || !message}
                onClick={sendNotification}
                sx={{ 
                  borderRadius: 3, 
                  py: 1.5,
                  boxShadow: 'none',
                  fontWeight: 700,
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                {sending ? 'Mengirim...' : 'Kirim Sekarang'}
              </Button>

              {status && (
                <Alert 
                  severity={status.type} 
                  icon={status.type === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
                  sx={{ borderRadius: 3 }}
                >
                  {status.msg}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Snackbar
        open={!!status}
        autoHideDuration={6000}
        onClose={() => setStatus(null)}
        message={status?.msg}
      />
    </Box>
  );
}

const ListItemButton = (props: any) => {
    return <Box component="div" sx={{ display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer', ...props.sx }} onClick={props.onClick}>{props.children}</Box>
}
