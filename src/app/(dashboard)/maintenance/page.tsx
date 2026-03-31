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
  FilterList as FilterIcon
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

  // Action Menu States
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Filter States
  const [range, setRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  // Logic States
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingRepair, setIsEditingRepair] = useState(false);
  const [editForm, setEditForm] = useState({
    category: '',
    priority: '',
    description: '',
    repair_description: '',
    assigned_to: [] as string[]
  });

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
  }, [range, statusFilter, customDates]);

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

  // Kebab Menu Handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, job: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenDetail = () => {
    const job = selectedJob;
    const initialAssignees = job.assigned_ids ? job.assigned_ids.split(',') : [];
    setEditForm({
      category: job.category || 'Maintenace',
      priority: job.priority || 'Medium',
      description: job.description || '',
      repair_description: job.repair_description || '',
      assigned_to: initialAssignees
    });
    setIsEditingDesc(false);
    setIsEditingRepair(false);
    setDetailOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedJob) return;
    try {
      const res = await fetch(`/api/support/${selectedJob.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
        setDeleteDialogOpen(false);
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
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
          assigned_to: editForm.assigned_to
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
    <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
                Maintenance & Field Tech
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Jadwalkan instalasi dan perbaikan jaringan di lapangan.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ borderRadius: 3, fontWeight: 600 }}
            >
              Buat Job Order
            </Button>
          </Stack>

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
                <Tab label="SEMUA" value="all" />
                <Tab label="AKTIF" value="active" />
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
                    <TableCell align="right">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                    <TableRow key={job.id} hover>
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
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, job)}>
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
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

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{ sx: { borderRadius: 2, minWidth: 150, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
          >
            <MenuItem onClick={handleOpenDetail} sx={{ gap: 1.5, py: 1.2 }}>
              <TaskIcon fontSize="small" color="primary" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Detail Task</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDeleteClick} sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}>
              <DeleteIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Hapus Job</Typography>
            </MenuItem>
          </Menu>

          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle sx={{ fontWeight: 700 }}>Hapus Job Order?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Apakah Anda yakin ingin menghapus job order ini? Tindakan ini tidak dapat dibatalkan.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
              <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ borderRadius: 2 }}>
                Ya, Hapus
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog 
            open={detailOpen} 
            onClose={() => setDetailOpen(false)} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            {selectedJob && (
              <>
                <DialogTitle sx={{ p: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 2, display: 'block', mb: 1 }}>
                      #{selectedJob.id} &nbsp; JOB ORDER DETAILS & ASSIGNMENT
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
                      {selectedJob.location}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Chip 
                        label={`TYPE: ${selectedJob.job_type}`} 
                        size="small" 
                        sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.05), color: 'success.main', borderRadius: 1.5 }} 
                      />
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={editForm.category}
                        onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                        disabled={selectedJob.status === 'Selesai'}
                        sx={{ fontWeight: 800, borderRadius: 2, bgcolor: '#f8fafc', '& fieldset': { borderColor: 'divider' } }}
                      >
                        {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={editForm.priority}
                        onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                        disabled={selectedJob.status === 'Selesai'}
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

                    {selectedJob.status === 'Sudah Diperbaiki' && (
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

                    {selectedJob.status === 'Open' && (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={() => {
                          if (window.confirm('Apakah Anda yakin ingin membatalkan job ini?')) {
                            handleStatusUpdate('Dibatalkan');
                          }
                        }}
                        sx={{ p: 1.2, fontWeight: 900, borderRadius: 3, letterSpacing: 0.5 }}
                      >
                        BATALKAN JOB
                      </Button>
                    )}

                    <IconButton onClick={() => setDetailOpen(false)} sx={{ ml: 1 }}>
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                </DialogTitle>
                
                <DialogContent sx={{ p: 0 }}>
                  <Grid container sx={{ minHeight: 450 }}>
                    {/* 1. PENUGASAN TIM */}
                    <Grid size={{ xs: 12, md: 3.8 }} sx={{ p: 4 }}>
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 2 }}>
                          PENUGASAN TIM TEKNISI
                        </Typography>
                        <Autocomplete
                          multiple
                          size="small"
                          options={technicians}
                          disabled={selectedJob.status === 'Selesai'}
                          getOptionLabel={(option) => option.full_name || ''}
                          getOptionDisabled={(option) => option.current_status === 'Izin' || option.current_status === 'Off'}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          value={employees.filter(e => (editForm.assigned_to || []).includes(e.id.toString()))}
                          onChange={(_, value) => setEditForm(prev => ({ ...prev, assigned_to: value.map(v => v.id.toString()) }))}
                          renderTags={() => null}
                          renderOption={(props, option, { selected }) => {
                            const { key, ...optionProps } = props as any;
                            const isIzin = option.current_status === 'Izin';
                            return (
                              <li key={option.id} {...optionProps}>
                                <Checkbox
                                  icon={icon}
                                  checkedIcon={checkedIcon}
                                  style={{ marginRight: 8 }}
                                  checked={selected}
                                  disabled={isIzin || option.current_status === 'Off'}
                                />
                                <Box sx={{ flexGrow: 1, opacity: (isIzin || option.current_status === 'Off') ? 0.5 : 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: (isIzin || option.current_status === 'Off') ? 400 : 600 }}>
                                    {option.full_name} 
                                    {isIzin && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'error.main', fontWeight: 900 }}>(SEDANG IZIN)</Typography>}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.position_name} • {option.current_status}
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
                                      {emp.full_name.charAt(0)}
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
                                  {selectedJob.status !== 'Selesai' && (
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
                            <Box sx={{ py: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3, color: 'text.disabled' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Belum ada teknisi ditugaskan</Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    </Grid>

                    {/* 2. DESKRIPSI PEKERJAAN */}
                    <Grid size={{ xs: 12, md: 5.2 }} sx={{ p: 4, borderLeft: '1px solid', borderColor: 'divider', bgcolor: '#fcfdfe' }}>
                      <Stack spacing={3}>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                              <MessageIcon sx={{ fontSize: '1rem' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', textTransform: 'uppercase' }}>
                              DESKRIPSI TUGAS
                            </Typography>
                          </Stack>
                          
                          {isEditingDesc ? (
                            <TextField
                              fullWidth multiline rows={6}
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                              autoFocus
                              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 4, p: 2 } }}
                            />
                          ) : (
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 2.5, bgcolor: 'white', borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'relative', minHeight: 180,
                                '&:hover': selectedJob.status !== 'Selesai' ? { bgcolor: 'white', borderColor: 'primary.main', cursor: 'pointer' } : {}
                              }}
                              onClick={() => selectedJob.status !== 'Selesai' && setIsEditingDesc(true)}
                            >
                              {selectedJob.status !== 'Selesai' && (
                                <IconButton size="small" sx={{ position: 'absolute', top: 12, right: 12 }}>
                                  <EditIcon sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              )}
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', lineHeight: 1.6, fontWeight: 500 }}>
                                {editForm.description || "Klik untuk menambah deskripsi..."}
                              </Typography>
                            </Paper>
                          )}
                        </Box>

                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.main' }}>
                              <TaskIcon sx={{ fontSize: '1rem' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', textTransform: 'uppercase' }}>
                              KETERANGAN PENYELESAIAN
                            </Typography>
                          </Stack>
                          
                          {isEditingRepair ? (
                            <TextField
                              fullWidth multiline rows={10}
                              value={editForm.repair_description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, repair_description: e.target.value }))}
                              autoFocus
                              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 4, p: 2 } }}
                            />
                          ) : (
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 2.5, bgcolor: alpha(theme.palette.success.main, 0.02), borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'relative', minHeight: 250,
                                '&:hover': selectedJob.status !== 'Selesai' ? { bgcolor: 'white', borderColor: theme.palette.success.main, cursor: 'pointer' } : {}
                              }}
                              onClick={() => selectedJob.status !== 'Selesai' && setIsEditingRepair(true)}
                            >
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: editForm.repair_description ? 'text.primary' : 'text.disabled', lineHeight: 1.6, fontWeight: 500 }}>
                                {editForm.repair_description || "Klik untuk menuliskan keterangan penyelesaian..."}
                              </Typography>
                            </Paper>
                          )}
                        </Box>
                      </Stack>
                    </Grid>

                    {/* 3. DURASI & TIMELINE */}
                    <Grid size={{ xs: 12, md: 3 }} sx={{ p: 4, borderLeft: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 3 }}>
                          DURASI PEKERJAAN
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: alpha(theme.palette.success.main, 0.06), p: 2, borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'success.main', color: 'white', display: 'flex' }}>
                            <ClockIcon sx={{ fontSize: '1.2rem' }} />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'block' }}>TIMER AKTIF</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: 'success.dark' }}>
                              <LiveTimer 
                                createdAt={selectedJob.created_at}
                                createdTimeStr={selectedJob.created_time_str}
                                status={selectedJob.status}
                                finishedAt={selectedJob.finished_at}
                              />
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.disabled', letterSpacing: 2, textTransform: 'uppercase', display: 'block', mb: 3 }}>
                        TIMELINE STATUS
                      </Typography>
                      <Stack spacing={0}>
                        <TimelineItem label="TUGAS DIBUAT" time={formatWIB(selectedJob.created_at)} active isFirst />
                        <TimelineItem label="OTW KE LOKASI" time={formatWIB(selectedJob.otw_at)} active={!!selectedJob.otw_at} />
                        <TimelineItem label="MULAI DIKERJAKAN" time={formatWIB(selectedJob.working_at)} active={!!selectedJob.working_at} />
                        <TimelineItem label="SUDAH SELESAI" time={formatWIB(selectedJob.resolved_at)} active={!!selectedJob.resolved_at} />
                        <TimelineItem label="CLOSED" time={formatWIB(selectedJob.finished_at)} active={!!selectedJob.finished_at} isLast />
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
                      sx={{ height: 42, px: 4, borderRadius: 2.5, fontWeight: 900 }}
                    >
                      SIMPAN PERUBAHAN
                    </Button>
                  )}
                                   {selectedJob.status !== 'Selesai' && selectedJob.status !== 'Dibatalkan' && (
                    <Stack direction="row" spacing={2}>
                      <Button 
                        variant="outlined"
                        onClick={() => handleStatusUpdate(
                          selectedJob.status === 'Open' ? 'OTW' :
                          selectedJob.status === 'OTW' ? 'Sedang Dikerjakan' :
                          selectedJob.status === 'Sedang Dikerjakan' ? 'Resolved' :
                          'Selesai'
                        )}
                        sx={{ height: 42, px: 4, borderRadius: 2.5, fontWeight: 900, borderColor: 'divider' }}
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
                </Box>
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
