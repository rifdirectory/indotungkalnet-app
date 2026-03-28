'use client';

import React, { useState, useEffect } from 'react';
import LiveTimer from './LiveTimer';
import { 
  Box, Typography, Paper, Chip, Avatar, Stack, 
  Button, TextField, Dialog, DialogTitle, DialogContent, 
  IconButton, Select, MenuItem, FormControl, InputLabel, Divider,
  Card, Autocomplete, CircularProgress, DialogActions,
  Grid
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { 
  Message as MessageIcon, 
  AccessTime as ClockIcon, 
  CheckCircle as CheckIcon, 
  MoreVert as MoreIcon, 
  Add as AddIcon,
  Speed as SpeedIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Label as LabelIcon,
  PriorityHigh as PriorityIcon,
  Assignment as TaskIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon
} from "@mui/icons-material";

const TimelineItem = ({ label, time, active, isFirst, isLast }: any) => (
  <Stack direction="row" spacing={2} sx={{ position: 'relative' }}>
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      minWidth: 20
    }}>
      <Box sx={{ 
        width: 10, 
        height: 10, 
        borderRadius: '50%', 
        bgcolor: active ? 'primary.main' : 'grey.300',
        zIndex: 1,
        mt: 0.8,
        boxShadow: active ? `0 0 0 4px ${alpha('#0a84ff', 0.15)}` : 'none'
      }} />
      {!isLast && (
        <Box sx={{ 
          width: 2, 
          flexGrow: 1, 
          bgcolor: active ? 'primary.main' : 'grey.200',
          my: 0.5 
        }} />
      )}
    </Box>
    <Box sx={{ 
      pb: isLast ? 0 : 2, 
      display: 'flex', 
      alignItems: 'center', 
      mt: 0.2,
      gap: 1
    }}>
      <Typography variant="caption" sx={{ fontWeight: 800, color: active ? 'text.primary' : 'text.disabled', width: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color: active ? 'primary.main' : 'text.disabled', width: 45, textAlign: 'left' }}>
        {active ? time : '--:--'}
      </Typography>
    </Box>
  </Stack>
);

