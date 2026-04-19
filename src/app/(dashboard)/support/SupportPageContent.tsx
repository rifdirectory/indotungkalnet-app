'use client';

import React, { useState, useEffect } from 'react';
import LiveTimer from './LiveTimer';
import { 
  Box, Typography, Paper, Chip, Avatar, Stack, 
  Button, TextField, Dialog, DialogTitle, DialogContent, 
  IconButton, Select, MenuItem, FormControl, InputLabel, Divider,
  Card, Autocomplete, CircularProgress, DialogActions,
  Grid, Checkbox, Tabs, Tab
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
  FiberManualRecord as FiberManualRecordIcon,
  Construction as ConstructionIcon,
  Inventory as InventoryIcon,
  Delete as DeleteIcon
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
import Portal from '@/components/Portal';

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
    assigned_to: [] as string[],
    fuel_cost: 0,
    material_cost: 0,
    other_cost: 0
  });
  const [loading, setLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customer_id: '',
    category: 'Perbaikan',
    priority: 'Medium',
    difficulty: 'Low',
    description: '',
    phone_number: '',
    assigned_to: [] as string[],
    fuel_cost: 0,
    material_cost: 0,
    other_cost: 0
  });
  const [filter, setFilter] = useState('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [detailTab, setDetailTab] = useState(0);
  const [ticketMaterials, setTicketMaterials] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [materialQty, setMaterialQty] = useState(1);
  const [materialSN, setMaterialSN] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);

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

  const categories = ["Pemasangan Baru", "Perbaikan", "Perubahan Paket", "Pelanggan Berhenti"];

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
      const res = await fetch('/api/customers?exclude=logistics');
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    };

    fetchCustomers();
    fetchTechnicians();
    fetchInventoryItems();
    
    // Live Pulse: Update status every 20 seconds
    const interval = setInterval(fetchTechnicians, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) setInventoryItems(data.data);
    } catch (err) {}
  };

  const fetchTicketMaterials = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/support/${ticketId}/materials`);
      const data = await res.json();
      if (data.success) {
        setTicketMaterials(data.data);
        // Auto-update material_cost based on items
        const total = data.data.reduce((acc: number, m: any) => acc + (m.quantity * m.purchase_price), 0);
        setEditForm(prev => ({ ...prev, material_cost: total }));
      }
    } catch (err) {}
  };

  const handleAddMaterial = async () => {
    if (!selectedTicket || !selectedMaterial || materialQty <= 0) return;
    setSavingMaterial(true);
    try {
      const res = await fetch('/api/inventory/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedMaterial.id,
          type: 'OUT',
          quantity: materialQty,
          ticket_id: selectedTicket.id,
          scenario: 'TICKET_USAGE',
          sn: materialSN || null,
          notes: `Pemakaian material pada tiket #${selectedTicket.id}${materialSN ? ` (SN: ${materialSN})` : ''}`,
          user: 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMaterial(null);
        setMaterialQty(1);
        setMaterialSN('');
        fetchTicketMaterials(selectedTicket.id);
        fetchInventoryItems(); // Refresh stock
      }
    } catch (err) {
      console.error('Failed to add material:', err);
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (logId: number) => {
    if (!selectedTicket || !window.confirm('Hapus material ini dan kembalikan ke stok?')) return;
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}/materials?log_id=${logId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchTicketMaterials(selectedTicket.id);
        fetchInventoryItems(); // Refresh stock
      }
    } catch (err) {}
  };

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
        setNewTicket({ 
          customer_id: '', 
          category: 'Perbaikan', 
          priority: 'Medium', 
          difficulty: 'Low', 
          description: '', 
          phone_number: '', 
          assigned_to: [],
          fuel_cost: 0,
          material_cost: 0,
          other_cost: 0
        });
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
      assigned_to: initialAssignees,
      fuel_cost: ticket.fuel_cost || 0,
      material_cost: ticket.material_cost || 0,
      other_cost: ticket.other_cost || 0
    };
    setEditForm(initialData);
    setTempDesc(ticket.description || '');
    setIsEditingDesc(false);
    setIsEditingRepair(false);
    setTicketMaterials([]); // Clear old list
    fetchTicketMaterials(ticket.id);
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
          assigned_to: editForm.assigned_to,
          fuel_cost: editForm.fuel_cost,
          material_cost: editForm.material_cost,
          other_cost: editForm.other_cost
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
    editForm.fuel_cost !== (selectedTicket.fuel_cost || 0) ||
    editForm.material_cost !== (selectedTicket.material_cost || 0) ||
    editForm.other_cost !== (selectedTicket.other_cost || 0) ||
    JSON.stringify(editForm.assigned_to.sort()) !== JSON.stringify((selectedTicket.assigned_ids ? selectedTicket.assigned_ids.split(',') : []).sort())
  );

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Portal container={typeof document !== 'undefined' ? document.getElementById('header-actions-portal') : null}>
        <Stack direction="row" justifyContent="flex-end">
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2, py: 0.5 }}
            size="small"
          >
            Open Ticket Baru
          </Button>
        </Stack>
      </Portal>

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

            {newTicket.category === 'Pemasangan Baru' ? (
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
              rows={3}
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            />

            <Divider>Biaya Operasional (Estimasi)</Divider>
            <Stack direction="row" spacing={2}>
              <TextField 
                label="Bensin" 
                fullWidth 
                type="number"
                value={newTicket.fuel_cost}
                onChange={(e) => setNewTicket({ ...newTicket, fuel_cost: Number(e.target.value) })}
              />
              <TextField 
                label="Material" 
                fullWidth 
                type="number"
                value={newTicket.material_cost}
                onChange={(e) => setNewTicket({ ...newTicket, material_cost: Number(e.target.value) })}
              />
              <TextField 
                label="Lainnya" 
                fullWidth 
                type="number"
                value={newTicket.other_cost}
                onChange={(e) => setNewTicket({ ...newTicket, other_cost: Number(e.target.value) })}
              />
            </Stack>
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
            <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
              <DialogTitle sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                      {selectedTicket.customer_name}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`PPPOE: ${selectedTicket.pppoe_username || '-'}`} 
                    size="small" 
                    sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.05), color: 'success.main', height: 24 }} 
                  />
                  <Stack 
                    direction="row" 
                    spacing={0.5} 
                    alignItems="center" 
                    component="a"
                    href={`https://wa.me/${selectedTicket.phone_number?.replace(/\D/g, '').startsWith('0') ? '62' + selectedTicket.phone_number.replace(/\D/g, '').slice(1) : selectedTicket.phone_number?.replace(/\D/g, '')}`}
                    target="_blank"
                    sx={{ 
                      textDecoration: 'none',
                      color: '#25D366', 
                      bgcolor: alpha('#25D366', 0.08),
                      px: 1,
                      py: 0.2,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: alpha('#25D366', 0.15) }
                    }}
                  >
                    <WhatsAppIcon sx={{ fontSize: '0.9rem' }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#15803d' }}>
                      {selectedTicket.phone_number || '-'}
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.disabled', mr: 1 }}>
                    TICKET #{selectedTicket.id}
                  </Typography>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={editForm.category}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                      disabled={selectedTicket.status === 'Selesai'}
                      sx={{ height: 32, fontSize: '0.75rem', fontWeight: 800, borderRadius: 1.5, bgcolor: '#f8fafc' }}
                    >
                      {categories.map(cat => <MenuItem key={cat} value={cat} sx={{ fontSize: '0.75rem' }}>{cat}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={editForm.priority}
                      onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                      disabled={selectedTicket.status === 'Selesai'}
                      sx={{ 
                        height: 32,
                        fontSize: '0.75rem',
                        fontWeight: 800, 
                        borderRadius: 1.5, 
                        bgcolor: editForm.priority === 'High' ? alpha(theme.palette.error.main, 0.05) : '#f8fafc',
                        color: editForm.priority === 'High' ? 'error.main' : 'text.primary',
                      }}
                    >
                      <MenuItem value="Low" sx={{ fontSize: '0.75rem' }}>Low</MenuItem>
                      <MenuItem value="Medium" sx={{ fontSize: '0.75rem' }}>Medium</MenuItem>
                      <MenuItem value="High" sx={{ fontSize: '0.75rem' }}>High</MenuItem>
                    </Select>
                  </FormControl>

                  <IconButton size="small" onClick={() => setDetailOpen(false)} sx={{ bgcolor: '#f1f5f9' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </DialogTitle>

              <Tabs 
                value={detailTab} 
                onChange={(_, val) => setDetailTab(val)}
                sx={{
                  px: 3,
                  minHeight: 40,
                  '& .MuiTab-root': { py: 1, minHeight: 40, fontWeight: 800, minWidth: 140, fontSize: '0.8rem' },
                }}
              >
                <Tab label="PENANGANAN" icon={<EngineeringIcon sx={{ fontSize: '1.1rem', mr: 1 }} />} iconPosition="start" />
                <Tab label="LOGISTIK & BIAYA" icon={<ConstructionIcon sx={{ fontSize: '1.1rem', mr: 1 }} />} iconPosition="start" />
                <Tab label="RIWAYAT & STATUS" icon={<HistoryIcon sx={{ fontSize: '1.1rem', mr: 1 }} />} iconPosition="start" />
              </Tabs>
            </Box>
            
            <DialogContent sx={{ p: 0, minHeight: 500, bgcolor: '#f8fafc' }}>
              {detailTab === 0 && (
                <Grid container>
                  <Grid size={{ xs: 12, md: 4 }} sx={{ p: 4, borderRight: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, letterSpacing: 1, color: 'text.secondary' }}>PENUGASAN TIM</Typography>
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
                        return (
                          <li key={option.id} {...optionProps}>
                            <Checkbox checked={selected} size="small" />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.full_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{option.position_name} • {option.current_status}</Typography>
                            </Box>
                          </li>
                        );
                      }}
                      renderInput={(params) => <TextField {...params} placeholder="Tambah Teknisi..." sx={{ bgcolor: 'white' }} />}
                    />
                    <Stack spacing={1.5} sx={{ mt: 3 }}>
                      {editForm.assigned_to.map((empId) => {
                        const emp = employees.find(e => e.id.toString() === empId);
                        if (!emp) return null;
                        return (
                          <Paper key={emp.id} elevation={0} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 900 }}>
                                {emp.full_name[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>{emp.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{emp.position_name}</Typography>
                              </Box>
                            </Stack>
                            {selectedTicket.status !== 'Selesai' && (
                              <IconButton size="small" color="error" onClick={() => setEditForm(prev => ({ ...prev, assigned_to: prev.assigned_to.filter(id => id !== empId) }))}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }} sx={{ p: 4 }}>
                    <Stack spacing={4}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: 'text.secondary' }}>DESKRIPSI KELUHAN</Typography>
                        {isEditingDesc ? (
                          <TextField fullWidth multiline rows={5} value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} autoFocus sx={{ bgcolor: 'white' }} />
                        ) : (
                          <Paper onClick={() => selectedTicket.status !== 'Selesai' && setIsEditingDesc(true)} sx={{ p: 2, minHeight: 120, bgcolor: 'white', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{editForm.description}</Typography>
                          </Paper>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: 'text.secondary' }}>KETERANGAN PENANGANAN</Typography>
                        {isEditingRepair ? (
                          <TextField fullWidth multiline rows={5} value={editForm.repair_description} onChange={(e) => setEditForm(prev => ({ ...prev, repair_description: e.target.value }))} autoFocus sx={{ bgcolor: 'white' }} />
                        ) : (
                          <Paper onClick={() => selectedTicket.status !== 'Selesai' && setIsEditingRepair(true)} sx={{ p: 2, minHeight: 120, bgcolor: alpha(theme.palette.success.main, 0.02), border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'success.main' } }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: editForm.repair_description ? 'text.primary' : 'text.disabled' }}>
                              {editForm.repair_description || "Tuliskan laporan perbaikan di sini..."}
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              )}

              {detailTab === 1 && (
                <Grid container>
                  <Grid size={{ xs: 12, md: 8 }} sx={{ p: 4, borderRight: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, color: 'text.secondary' }}>BAHAN / MATERIAL TERPAKAI</Typography>
                    {selectedTicket.status !== 'Selesai' && (
                      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Autocomplete
                          sx={{ flexGrow: 1 }}
                          size="small"
                          options={inventoryItems.filter(i => i.stock > 0)}
                          getOptionLabel={(option) => `${option.name} (Stok: ${option.stock} ${option.unit})`}
                          value={selectedMaterial}
                          onChange={(_, val) => setSelectedMaterial(val)}
                          renderInput={(params) => <TextField {...params} label="Cari Barang..." />}
                        />
                        <TextField size="small" sx={{ width: 100 }} type="number" label="Qty" value={materialQty} onChange={(e) => setMaterialQty(Number(e.target.value))} />
                        
                        {(selectedMaterial?.track_sn || selectedMaterial?.category_has_sn) && (
                          <TextField 
                            size="small" 
                            label="Serial Number (SN)" 
                            value={materialSN} 
                            onChange={(e) => setMaterialSN(e.target.value)}
                            autoFocus
                            placeholder="Scan atau ketik SN..."
                            sx={{ minWidth: 180 }}
                          />
                        )}

                        <Button variant="contained" onClick={handleAddMaterial} disabled={!selectedMaterial || savingMaterial}>Tambah</Button>
                      </Paper>
                    )}
                    <Stack spacing={1.5}>
                      {ticketMaterials.map(m => (
                        <Paper key={m.id} elevation={0} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{m.item_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {m.quantity} {m.unit} 
                              {m.sn && <span style={{ color: theme.palette.primary.main, fontWeight: 800, marginLeft: '8px' }}>• SN: {m.sn}</span>}
                              {" • "}Biaya Modal: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(m.purchase_price * m.quantity)}
                            </Typography>
                          </Box>
                          {selectedTicket.status !== 'Selesai' && (
                            <IconButton size="small" color="error" onClick={() => handleDeleteMaterial(m.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} sx={{ p: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, color: 'text.secondary' }}>BIAYA OPERASIONAL</Typography>
                    <Stack spacing={3}>
                      <TextField fullWidth size="small" label="Bensin / BBM" type="number" value={editForm.fuel_cost} onChange={(e) => setEditForm(prev => ({ ...prev, fuel_cost: Number(e.target.value) }))} sx={{ bgcolor: 'white' }} />
                      <TextField fullWidth size="small" label="Lain-lain / Makan" type="number" value={editForm.other_cost} onChange={(e) => setEditForm(prev => ({ ...prev, other_cost: Number(e.target.value) }))} sx={{ bgcolor: 'white' }} />
                      <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.8 }}>TOTAL ESTIMASI BIAYA</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(editForm.fuel_cost || 0) + Number(editForm.other_cost || 0) + Number(editForm.material_cost || 0))}
                        </Typography>
                      </Paper>
                    </Stack>
                  </Grid>
                </Grid>
              )}

              {detailTab === 2 && (
                <Grid container>
                  <Grid size={{ xs: 12, md: 5 }} sx={{ p: 4, borderRight: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, color: 'text.secondary' }}>TIMELINE AKTIVITAS</Typography>
                    <Stack spacing={0.5}>
                      <TimelineItem label="LAPORAN MASUK" time={formatWIB(selectedTicket.created_at)} active isFirst />
                      <TimelineItem label="OTW KE LOKASI" time={formatWIB(selectedTicket.otw_at)} active={!!selectedTicket.otw_at} />
                      <TimelineItem label="MULAI DIKERJAKAN" time={formatWIB(selectedTicket.working_at)} active={!!selectedTicket.working_at} />
                      <TimelineItem label="SUDAH DIPERBAIKI" time={formatWIB(selectedTicket.resolved_at)} active={!!selectedTicket.resolved_at} />
                      <TimelineItem label="TICKET CLOSED" time={formatWIB(selectedTicket.finished_at)} active={!!selectedTicket.finished_at} isLast />
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 7 }} sx={{ p: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, color: 'text.secondary' }}>RINGKASAN STATUS</Typography>
                    <Box sx={{ p: 4, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1), borderRadius: 4, textAlign: 'center' }}>
                      <ClockIcon sx={{ fontSize: '3rem', color: 'success.main', mb: 2 }} />
                      <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.dark' }}>
                        <LiveTimer 
                          createdAt={selectedTicket.created_at}
                          createdTimeStr={selectedTicket.created_time_str}
                          status={selectedTicket.status}
                          finishedAt={selectedTicket.finished_at}
                        />
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', letterSpacing: 1 }}>DURASI PENANGANAN AKTIF</Typography>
                    </Box>

                    {selectedTicket.status === 'Open' && (
                      <Button fullWidth variant="outlined" color="error" startIcon={<CloseIcon />} sx={{ mt: 3, p: 1.5, fontWeight: 900, borderRadius: 2 }} onClick={() => window.confirm('Batalkan tiket?') && handleStatusUpdate('Dibatalkan')}>
                        BATALKAN TIKET INI
                      </Button>
                    )}
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            
            <DialogActions sx={{ p: 2, px: 4, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'white', gap: 2 }}>
              {isDirty && (
                <Button variant="contained" onClick={handleSaveAll} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />} sx={{ height: 45, px: 4, borderRadius: 2.5, fontWeight: 900 }}>
                  SIMPAN PERUBAHAN
                </Button>
              )}
              
              {(selectedTicket.status !== 'Selesai' && selectedTicket.status !== 'Dibatalkan') && (
                <Button 
                  variant="outlined"
                  onClick={() => handleStatusUpdate(
                    selectedTicket.status === 'Open' ? 'OTW' :
                    selectedTicket.status === 'OTW' ? 'Sedang Dikerjakan' :
                    selectedTicket.status === 'Sedang Dikerjakan' ? 'Resolved' : 'Selesai'
                  )}
                  sx={{ height: 45, px: 4, borderRadius: 2.5, fontWeight: 900 }}
                >
                  {
                    selectedTicket.status === 'Open' ? 'OTW KE LOKASI' :
                    selectedTicket.status === 'OTW' ? 'MULAI KERJAKAN' :
                    selectedTicket.status === 'Sedang Dikerjakan' ? 'TANDAI SELESAI' :
                    selectedTicket.status === 'Resolved' ? 'TUTUP TIKET' : 'PROSES'
                  }
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
