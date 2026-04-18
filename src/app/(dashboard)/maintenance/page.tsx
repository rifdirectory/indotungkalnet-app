'use client';

import React, { useState, useEffect, useMemo } from 'react';
import LiveTimer from '../support/LiveTimer';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip,
  alpha,
  useTheme,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  CircularProgress,
  Checkbox,
  IconButton,
  Menu,
  Paper,
  Divider,
  Tooltip,
  Tabs,
  Tab
} from "@mui/material";
import { 
  Handyman as MaintenanceIcon, 
  Schedule as ScheduleIcon, 
  CheckCircle as CheckIcon, 
  Warning as WarningIcon, 
  Add as AddIcon,
  Delete as DeleteIcon,
  Timeline as TimelineIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  MoreVert as MoreIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Label as LabelIcon,
  PriorityHigh as PriorityIcon,
  Assignment as TaskIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Message as MessageIcon,
  AccessTime as ClockIcon,
  Engineering as EngineeringIcon,
  Coffee as CoffeeIcon,
  FiberManualRecord as FiberManualRecordIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Construction as ConstructionIcon
} from "@mui/icons-material";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

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

export default function MaintenancePage() {
  const theme = useTheme();
  const [jobs, setJobs] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newJob, setNewJob] = useState({
    category: 'Maintenace',
    customer_id: '',
    priority: 'Medium',
    difficulty: 'Low',
    description: '',
    assigned_to: [] as string[]
  });

  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Filter States
  const [range, setRange] = useState('month');
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  // Logic States
  const [detailOpen, setDetailOpen] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingRepair, setIsEditingRepair] = useState(false);
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

  const [detailTab, setDetailTab] = useState(0);
  const [ticketMaterials, setTicketMaterials] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [materialQty, setMaterialQty] = useState(1);
  const [materialSN, setMaterialSN] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);

  const categories = ["Pemasangan Baru", "Installasi Baru", "Perbaikan", "Perubahan Paket", "Pelanggan Berhenti", "Maintenace"];

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

  const fetchJobs = () => {
    let url = `/api/maintenance?range=${range}`;
    if (range === 'custom' && customDates.start && customDates.end) {
      url += `&start=${customDates.start}&end=${customDates.end}`;
    }
    if (statusFilter !== 'all') {
      url += `&status=${statusFilter}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) setJobs(Array.isArray(data.data) ? data.data : []);
      });
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
        const techList = data.data.filter((emp: any) => 
          emp.position_name?.toLowerCase().includes('teknisi') ||
          emp.position_name?.toLowerCase().includes('noc')
        );
        setTechnicians(techList);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchTechnicians();
    fetchInventoryItems();
  }, [range, statusFilter, customDates]);

  const fetchTicketMaterials = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/support/${ticketId}/materials`);
      const data = await res.json();
      if (data.success) {
        setTicketMaterials(data.data);
        const total = data.data.reduce((acc: number, m: any) => acc + (m.quantity * m.purchase_price), 0);
        setEditForm(prev => ({ ...prev, material_cost: total }));
      }
    } catch (err) {}
  };

  const fetchInventoryItems = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) setInventoryItems(data.data);
    } catch (err) {}
  };

  const handleAddMaterial = async () => {
    if (!selectedJob || !selectedMaterial || materialQty <= 0) return;
    setSavingMaterial(true);
    try {
      const res = await fetch('/api/inventory/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedMaterial.id,
          type: 'OUT',
          quantity: materialQty,
          ticket_id: selectedJob.id,
          scenario: 'TICKET_USAGE',
          sn: materialSN || null,
          notes: `Pemakaian material pada maintenance #${selectedJob.id}${materialSN ? ` (SN: ${materialSN})` : ''}`,
          user: 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMaterial(null);
        setMaterialQty(1);
        setMaterialSN('');
        fetchTicketMaterials(selectedJob.id);
        fetchInventoryItems();
      }
    } catch (err) {
      console.error('Failed to add material:', err);
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (logId: number) => {
    if (!selectedJob || !window.confirm('Hapus material ini dan kembalikan ke stok?')) return;
    try {
      const res = await fetch(`/api/support/${selectedJob.id}/materials?log_id=${logId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTicketMaterials(selectedJob.id);
        fetchInventoryItems();
      }
    } catch (err) {
      console.error('Failed to delete material:', err);
    }
  };

  const handleSubmit = async () => {
    if (!newJob.customer_id || !newJob.description) {
      alert("Harap isi lokasi dan deskripsi tugas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
      const data = await res.json();
      if (data.success) {
        setOpenDialog(false);
        setNewJob({ category: 'Maintenace', customer_id: '', priority: 'Medium', difficulty: 'Low', description: '', assigned_to: [] });
        fetchJobs();
      } else {
        alert(data.message || "Gagal membuat job order.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (job: any) => {
    setSelectedJob(job);
    const initialAssignees = job.assigned_ids ? job.assigned_ids.split(',') : [];
    setEditForm({
      category: job.category || 'Maintenace',
      priority: job.priority || 'Medium',
      description: job.description || '',
      repair_description: job.repair_description || '',
      assigned_to: initialAssignees,
      fuel_cost: job.fuel_cost || 0,
      material_cost: job.material_cost || 0,
      other_cost: job.other_cost || 0
    });
    setDetailTab(0);
    fetchTicketMaterials(job.id);
    fetchInventoryItems();
    setIsEditingDesc(false);
    setIsEditingRepair(false);
    setDetailOpen(true);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/support/${selectedJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchJobs();
        setSelectedJob(data.ticket);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/support/${selectedJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedJob,
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
      if (data.success) {
        fetchJobs();
        setSelectedJob(data.ticket);
        setIsEditingDesc(false);
        setIsEditingRepair(false);
      }
    } catch (err) {
      console.error('Failed to save changes:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDirty = useMemo(() => {
    if (!selectedJob) return false;
    const currentAssignees = (selectedJob.assigned_ids ? selectedJob.assigned_ids.split(',') : []).sort().join(',');
    const formAssignees = [...editForm.assigned_to].sort().join(',');
    
    return (
      editForm.category !== selectedJob.category ||
      editForm.priority !== selectedJob.priority ||
      editForm.description !== (selectedJob.description || '') ||
      editForm.repair_description !== (selectedJob.repair_description || '') ||
      formAssignees !== currentAssignees
    );
  }, [editForm, selectedJob]);

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    return jobs.filter(job => 
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.technician_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id?.toString().includes(searchQuery)
    );
  }, [searchQuery, jobs]);

  const stats = useMemo(() => {
    return {
      today: jobs.filter(j => j.status !== 'Selesai').length,
      working: jobs.filter(j => j.status === 'Sedang Dikerjakan').length,
      finished: jobs.filter(j => j.status === 'Selesai' || j.status === 'Resolved').length,
      pending: jobs.filter(j => j.status === 'Open').length
    };
  }, [jobs]);

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Portal>
        <Stack direction="row" justifyContent="flex-end">
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2, py: 0.5 }}
            size="small"
          >
            Buat Job Order
          </Button>
        </Stack>
      </Portal>

          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              { label: "Jobs Aktif", value: stats.today.toString(), icon: <TimelineIcon />, color: theme.palette.primary.main },
              { label: "Dalam Pengerjaan", value: stats.working.toString(), icon: <ScheduleIcon />, color: theme.palette.warning.main },
              { label: "Selesai", value: stats.finished.toString(), icon: <CheckIcon />, color: theme.palette.success.main },
              { label: "Pending", value: stats.pending.toString(), icon: <WarningIcon />, color: theme.palette.error.main },
            ].map((stat) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.label}>
                <Card sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha(stat.color, 0.1), color: stat.color }}>{stat.icon}</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.05em' }}>{stat.label}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card sx={{ overflow: 'hidden', borderRadius: 4, mb: 4 }}>
            <Box sx={{ p: 1, px: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Tabs 
                value={statusFilter} 
                onChange={(_, val) => setStatusFilter(val)}
                sx={{ 
                  '& .MuiTab-root': { fontWeight: 800, fontSize: '0.8rem', minWidth: 100 },
                  '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
                }}
              >
                <Tab label="AKTIF" value="active" />
                <Tab label="SEMUA" value="all" />
                <Tab label="SELESAI" value="finished" />
              </Tabs>

              <Stack direction="row" spacing={2} sx={{ py: 1.5, width: { xs: '100%', md: 'auto' } }}>
                <TextField
                  size="small"
                  placeholder="Cari lokasi atau teknisi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: '1.2rem' }} />,
                  }}
                  sx={{ 
                    minWidth: { md: 280 },
                    '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' }
                  }}
                />
                
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    sx={{ borderRadius: 3, fontWeight: 700, bgcolor: '#f8fafc' }}
                    startAdornment={<FilterIcon sx={{ color: 'text.disabled', mr: 1, fontSize: '1.1rem' }} />}
                  >
                    <MenuItem value="all">Semua Waktu</MenuItem>
                    <MenuItem value="today">Hari Ini</MenuItem>
                    <MenuItem value="yesterday">Kemarin</MenuItem>
                    <MenuItem value="week">Minggu Ini</MenuItem>
                    <MenuItem value="month">Bulan Ini</MenuItem>
                    <MenuItem value="custom">Custom Date</MenuItem>
                  </Select>
                </FormControl>

                {range === 'custom' && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      type="date"
                      value={customDates.start}
                      onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>S/D</Typography>
                    <TextField
                      size="small"
                      type="date"
                      value={customDates.end}
                      onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } }}
                    />
                  </Stack>
                )}
              </Stack>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell>Teknisi</TableCell>
                    <TableCell>Tipe Pekerjaan</TableCell>
                    <TableCell>Lokasi</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                    <TableRow key={job.id} hover onClick={() => handleRowClick(job)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}>
                            {job.technician_name ? job.technician_name.charAt(0) : '?'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {job.technician_name || 'Unassigned'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={job.job_type} 
                          size="small"
                          sx={{ 
                            fontWeight: 700, 
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: 'secondary.main',
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600 }}>{job.location}</TableCell>
                      <TableCell>
                        <Chip 
                          label={job.priority} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            height: 20, 
                            borderRadius: 3,
                            fontSize: '0.625rem', 
                            fontWeight: 800, 
                            borderColor: alpha(job.priority === 'High' ? theme.palette.error.main : theme.palette.warning.main, 0.5),
                            color: job.priority === 'High' ? 'error.main' : 'warning.main'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={job.status} 
                          size="small" 
                          sx={{ 
                            height: 22, 
                            borderRadius: 3,
                            fontSize: '0.625rem', 
                            fontWeight: 800, 
                            bgcolor: alpha(
                              job.status === 'Resolved' || job.status === 'Closed' || job.status === 'Sudah Diperbaiki' || job.status === 'Selesai' ? theme.palette.success.main : 
                              job.status === 'Sedang Dikerjakan' ? theme.palette.primary.main : 
                              job.status === 'Dibatalkan' ? theme.palette.error.main :
                              theme.palette.warning.main, 
                              0.1
                            ),
                            color: 
                              job.status === 'Resolved' || job.status === 'Closed' || job.status === 'Sudah Diperbaiki' || job.status === 'Selesai' ? 'success.main' : 
                              job.status === 'Sedang Dikerjakan' ? 'primary.main' : 
                              job.status === 'Dibatalkan' ? 'error.main' :
                              'warning.main',
                            border: '1px solid'
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Tidak ada data yang ditemukan.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Dialog 
            open={detailOpen} 
            onClose={() => setDetailOpen(false)} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            {selectedJob && (
              <>
                <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <DialogTitle sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                          {selectedJob.location}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.disabled', letterSpacing: 1 }}>
                          #{selectedJob.id}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`TYPE: ${selectedJob.job_type}`} 
                        size="small" 
                        sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.05), color: 'success.main', height: 24 }} 
                      />
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={editForm.category}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          disabled={selectedJob.status === 'Selesai'}
                          sx={{ height: 32, fontSize: '0.75rem', fontWeight: 800, borderRadius: 1.5, bgcolor: '#f8fafc' }}
                        >
                          {categories.map(cat => <MenuItem key={cat} value={cat} sx={{ fontSize: '0.75rem' }}>{cat}</MenuItem>)}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={editForm.priority}
                          onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                          disabled={selectedJob.status === 'Selesai'}
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
                          disabled={selectedJob.status === 'Selesai'}
                          getOptionLabel={(option) => option.id ? option.full_name : ''}
                          getOptionDisabled={(option) => option.current_status === 'Izin' || option.current_status === 'Off'}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          value={employees.filter(e => (editForm.assigned_to || []).includes(e.id.toString()))}
                          onChange={(_, value) => setEditForm(prev => ({ ...prev, assigned_to: value.map(v => v.id.toString()) }))}
                          renderTags={() => null}
                          renderOption={(props, option, { selected }) => {
                            const { key, ...optionProps } = props as any;
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
                                {selectedJob.status !== 'Selesai' && (
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
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: 'text.secondary' }}>DESKRIPSI TUGAS</Typography>
                            {isEditingDesc ? (
                              <TextField fullWidth multiline rows={5} value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} autoFocus sx={{ bgcolor: 'white' }} />
                            ) : (
                              <Paper onClick={() => selectedJob.status !== 'Selesai' && setIsEditingDesc(true)} sx={{ p: 2, minHeight: 120, bgcolor: 'white', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{editForm.description}</Typography>
                              </Paper>
                            )}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: 'text.secondary' }}>KETERANGAN PENYELESAIAN</Typography>
                            {isEditingRepair ? (
                              <TextField fullWidth multiline rows={5} value={editForm.repair_description} onChange={(e) => setEditForm(prev => ({ ...prev, repair_description: e.target.value }))} autoFocus sx={{ bgcolor: 'white' }} />
                            ) : (
                              <Paper onClick={() => selectedJob.status !== 'Selesai' && setIsEditingRepair(true)} sx={{ p: 2, minHeight: 120, bgcolor: alpha(theme.palette.success.main, 0.02), border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'success.main' } }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: editForm.repair_description ? 'text.primary' : 'text.disabled' }}>
                                  {editForm.repair_description || "Tuliskan laporan penyelesaian di sini..."}
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
                        {selectedJob.status !== 'Selesai' && (
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
                            
                            { (selectedMaterial?.track_sn || selectedMaterial?.category_has_sn) && (
                              <TextField 
                                size="small" 
                                label="Serial Number (SN)" 
                                value={materialSN} 
                                onChange={(e) => setMaterialSN(e.target.value)}
                                autoFocus
                                placeholder="Scan atau ketik SN..."
                                sx={{ minWidth: 200 }}
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
                              {selectedJob.status !== 'Selesai' && (
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
                          <TimelineItem label="TUGAS DIBUAT" time={formatWIB(selectedJob.created_at)} active isFirst />
                          <TimelineItem label="OTW KE LOKASI" time={formatWIB(selectedJob.otw_at)} active={!!selectedJob.otw_at} />
                          <TimelineItem label="MULAI DIKERJAKAN" time={formatWIB(selectedJob.working_at)} active={!!selectedJob.working_at} />
                          <TimelineItem label="SUDAH SELESAI" time={formatWIB(selectedJob.resolved_at)} active={!!selectedJob.resolved_at} />
                          <TimelineItem label="CLOSED" time={formatWIB(selectedJob.finished_at)} active={!!selectedJob.finished_at} isLast />
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }} sx={{ p: 4 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, color: 'text.secondary' }}>RINGKASAN STATUS</Typography>
                        <Box sx={{ p: 4, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1), borderRadius: 4, textAlign: 'center' }}>
                          <ClockIcon sx={{ fontSize: '3rem', color: 'success.main', mb: 2 }} />
                          <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.dark' }}>
                            <LiveTimer 
                              createdAt={selectedJob.created_at}
                              createdTimeStr={selectedJob.created_time_str}
                              status={selectedJob.status}
                              finishedAt={selectedJob.finished_at}
                            />
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', letterSpacing: 1 }}>DURASI PENANGANAN AKTIF</Typography>
                        </Box>
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
                  
                  {(selectedJob.status !== 'Selesai' && selectedJob.status !== 'Dibatalkan') && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                      <Button 
                        variant="contained"
                        color="error"
                        onClick={() => {
                          if(window.confirm('Batalkan job order ini? Pastikan Anda membatalkan material jika ada yang sudah di-scan.')){
                            handleStatusUpdate('Dibatalkan');
                          }
                        }}
                        sx={{ height: 45, px: 3, borderRadius: 2.5, fontWeight: 900 }}
                      >
                        BATALKAN JOB
                      </Button>
                      <Button 
                        variant="outlined"
                        onClick={() => handleStatusUpdate(
                          selectedJob.status === 'Open' ? 'OTW' :
                          selectedJob.status === 'OTW' ? 'Sedang Dikerjakan' :
                          selectedJob.status === 'Sedang Dikerjakan' ? 'Resolved' : 'Selesai'
                        )}
                        sx={{ height: 45, px: 4, borderRadius: 2.5, fontWeight: 900 }}
                      >
                        {
                          selectedJob.status === 'Open' ? 'OTW KE LOKASI' :
                          selectedJob.status === 'OTW' ? 'MULAI KERJAKAN' :
                          selectedJob.status === 'Sedang Dikerjakan' ? 'TANDAI SELESAI' :
                          selectedJob.status === 'Resolved' ? 'TUTUP JOB' : 'PROSES'
                        }
                      </Button>
                    </Stack>
                  )}
                </DialogActions>
              </>
            )}
          </Dialog>

          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ fontWeight: 700, mt: 1 }}>Buat Job Order Maintenance</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipe Pekerjaan</InputLabel>
                  <Select
                    value={newJob.category}
                    label="Tipe Pekerjaan"
                    onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}
                  >
                    <MenuItem value="Maintenace">Maintenance</MenuItem>
                    <MenuItem value="Installasi Baru">Installasi Baru</MenuItem>
                    <MenuItem value="Pemasangan Baru">Pemasangan Baru</MenuItem>
                    <MenuItem value="Perbaikan">Perbaikan Umum</MenuItem>
                  </Select>
                </FormControl>

                <TextField 
                  label="Lokasi / Target Pekerjaan" 
                  fullWidth 
                  required 
                  value={newJob.customer_id}
                  onChange={(e) => setNewJob({ ...newJob, customer_id: e.target.value })}
                  placeholder="Contoh: Ruang Server, Office, atau Alamat Lengkap"
                />

                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Prioritas</InputLabel>
                    <Select
                      value={newJob.priority}
                      label="Prioritas"
                      onChange={(e) => setNewJob({ ...newJob, priority: e.target.value })}
                    >
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Tingkat Kesulitan</InputLabel>
                    <Select
                      value={newJob.difficulty}
                      label="Tingkat Kesulitan"
                      onChange={(e) => setNewJob({ ...newJob, difficulty: e.target.value })}
                    >
                      <MenuItem value="High">High (Sulit)</MenuItem>
                      <MenuItem value="Medium">Medium (Sedang)</MenuItem>
                      <MenuItem value="Low">Low (Mudah)</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Autocomplete
                  multiple
                  options={technicians}
                  disableCloseOnSelect
                  getOptionLabel={(option) => option.full_name}
                  value={technicians.filter(t => newJob.assigned_to.includes(t.id))}
                  onChange={(_, value) => setNewJob({ ...newJob, assigned_to: value.map(v => v.id) })}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props as any;
                    return (
                      <li key={option.id} {...optionProps}>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.position_name}</Typography>
                        </Stack>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Tugaskan Teknisi (Opsional)" placeholder="Pilih teknisi..." />
                  )}
                />

                <TextField 
                  label="Detail Deskripsi Pekerjaan" 
                  fullWidth 
                  required
                  multiline 
                  rows={4}
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 4, pt: 2 }}>
              <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 700 }}>Batal</Button>
              <Button 
                variant="contained" 
                onClick={handleSubmit} 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
              >
                {loading ? 'Menyimpan...' : 'Simpan Job Order'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
  );
}