export default function SupportPageContent() {
  const theme = useTheme();
  const [tickets, setTickets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    category: '',
    priority: '',
    status: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customer_id: '',
    category: 'Perbaikan',
    priority: 'Medium',
    description: '',
    phone_number: '',
    assigned_to: ''
  });
  const [filter, setFilter] = useState('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });

  const formatWIB = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: 'Asia/Jakarta',
        hour12: false
      }).replace('.', ':');
    } catch (e) {
      return '';
    }
  };

  const categories = ["Pemasangan Baru", "Installasi Baru", "Perbaikan", "Perubahan Paket", "Pelanggan Berhenti", "Maintenace"];

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState('');
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  const fetchTickets = () => {
    let url = `/api/support?range=${filter}`;
    if (filter === 'custom' && dateRange.start && dateRange.end) {
      url += `&start=${dateRange.start}&end=${dateRange.end}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const fetchedTickets = Array.isArray(data.data) ? data.data : [];
          setTickets(fetchedTickets || []);
          
          // Calculate stats
          const total = fetchedTickets.length;
          const pending = fetchedTickets.filter((t: any) => t.status === 'Open' || t.status === 'In Progress').length;
          const resolved = fetchedTickets.filter((t: any) => t.status === 'Resolved' || t.status === 'Closed').length;
          setStats({ total, pending, resolved });
        }
      });
  };

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEmployees(data.data);
      });
  }, []);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCustomers(data.data);
      });

    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const techList = data.data.filter((emp: any) => 
            emp.position_name?.toLowerCase().includes('teknisi')
          );
          setTechnicians(techList);
        }
      });
  }, []);

  const handleSubmit = async () => {
    if (!newTicket.customer_id || !newTicket.description) {
      alert("Please fill in required fields (Customer & Description)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
      const data = await res.json();
      if (data.success) {
        setOpenDialog(false);
        setNewTicket({ customer_id: '', category: 'Perbaikan', priority: 'Medium', description: '', phone_number: '', assigned_to: '' });
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setEditForm({
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description || ''
    });
    setDetailOpen(true);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedTicket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
        setSelectedTicket(data.ticket);
        setEditForm({
          category: data.ticket.category,
          priority: data.ticket.priority,
          status: data.ticket.status,
          description: data.ticket.description || ''
        });
      } else {
        fetchTickets(); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDescSave = async () => {
    if (!tempDesc || tempDesc === selectedTicket?.description) {
      setIsEditingDesc(false);
      return;
    }

    setIsSavingDesc(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, description: tempDesc })
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
        setSelectedTicket(data.ticket);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDesc(false);
      setIsEditingDesc(false);
    }
  };

  const handleAssignChange = async (employeeId: string) => {
    if (!selectedTicket) return;
    
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedTicket,
          assigned_to: employeeId || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update assignment:', err);
    }
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Tiketing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Pusat bantuan dan pelaporan gangguan pelanggan ITNET.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: 3, fontWeight: 600 }}
        >
          Open Ticket Baru
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Filter Waktu</InputLabel>
          <Select
            value={filter}
            label="Filter Waktu"
            onChange={(e) => setFilter(e.target.value)}
            sx={{ borderRadius: 3, bgcolor: 'background.paper' }}
          >
            <MenuItem value="today">Hari Ini</MenuItem>
            <MenuItem value="month">Bulan Ini</MenuItem>
            <MenuItem value="all">Semua Tiket</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </FormControl>
        
        {filter === 'custom' && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="date"
              size="small"
              label="Dari"
              InputLabelProps={{ shrink: true }}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              sx={{ width: 150 }}
            />
            <Typography variant="body2" color="text.secondary">s/d</Typography>
            <TextField
              type="date"
              size="small"
              label="Sampai"
              InputLabelProps={{ shrink: true }}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              sx={{ width: 150 }}
            />
            <Button 
              variant="contained" 
              size="small" 
              onClick={fetchTickets}
              sx={{ borderRadius: 3, height: 40, px: 3 }}
            >
              Cari
            </Button>
          </Stack>
        )}
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {[
          { label: "Total Tiket", value: stats.total, icon: <MessageIcon />, color: theme.palette.primary.main },
          { label: "Menunggu", value: stats.pending, icon: <ClockIcon />, color: theme.palette.warning.main },
          { label: "Selesai", value: stats.resolved, icon: <CheckIcon />, color: theme.palette.success.main },
          { label: "Statistik SLA", value: "98.4%", icon: <SpeedIcon />, color: theme.palette.secondary.main },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', borderRadius: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: stat.color }}>{stat.value}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(stat.color, 0.1), color: stat.color }}>{stat.icon}</Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ overflow: 'hidden', borderRadius: 3 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f1f3f4' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Antrian Tiket Aktif
              </Typography>
            </Box>
            <Stack divider={<Divider />}>
              {tickets.map((ticket) => (
                <Box 
                  key={ticket.id} 
                  onClick={() => handleTicketClick(ticket)}
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }, 
                    transition: 'all 0.2s ease', 
                    cursor: 'pointer' 
                  }}
                >
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ width: 4, height: 40, borderRadius: 3, bgcolor: ticket.priority === 'High' ? 'error.main' : 'warning.main' }} />
                    <Box>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 800,
                        color: (ticket.category === 'Maintenace' || ticket.category === 'Installasi Baru') ? 'secondary.main' : 'text.primary',
                        textTransform: (ticket.category === 'Maintenace' || ticket.category === 'Installasi Baru') ? 'uppercase' : 'none',
                        lineHeight: 1.2,
                        mb: 0.5
                      }}>
                        {ticket.customer_name}
                      </Typography>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        {ticket.category && (
                          <Chip 
                            label={ticket.category} 
                            size="small" 
                            sx={{ 
                              height: 18, 
                              fontSize: '0.6rem', 
                              fontWeight: 700, 
                              bgcolor: alpha(theme.palette.secondary.main, 0.1),
                              color: 'secondary.main',
                              borderRadius: 1
                            }} 
                          />
                        )}
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          fontWeight: 400,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {ticket.description || 'No Description'}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>{ticket.created_time_str}</Typography>
                        <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main' }}>
                          <LiveTimer 
                            createdAt={ticket.created_at}
                            createdTimeStr={ticket.created_time_str}
                            status={ticket.status}
                            finishedAt={ticket.finished_at}
                          />
                        </Typography>
                        {ticket.assigned_name && (
                          <>
                            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <PersonIcon sx={{ fontSize: '0.8rem', color: 'primary.main' }} />
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {ticket.assigned_name}
                              </Typography>
                            </Stack>
                          </>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Chip 
                      label={ticket.status} 
                      size="small" 
                      sx={{ 
                        height: 24, 
                        fontSize: '0.625rem', 
                        fontWeight: 800, 
                        textTransform: 'uppercase',
                        bgcolor: alpha(
                          ticket.status === 'Open' ? theme.palette.warning.main : 
                          ticket.status === 'OTW' ? theme.palette.info.main :
                          ticket.status === 'Sedang Dikerjakan' ? theme.palette.primary.main : 
                          ticket.status === 'Selesai' ? theme.palette.success.main : 
                          theme.palette.success.main, 
                          0.1
                        ),
                        color: 
                          ticket.status === 'Open' ? 'warning.main' : 
                          ticket.status === 'OTW' ? 'info.main' :
                          ticket.status === 'Sedang Dikerjakan' ? 'primary.main' : 
                          ticket.status === 'Selesai' ? 'success.main' : 
                          'success.main',
                        borderRadius: 3,
                        border: '1px solid'
                      }} 
                    />
                    <IconButton size="small"><MoreIcon fontSize="small" /></IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 3 }}>TEKNISI</Typography>
              <Stack spacing={2}>
                {technicians.map((tech, i) => (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: 3 }}>{tech.full_name?.charAt(0)}</Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{tech.full_name}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: tech.status === 'active' ? 'success.main' : 'warning.main', textTransform: 'capitalize' }}>{tech.status || 'Active'}</Typography>
                  </Stack>
                ))}
                {technicians.length === 0 && (
                  <Typography variant="caption" color="text.secondary">Tidak ada teknisi standby.</Typography>
                )}
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Buka Tiket Baru</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Kategori Layanan</InputLabel>
              <Select
                value={newTicket.category}
                label="Kategori Layanan"
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              >
                {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>

            {newTicket.category === 'Maintenace' ? (
              <FormControl fullWidth required>
                <InputLabel>Lokasi / Target</InputLabel>
                <Select
                  value={newTicket.customer_id}
                  label="Lokasi / Target"
                  onChange={(e) => setNewTicket({ ...newTicket, customer_id: e.target.value })}
                >
                  <MenuItem value="RUANG SERVER">Ruang Server</MenuItem>
                  <MenuItem value="OFFICE">Office</MenuItem>
                  <MenuItem value="INFRASTRUKTUR">Infrastruktur</MenuItem>
                </Select>
              </FormControl>
            ) : newTicket.category === 'Installasi Baru' ? (
              <TextField 
                label="Nama / Target Lokasi" 
                fullWidth 
                required 
                value={newTicket.customer_id}
                onChange={(e) => setNewTicket({ ...newTicket, customer_id: e.target.value })}
                placeholder="Contoh: Perum. Indah Blok A / Tiang 4"
              />
            ) : (
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.full_name || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, value) => setNewTicket({ ...newTicket, customer_id: value ? value.id : '', phone_number: value ? value.phone_number : '' })}
                renderOption={(props, option) => {
                  const { ...optionProps } = props as any;
                  return (
                    <Box key={option.id} component="li" {...optionProps}>
                      <Stack>
                        <Typography variant="body2">{option.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.phone_number || 'No Phone'}</Typography>
                      </Stack>
                    </Box>
                  );
                }}
                renderInput={(params) => <TextField {...params} label="Pelanggan" required />}
              />
            )}

            <TextField 
              label="Nomor HP / WhatsApp" 
              fullWidth 
              value={newTicket.phone_number}
              onChange={(e) => setNewTicket({ ...newTicket, phone_number: e.target.value })}
              placeholder="0812xxxx (Opsional jika sudah ada di data pelanggan)"
            />
            <FormControl fullWidth>
              <InputLabel>Petugas (Asign To)</InputLabel>
              <Select
                value={newTicket.assigned_to}
                label="Petugas (Asign To)"
                onChange={(e) => setNewTicket({ ...newTicket, assigned_to: e.target.value })}
              >
                <MenuItem value=""><em>Belum Ditentukan</em></MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.position_name})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Prioritas</InputLabel>
              <Select
                value={newTicket.priority}
                label="Prioritas"
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              >
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>

            <TextField 
              label="Detail Deskripsi" 
              fullWidth 
              multiline 
              rows={4}
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Batal</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Simpan Tiket
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Detail Modal */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedTicket && (
          <>
            <DialogTitle sx={{ 
              p: 0,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.primary.main, 0.01)
            }}>
              <Box sx={{ px: 4, py: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flexGrow: 1, mr: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip 
                        label={`#${selectedTicket.id}`} 
                        size="small" 
                        sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }} 
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Ticket Details
                      </Typography>
                    </Stack>
                    
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 800, 
                        color: (selectedTicket.category === 'Maintenace' || selectedTicket.category === 'Installasi Baru') ? 'secondary.main' : 'text.primary', 
                        textTransform: (selectedTicket.category === 'Maintenace' || selectedTicket.category === 'Installasi Baru') ? 'uppercase' : 'none',
                        mb: 0.5,
                        lineHeight: 1.3
                      }}>
                        {selectedTicket.customer_name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981', mb: 0.5, letterSpacing: '0.04em' }}>
                        pppoe : {selectedTicket.pppoe_username || '-'}
                      </Typography>
                      {selectedTicket.phone_number && (
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                          <Box 
                            component="a" 
                            href={`tel:${selectedTicket.phone_number}`}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5, 
                              color: 'text.secondary', 
                              textDecoration: 'none',
                              '&:hover': { color: 'primary.main' }
                            }}
                          >
                            <PhoneIcon sx={{ fontSize: '0.9rem' }} />
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{selectedTicket.phone_number}</Typography>
                          </Box>
                          <Box 
                            component="a" 
                            href={`https://wa.me/${selectedTicket.phone_number.startsWith('0') ? '62' + selectedTicket.phone_number.slice(1) : selectedTicket.phone_number}`}
                            target="_blank"
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5, 
                              color: 'success.main', 
                              textDecoration: 'none',
                              '&:hover': { opacity: 0.8 }
                            }}
                          >
                            <WhatsAppIcon sx={{ fontSize: '0.9rem' }} />
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>WhatsApp</Typography>
                          </Box>
                        </Stack>
                      )}
                   <Stack direction="row" spacing={1}>
                        <Chip 
                          icon={<LabelIcon sx={{ fontSize: '1rem !important' }} />}
                          label={selectedTicket.category} 
                          size="small" 
                          sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.08), color: 'secondary.main', px: 0.5, height: 24 }} 
                        />
                        <Chip 
                          icon={<PriorityIcon sx={{ fontSize: '1rem !important' }} />}
                          label={selectedTicket.priority} 
                          size="small" 
                          color={selectedTicket.priority === 'High' ? 'error' : 'default'}
                          variant={selectedTicket.priority === 'High' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 700, borderRadius: 1.5, px: 0.5, height: 24 }} 
                        />
                        
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={selectedTicket.assigned_to || ''}
                            onChange={(e) => handleAssignChange(e.target.value)}
                            displayEmpty
                            sx={{ 
                              height: 24, 
                              fontSize: '0.7rem', 
                              fontWeight: 700,
                              borderRadius: 1.5,
                              bgcolor: alpha(theme.palette.info.main, 0.08),
                              color: 'info.main',
                              '& .MuiSelect-select': { py: 0, px: 1, display: 'flex', alignItems: 'center', gap: 0.5 },
                              '& fieldset': { border: 'none' }
                            }}
                            renderValue={(value) => (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <PersonIcon sx={{ fontSize: '0.9rem' }} />
                                <span>Petugas: {employees.find(e => e.id === value)?.full_name || 'Belum Ditentukan'}</span>
                              </Stack>
                            )}
                          >
                            <MenuItem value=""><em>Belum Ditentukan</em></MenuItem>
                            {employees.map(emp => (
                              <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {emp.full_name} ({emp.position_name})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', display: 'block', mb: 0.8, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.6 }}>TICKET STATUS</Typography>
                      <Box sx={{ 
                        px: 2, 
                        py: 0.8, 
                        bgcolor: alpha(
                          selectedTicket.status === 'Open' ? '#f59e0b' : 
                          selectedTicket.status === 'OTW' ? '#6366f1' :
                          selectedTicket.status === 'Sedang Dikerjakan' ? '#3b82f6' : 
                          selectedTicket.status === 'Selesai' ? '#10b981' : 
                          '#10b981', 
                          0.08
                        ),
                        borderRadius: 2.5,
                        border: '1.5px solid',
                        borderColor: alpha(
                          selectedTicket.status === 'Open' ? '#f59e0b' : 
                          selectedTicket.status === 'OTW' ? '#6366f1' :
                          selectedTicket.status === 'Sedang Dikerjakan' ? '#3b82f6' : 
                          selectedTicket.status === 'Selesai' ? '#10b981' : 
                          '#10b981', 
                          0.15
                        ),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2
                      }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: 
                            selectedTicket.status === 'Open' ? '#f59e0b' : 
                            selectedTicket.status === 'OTW' ? '#6366f1' :
                            selectedTicket.status === 'Sedang Dikerjakan' ? '#3b82f6' : 
                            selectedTicket.status === 'Selesai' ? '#10b981' : 
                            '#10b981',
                          boxShadow: `0 0 10px ${alpha(
                            selectedTicket.status === 'Open' ? '#f59e0b' : 
                            selectedTicket.status === 'OTW' ? '#6366f1' :
                            selectedTicket.status === 'Sedang Dikerjakan' ? '#3b82f6' : 
                            selectedTicket.status === 'Selesai' ? '#10b981' : 
                            '#10b981', 
                            0.5
                          )}`
                        }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 900, 
                          color: 
                            selectedTicket.status === 'Open' ? '#f59e0b' : 
                            selectedTicket.status === 'OTW' ? '#6366f1' :
                            selectedTicket.status === 'Sedang Dikerjakan' ? '#3b82f6' : 
                            selectedTicket.status === 'Selesai' ? '#10b981' : 
                            '#10b981',
                          letterSpacing: '0.04em', 
                          fontSize: '0.85rem',
                          textTransform: 'uppercase'
                        }}>
                          {selectedTicket.status}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton onClick={() => setDetailOpen(false)} sx={{ 
                      color: 'text.disabled', 
                      mt: -2.5,
                      mr: -1,
                      '&:hover': { color: '#ef4444', bgcolor: alpha('#ef4444', 0.05) },
                      transition: 'all 0.2s ease'
                    }}>
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
              <Grid container>
                {/* Main Content Area */}
                <Grid size={{ xs: 12, md: 8 }} sx={{ p: 4, borderRight: { md: '1px solid' }, borderColor: 'divider' }}>
                  <Stack spacing={4}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <TaskIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                          Deskripsi Keluhan
                        </Typography>
                        {isSavingDesc && (
                          <Typography variant="caption" sx={{ color: 'primary.main', fontStyle: 'italic', ml: 2 }}>
                            Menyimpan...
                          </Typography>
                        )}
                      </Stack>
                      
                      {isEditingDesc ? (
                        <TextField
                          fullWidth
                          multiline
                          rows={8}
                          value={tempDesc}
                          onChange={(e) => setTempDesc(e.target.value)}
                          onBlur={() => handleDescSave()}
                          autoFocus
                          sx={{ 
                            '& .MuiOutlinedInput-root': { bgcolor: '#fbfbfb', borderRadius: 3 }
                          }}
                          placeholder="Describe the issue in detail..."
                        />
                      ) : (
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            bgcolor: '#fbfbfb', 
                            borderRadius: 3, 
                            borderStyle: 'dashed',
                            position: 'relative',
                            '&:hover': { bgcolor: '#f5f5f5', cursor: 'pointer' }
                          }}
                          onClick={() => {
                            setTempDesc(selectedTicket.description || '');
                            setIsEditingDesc(true);
                          }}
                        >
                          <IconButton 
                            size="small" 
                            sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8, 
                              color: 'text.secondary',
                              opacity: 0.6,
                              '&:hover': { opacity: 1, color: 'primary.main' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', lineHeight: 1.7, fontSize: '0.95rem', pr: 4 }}>
                            {selectedTicket.description || "Tidak ada deskripsi rinci disediakan."}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Stack>
                </Grid>
                
                {/* Sidebar Area */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                  <Box sx={{ p: 4 }}>
                    <Typography variant="overline" sx={{ fontWeight: 900, mb: 3, color: 'text.secondary', letterSpacing: '0.1em', display: 'block' }}>Rincian Tiket</Typography>
                    
                    <Stack spacing={4}>
                      {/* Timeline / History */}
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>TIMELINE PROGRESS</Typography>
                          <Typography 
                            sx={{ 
                              fontWeight: 900, 
                              fontSize: '0.95rem',
                              color: 'success.main'
                            }} 
                          >
                            <LiveTimer 
                              createdAt={selectedTicket.created_at}
                              createdTimeStr={selectedTicket.created_time_str}
                              status={selectedTicket.status}
                              finishedAt={selectedTicket.finished_at}
                            />
                          </Typography>
                        </Stack>
                        <Stack spacing={0}>
                          <TimelineItem label="Laporan Masuk" time={formatWIB(selectedTicket.created_at)} active isFirst />
                          <TimelineItem label="OTW ke Lokasi" time={formatWIB(selectedTicket.otw_at)} active={!!selectedTicket.otw_at} />
                          <TimelineItem label="Mulai Dikerjakan" time={formatWIB(selectedTicket.working_at)} active={!!selectedTicket.working_at} />
                          <TimelineItem label="Sudah Diperbaiki" time={formatWIB(selectedTicket.resolved_at)} active={!!selectedTicket.resolved_at} />
                          <TimelineItem label="Selesai / Ditutup" time={formatWIB(selectedTicket.finished_at)} active={!!selectedTicket.finished_at} isLast />
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            {selectedTicket.status !== 'Selesai' && (
              <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                <Button 
                  variant="contained"
                  color={
                    selectedTicket.status === 'Open' ? 'info' :
                    selectedTicket.status === 'OTW' ? 'primary' :
                    selectedTicket.status === 'Sedang Dikerjakan' ? 'warning' :
                    'success'
                  }
                  onClick={() => handleStatusUpdate(
                    selectedTicket.status === 'Open' ? 'OTW' :
                    selectedTicket.status === 'OTW' ? 'Sedang Dikerjakan' :
                    selectedTicket.status === 'Sedang Dikerjakan' ? 'Sudah Diperbaiki' :
                    'Selesai'
                  )}
                  sx={{ 
                    fontWeight: 800, 
                    borderRadius: 2,
                    px: 3,
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' }
                  }}
                >
                  {selectedTicket.status === 'Open' ? 'OTW ke Lokasi' :
                   selectedTicket.status === 'OTW' ? 'Mulai Kerjakan' :
                   selectedTicket.status === 'Sedang Dikerjakan' ? 'Selesai Perbaikan' :
                   'Selesaikan Tiket'}
                </Button>
              </DialogActions>
            )}
            {selectedTicket.status === 'Selesai' && (
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }} />
            )}
          </>
        )}
      </Dialog>
    </Box>
  );
}
