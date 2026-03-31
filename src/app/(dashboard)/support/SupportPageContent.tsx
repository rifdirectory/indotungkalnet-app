'use client';

import React, { useState, useEffect } from 'react';
import LiveTimer from './LiveTimer';
import { 
  Box, Typography, Paper, Chip, Avatar, Stack, 
  Button, TextField, Dialog, DialogTitle, DialogContent, 
  IconButton, Select, MenuItem, FormControl, InputLabel, Divider,
  Card, Autocomplete, CircularProgress, DialogActions,
  Grid, Checkbox
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
  WhatsApp as WhatsAppIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  Engineering as EngineeringIcon,
  Coffee as CoffeeIcon,
  FiberManualRecord as FiberManualRecordIcon
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
    description: '',
    repair_description: '',
    assigned_to: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customer_id: '',
    category: 'Perbaikan',
    priority: 'Medium',
    difficulty: 'Low',
    description: '',
    phone_number: '',
    assigned_to: [] as string[]
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
  const [isEditingRepair, setIsEditingRepair] = useState(false);
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

  const fetchTechnicians = async () => {
    try {
      let url = `/api/employees?range=${filter}`;
      if (filter === 'custom' && dateRange.start && dateRange.end) {
        url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      } else if (filter === 'today') {
        // Handled by default in backend or we could pass specific today date
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
        const techList = data.data.filter((emp: any) => 
          (emp.position_name?.toLowerCase().includes('teknisi') ||
           emp.position_name?.toLowerCase().includes('noc')) &&
          emp.full_name !== 'Wisnu Rachmawan'
        );
        setTechnicians(techList);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
  }, [filter, dateRange]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    };

    fetchCustomers();
    fetchTechnicians();
    
    // Live Pulse: Update status every 20 seconds
    const interval = setInterval(fetchTechnicians, 20000);
    return () => clearInterval(interval);
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
        setNewTicket({ customer_id: '', category: 'Perbaikan', priority: 'Medium', difficulty: 'Low', description: '', phone_number: '', assigned_to: [] });
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
    const initialAssignees = ticket.assigned_ids ? ticket.assigned_ids.split(',') : [];
    const initialData = {
      category: ticket.category || 'Perbaikan',
      priority: ticket.priority || 'Medium',
      description: ticket.description || '',
      repair_description: ticket.repair_description || '',
      assigned_to: initialAssignees
    };
    setEditForm(initialData);
    setTempDesc(ticket.description || '');
    setIsEditingDesc(false);
    setIsEditingRepair(false);
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
          description: data.ticket.description || '',
          repair_description: data.ticket.repair_description || '',
          assigned_to: data.ticket.assigned_ids ? data.ticket.assigned_ids.split(',') : []
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

  const handleSaveAll = async () => {
    if (!selectedTicket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedTicket,
          category: editForm.category,
          priority: editForm.priority,
          description: editForm.description,
          repair_description: editForm.repair_description,
          assigned_to: editForm.assigned_to
        })
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
        setSelectedTicket(data.ticket);
        setIsEditingDesc(false);
        setIsEditingRepair(false);
      }
    } catch (err) {
      console.error('Failed to save changes:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDirty = selectedTicket && (
    editForm.category !== selectedTicket.category ||
    editForm.priority !== selectedTicket.priority ||
    editForm.description !== (selectedTicket.description || '') ||
    editForm.repair_description !== (selectedTicket.repair_description || '') ||
    JSON.stringify(editForm.assigned_to.sort()) !== JSON.stringify((selectedTicket.assigned_ids ? selectedTicket.assigned_ids.split(',') : []).sort())
  );

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
              onClick={() => {
                fetchTickets();
                fetchTechnicians();
              }}
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
                      </Stack>

                      {ticket.assigned_names && (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                          <PersonIcon sx={{ fontSize: '0.85rem', color: 'primary.main', opacity: 0.8 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', opacity: 0.9, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {ticket.assigned_names}
                          </Typography>
                        </Stack>
                      )}
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
                          ticket.status === 'Sudah Diperbaiki' ? theme.palette.secondary.main : 
                          theme.palette.success.main, 
                          0.1
                        ),
                        color: 
                          ticket.status === 'Open' ? 'warning.main' : 
                          ticket.status === 'OTW' ? 'info.main' :
                          ticket.status === 'Sedang Dikerjakan' ? 'primary.main' : 
                          ticket.status === 'Sudah Diperbaiki' ? 'secondary.main' : 
                          ticket.status === 'Dibatalkan' ? 'error.main' :
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
                {technicians.map((tech, i) => {
                  const isOff = tech.current_status === 'Off';
                  const isOnSite = tech.current_status === 'On-Site';
                  const isFree = tech.current_status === 'Free';
                  const isIzin = tech.current_status === 'Izin';
                  
                  const statusColor = isIzin ? theme.palette.error.main : (isOnSite ? theme.palette.warning.main : (isFree ? theme.palette.success.main : theme.palette.text.disabled));
                  const statusBg = isIzin ? alpha(theme.palette.error.main, 0.1) : (isOnSite ? alpha(theme.palette.warning.main, 0.1) : (isFree ? alpha(theme.palette.success.main, 0.1) : 'rgba(0, 0, 0, 0.02)'));
                  
                  return (
                    <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ 
                          width: 32, 
                          height: 32, 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          bgcolor: statusBg, 
                          color: statusColor,
                          border: '1px solid rgba(0, 0, 0, 0.06)', 
                          borderRadius: 3,
                          opacity: (isOff || isIzin) ? 0.6 : 1
                        }}>
                          {tech.full_name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700, 
                          color: (isOff || isIzin) ? 'text.disabled' : 'text.primary',
                          transition: 'color 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          {tech.full_name}
                          {tech.total_field_tasks_filtered > 0 && !isIzin && (
                            <Box component="span" sx={{ 
                              fontSize: '0.65rem', 
                              bgcolor: isOff ? 'rgba(0,0,0,0.1)' : (isOnSite ? 'warning.main' : 'success.main'), 
                              color: isOff ? 'text.disabled' : 'white', 
                              px: 0.8, 
                              py: 0.2, 
                              borderRadius: 1,
                              fontWeight: 900
                            }}>
                              {tech.total_field_tasks_filtered}
                            </Box>
                          )}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {isOnSite && <EngineeringIcon sx={{ fontSize: '1rem', color: 'warning.main' }} />}
                        {isFree && <CoffeeIcon sx={{ fontSize: '1rem', color: 'success.main' }} />}
                        {isIzin && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />}
                        {isOff && !isIzin && <FiberManualRecordIcon sx={{ fontSize: '0.6rem', color: 'text.disabled' }} />}
                        
                        <Typography variant="caption" sx={{ 
                          fontWeight: 900, 
                          color: statusColor, 
                          textTransform: 'uppercase',
                          fontSize: '0.65rem',
                          letterSpacing: 0.5
                        }}>
                          {tech.current_status || 'Off'}
                        </Typography>
                      </Stack>
                    </Stack>
                  );
                })}
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
                  const { key, ...optionProps } = props as any;
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
            <Stack direction="row" spacing={2}>
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

              <FormControl fullWidth>
                <InputLabel>Tingkat Kesulitan</InputLabel>
                <Select
                  value={newTicket.difficulty}
                  label="Tingkat Kesulitan"
                  onChange={(e) => setNewTicket({ ...newTicket, difficulty: e.target.value })}
                >
                  <MenuItem value="High">High (Sulit)</MenuItem>
                  <MenuItem value="Medium">Medium (Sedang)</MenuItem>
                  <MenuItem value="Low">Low (Mudah)</MenuItem>
                </Select>
              </FormControl>
            </Stack>

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
            <DialogTitle sx={{ p: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 2, display: 'block', mb: 1 }}>
                  #{selectedTicket.id} &nbsp; TICKET DETAILS & ASSIGNMENT
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
                  {selectedTicket.customer_name}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip 
                    label={`PPPOE: ${selectedTicket.pppoe_username || '-'}`} 
                    size="small" 
                    sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.05), color: 'success.main', borderRadius: 1.5 }} 
                  />
                  <Stack 
                    direction="row" 
                    spacing={1} 
                    alignItems="center" 
                    component="a"
                    href={`https://wa.me/${selectedTicket.phone_number?.replace(/\D/g, '').startsWith('0') ? '62' + selectedTicket.phone_number.replace(/\D/g, '').slice(1) : selectedTicket.phone_number?.replace(/\D/g, '')}`}
                    target="_blank"
                    sx={{ 
                      textDecoration: 'none',
                      color: '#25D366', 
                      bgcolor: alpha('#25D366', 0.08),
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: alpha('#25D366', 0.15) }
                    }}
                  >
                    <WhatsAppIcon sx={{ fontSize: '1.1rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: 0.5, color: '#15803d' }}>
                      {selectedTicket.phone_number || '-'}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    disabled={selectedTicket.status === 'Selesai'}
                    sx={{ fontWeight: 800, borderRadius: 2, bgcolor: '#f8fafc', '& fieldset': { borderColor: 'divider' } }}
                  >
                    {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                    disabled={selectedTicket.status === 'Selesai'}
                    sx={{ 
                      fontWeight: 800, 
                      borderRadius: 2, 
                      bgcolor: editForm.priority === 'High' ? alpha(theme.palette.error.main, 0.05) : '#f8fafc',
                      color: editForm.priority === 'High' ? 'error.main' : 'text.primary',
                      '& fieldset': { borderColor: 'divider' }
                    }}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>

                {selectedTicket.status === 'Sudah Diperbaiki' && (
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="small"
                    startIcon={<CheckIcon />}
                    onClick={() => handleStatusUpdate('Selesai')}
                    sx={{ p: 1.2, fontWeight: 900, borderRadius: 3, letterSpacing: 0.5 }}
                  >
                    VERIFIKASI & SELESAI
                  </Button>
                )}

                {selectedTicket.status === 'Open' && (
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      if (window.confirm('Apakah Anda yakin ingin membatalkan tiket ini?')) {
                        handleStatusUpdate('Dibatalkan');
                      }
                    }}
                    sx={{ p: 1.2, fontWeight: 900, borderRadius: 3, letterSpacing: 0.5 }}
                  >
                    BATALKAN TIKET
                  </Button>
                )}

                <IconButton onClick={() => setDetailOpen(false)} sx={{ ml: 1 }}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
              <Grid container sx={{ minHeight: 450 }}>
                {/* 1. PENUGASAN TIM (Left) */}
                <Grid size={{ xs: 12, md: 3.8 }} sx={{ p: 4 }}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 2 }}>
                      PENUGASAN TIM TEKNISI
                    </Typography>
                    <Autocomplete
                      multiple
                      size="small"
                      options={technicians}
                      disabled={selectedTicket.status === 'Selesai'}
                      getOptionLabel={(option) => option.id ? option.full_name : ''}
                      getOptionDisabled={(option) => option.current_status === 'Izin' || option.current_status === 'Off'}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={employees.filter(e => (editForm.assigned_to || []).includes(e.id.toString()))}
                      onChange={(_, value) => setEditForm(prev => ({ ...prev, assigned_to: value.map(v => v.id.toString()) }))}
                      renderTags={() => null}
                      renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        const isIzin = option.current_status === 'Izin';
                        return (
                          <li key={option.id} {...optionProps}>
                            <Checkbox
                              icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                              checkedIcon={<CheckBoxIcon fontSize="small" />}
                              style={{ marginRight: 8 }}
                              checked={selected}
                              disabled={isIzin || option.current_status === 'Off'}
                            />
                            <Box sx={{ flexGrow: 1, opacity: (isIzin || option.current_status === 'Off') ? 0.5 : 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: (isIzin || option.current_status === 'Off') ? 400 : 600 }}>
                                {option.full_name} 
                                {isIzin && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'error.main', fontWeight: 900 }}>(SEDANG IZIN)</Typography>}
                                {option.current_status === 'Off' && !isIzin && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.disabled', fontWeight: 900 }}>(BELUM MASUK / OFF)</Typography>}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.position_name} • <span style={{ color: option.current_status === 'Free' ? '#2e7d32' : 'inherit' }}>{option.current_status}</span>
                              </Typography>
                            </Box>
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          placeholder="Cari & Pilih Teknisi..." 
                          variant="outlined"
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              bgcolor: 'white', 
                              borderRadius: 3,
                              '& fieldset': { borderColor: 'divider' },
                              px: 2
                            }
                          }}
                        />
                      )}
                    />

                    {/* VERTICAL LIST OF TECHNICIANS */}
                    <Stack spacing={1} sx={{ mt: 2, minHeight: 120 }}>
                      {editForm.assigned_to.length > 0 ? (
                        editForm.assigned_to.map((empId) => {
                          const emp = employees.find(e => e.id.toString() === empId);
                          if (!emp) return null;
                          return (
                            <Paper 
                              key={emp.id}
                              elevation={0}
                              sx={{ 
                                p: 1.5, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: alpha(theme.palette.primary.main, 0.08)
                              }}
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar 
                                  sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    fontSize: '0.8rem', 
                                    fontWeight: 900,
                                    bgcolor: 'primary.main'
                                  }}
                                >
                                  {emp.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary' }}>
                                    {emp.full_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    {emp.position_name || 'Teknisi'}
                                  </Typography>
                                </Box>
                              </Stack>
                              {selectedTicket.status !== 'Selesai' && (
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => setEditForm(prev => ({ 
                                    ...prev, 
                                    assigned_to: prev.assigned_to.filter(id => id !== empId) 
                                  }))}
                                >
                                  <CloseIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              )}
                            </Paper>
                          );
                        })
                      ) : (
                        <Box sx={{ 
                          py: 4, 
                          textAlign: 'center', 
                          border: '2px dashed', 
                          borderColor: 'divider', 
                          borderRadius: 3,
                          color: 'text.disabled'
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Belum ada teknisi ditugaskan</Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Grid>

                {/* 2. DISKRIPSI UNIT (Middle) */}
                <Grid size={{ xs: 12, md: 5.2 }} sx={{ p: 4, borderLeft: '1px solid', borderColor: 'divider', bgcolor: '#fcfdfe' }}>
                  <Stack spacing={3}>
                    {/* COMPLAINT DESCRIPTION */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                          <MessageIcon sx={{ fontSize: '1rem' }} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                          DESKRIPSI KELUHAN
                        </Typography>
                      </Stack>
                      
                      {isEditingDesc ? (
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          autoFocus
                          sx={{ 
                            '& .MuiOutlinedInput-root': { bgcolor: '#fcfdfe', borderRadius: 4, p: 2, fontSize: '0.95rem', lineHeight: 1.5 }
                          }}
                        />
                      ) : (
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2.5, 
                            bgcolor: '#fcfdfe', 
                            borderRadius: 4, 
                            border: '1px solid',
                            borderColor: 'divider',
                            position: 'relative',
                            minHeight: 180,
                            transition: 'all 0.2s',
                            '&:hover': selectedTicket.status === 'Selesai' ? {} : { bgcolor: 'white', borderColor: 'primary.main', cursor: 'pointer' }
                          }}
                          onClick={() => selectedTicket.status !== 'Selesai' && setIsEditingDesc(true)}
                        >
                          {selectedTicket.status !== 'Selesai' && (
                            <IconButton size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                              <EditIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          )}
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', lineHeight: 1.6, fontWeight: 500 }}>
                            {editForm.description || "Klik untuk menambah deskripsi..."}
                          </Typography>
                        </Paper>
                      )}
                    </Box>

                    {/* REPAIR DESCRIPTION (New Section) */}
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.main' }}>
                          <TaskIcon sx={{ fontSize: '1rem' }} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                          KETERANGAN PERBAIKAN
                        </Typography>
                      </Stack>
                      
                      {isEditingRepair ? (
                        <TextField
                          fullWidth
                          multiline
                          rows={10}
                          value={editForm.repair_description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, repair_description: e.target.value }))}
                          autoFocus
                          placeholder="Tuliskan keterangan perbaikan di sini..."
                          sx={{ 
                            '& .MuiOutlinedInput-root': { bgcolor: '#fcfdfe', borderRadius: 4, p: 2, fontSize: '0.95rem', lineHeight: 1.5 }
                          }}
                        />
                      ) : (
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2.5, 
                            bgcolor: alpha(theme.palette.success.main, 0.02), 
                            borderRadius: 4, 
                            border: '1px solid',
                            borderColor: editForm.repair_description ? alpha(theme.palette.success.main, 0.2) : 'divider',
                            position: 'relative',
                            minHeight: 250,
                            transition: 'all 0.2s',
                            '&:hover': selectedTicket.status === 'Selesai' ? {} : { bgcolor: 'white', borderColor: theme.palette.success.main, cursor: 'pointer' }
                          }}
                          onClick={() => selectedTicket.status !== 'Selesai' && setIsEditingRepair(true)}
                        >
                          {selectedTicket.status !== 'Selesai' && (
                            <IconButton size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
                              <EditIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          )}
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: editForm.repair_description ? 'text.primary' : 'text.disabled', lineHeight: 1.6, fontWeight: 500 }}>
                            {editForm.repair_description || "Klik untuk menuliskan keterangan penanganan & perbaikan..."}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Stack>
                </Grid>

                {/* 3. DURASI & TIMELINE (Right) */}
                <Grid size={{ xs: 12, md: 3 }} sx={{ p: 4, borderLeft: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 3 }}>
                      DURASI AKTIF
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: alpha(theme.palette.success.main, 0.06), p: 2, borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'success.main', color: 'white', display: 'flex' }}>
                        <ClockIcon sx={{ fontSize: '1.2rem' }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'block', opacity: 0.8 }}>ESTIMASI PENANGANAN</Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: 'success.dark', letterSpacing: 1 }}>
                          <LiveTimer 
                            createdAt={selectedTicket.created_at}
                            createdTimeStr={selectedTicket.created_time_str}
                            status={selectedTicket.status}
                            finishedAt={selectedTicket.finished_at}
                          />
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 3 }}>
                    TIMELINE STATUS
                  </Typography>
                  <Stack spacing={0}>
                    <TimelineItem label="LAPORAN MASUK" time={formatWIB(selectedTicket.created_at)} active isFirst />
                    <TimelineItem label="OTW KE LOKASI" time={formatWIB(selectedTicket.otw_at)} active={!!selectedTicket.otw_at} />
                    <TimelineItem label="MULAI DIKERJAKAN" time={formatWIB(selectedTicket.working_at)} active={!!selectedTicket.working_at} />
                    <TimelineItem label="SUDAH DIPERBAIKI" time={formatWIB(selectedTicket.resolved_at)} active={!!selectedTicket.resolved_at} />
                    <TimelineItem label="TICKET CLOSED" time={formatWIB(selectedTicket.finished_at)} active={!!selectedTicket.finished_at} isLast />
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            
            <Box sx={{ p: 2, px: 4, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'white', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {isDirty && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSaveAll}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                  sx={{ height: 42, px: 4, borderRadius: 2.5, fontWeight: 900, letterSpacing: 1 }}
                >
                  SIMPAN PERUBAHAN
                </Button>
              )}
              
              {(selectedTicket.status !== 'Selesai' && selectedTicket.status !== 'Dibatalkan') && (
                  <Button 
                    variant="outlined"
                    onClick={() => handleStatusUpdate(
                      selectedTicket.status === 'Open' ? 'OTW' :
                      selectedTicket.status === 'OTW' ? 'Sedang Dikerjakan' :
                      selectedTicket.status === 'Sedang Dikerjakan' ? 'Resolved' :
                      'Selesai'
                    )}
                    sx={{ 
                      height: 42,
                      px: 4,
                      borderRadius: 2.5,
                      fontWeight: 900, 
                      fontSize: '0.85rem',
                      letterSpacing: 1.2,
                      borderColor: 'divider'
                    }}
                  >
                    {
                      selectedTicket.status === 'Open' ? 'OTW KE LOKASI' :
                      selectedTicket.status === 'OTW' ? 'MULAI KERJAKAN' :
                      selectedTicket.status === 'Sedang Dikerjakan' ? 'TANDAI SELESAI' :
                      selectedTicket.status === 'Resolved' ? 'TUTUP TIKET' : 'PROSES'
                    }
                  </Button>
              )}
            </Box>
            {(selectedTicket.status === 'Selesai' || selectedTicket.status === 'Dibatalkan') && (
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }} />
            )}
          </>
        )}
      </Dialog>
    </Box>
  );
}
