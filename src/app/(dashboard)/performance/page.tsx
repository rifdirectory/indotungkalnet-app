'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Avatar,
  Tooltip,
  IconButton,
  Divider,
  Tabs,
  Tab
} from "@mui/material";
import { 
  TrendingUp as TrendingUpIcon, 
  AssignmentTurnedIn as TicketIcon,
  Schedule as ClockIcon,
  ThumbDown as BadIcon,
  ThumbUp as GoodIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Edit as EditIcon,
  BarChart as ChartIcon,
  Today as TodayIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import dynamic from 'next/dynamic';

const PerformanceDashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  
  const [globalStats, setGlobalStats] = useState({ total_tickets: 0, avg_duration: 0 });
  
  // States are initialized normally now because SSR is disabled
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<number>(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(now.toISOString().split('T')[0]);
  
  const [openAppraisal, setOpenAppraisal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [appraisalForm, setAppraisalForm] = useState({
    rating: 'GOOD',
    notes: ''
  });

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.success) setUser(data.user);
    } catch (err) {
      console.error('Session fetch failed:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const view = activeTab === 0 ? 'monthly' : 'daily';
      const url = view === 'monthly' 
        ? `/api/performance?view=monthly&month=${filterMonth}&year=${filterYear}`
        : `/api/performance?view=daily&date=${selectedDate}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
        if (data.global_metrics) setGlobalStats(data.global_metrics);
      }
    } catch (err) {
      console.error('Data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    setEmployees([]);
    fetchData();
  }, [filterMonth, filterYear, selectedDate, activeTab]);

  const handleOpenAppraisal = (emp: any) => {
    setSelectedEmp(emp);
    setAppraisalForm({
      rating: emp.appraisal?.rating || 'GOOD',
      notes: emp.appraisal?.notes || ''
    });
    setOpenAppraisal(true);
  };

  const handleSubmitAppraisal = async () => {
    if (!selectedEmp || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmp.id,
          pic_id: user.id,
          date: activeTab === 1 ? selectedDate : `${filterYear}-${filterMonth}-01`,
          rating: appraisalForm.rating,
          notes: appraisalForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setOpenAppraisal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Appraisal submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (mins: number) => {
    if (!mins) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}j ${m}m` : `${h}j`;
  };

  const overviewStats = useMemo(() => {
    if (employees.length === 0 || activeTab !== 0) return { avgAtt: 0, totalTickets: 0, avgDur: 0, avgScore: 0 };
    const validEmps = employees.filter(emp => emp.metrics);
    if (validEmps.length === 0) return { avgAtt: 0, totalTickets: 0, avgDur: 0, avgScore: 0 };

    const totalAtt = validEmps.reduce((acc, emp) => acc + (emp.metrics?.attendance_percentage || 0), 0);
    const totalScore = validEmps.reduce((acc, emp) => acc + (emp.metrics?.total_score || 0), 0);
    
    return {
      avgAtt: Math.round(totalAtt / validEmps.length),
      totalTickets: globalStats.total_tickets,
      avgDur: globalStats.avg_duration,
      avgScore: Math.round(totalScore / validEmps.length)
    };
  }, [employees, activeTab, globalStats]);

  return (
    <Box sx={{ p: { xs: 3, md: 5 }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }} spacing={3} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Penilaian Kinerja
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {activeTab === 0 
              ? `Laporan akumulasi performa periode ${months[filterMonth - 1]} ${filterYear}.` 
              : `Pencatatan penilaian harian untuk tanggal ${selectedDate}.`
            }
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            sx={{ 
              bgcolor: 'white', 
              borderRadius: 4, 
              p: 0.5, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              '& .MuiTabs-indicator': { height: '100%', borderRadius: 3.5, bgcolor: alpha(theme.palette.primary.main, 0.1) },
              '& .MuiTab-root': { borderRadius: 3.5, fontWeight: 700, minHeight: 45, zIndex: 1, textTransform: 'none' }
            }}
          >
            <Tab icon={<ChartIcon sx={{ fontSize: 18 }} />} label="Laporan Bulanan" iconPosition="start" />
            <Tab icon={<TodayIcon sx={{ fontSize: 18 }} />} label="Input Harian" iconPosition="start" />
          </Tabs>

          <Card sx={{ p: 1, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', gap: 1 }}>
            {activeTab === 0 ? (
              <>
                <TextField
                  select size="small" value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 3, border: 'none', '& fieldset': { border: 'none' } } }}
                >
                  {months.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
                </TextField>
                <Divider orientation="vertical" flexItem />
                <TextField
                  select size="small" value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  sx={{ minWidth: 100, '& .MuiOutlinedInput-root': { borderRadius: 3, border: 'none', '& fieldset': { border: 'none' } } }}
                >
                  {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </TextField>
              </>
            ) : (
              <TextField
                type="date" size="small" value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 3, border: 'none', '& fieldset': { border: 'none' } } }}
              />
            )}
          </Card>
        </Stack>
      </Stack>

      {/* Monthly Stats Cards (Only in Tab 0) */}
      {activeTab === 0 && (
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { label: "Rata-rata Presensi", value: `${overviewStats.avgAtt}%`, icon: <ClockIcon />, color: theme.palette.primary.main },
            { label: "Total Tiket Selesai", value: overviewStats.totalTickets, icon: <TicketIcon />, color: theme.palette.success.main },
            { label: "Rerata Durasi", value: formatDuration(overviewStats.avgDur), icon: <TrendingUpIcon />, color: theme.palette.warning.main },
            { label: "Rerata Skor Tim", value: `${overviewStats.avgScore}/100`, icon: <ChartIcon />, color: theme.palette.info.main },
          ].map((stat, i) => (
            <Grid size={{ xs: 12, md: 3 }} key={i}>
              <Card sx={{ p: 3, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -5, right: -5, p: 3, opacity: 0.1, color: stat.color }}>{React.cloneElement(stat.icon as any, { size: 40 })}</Box>
                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', tracking: 1 }}>{stat.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{stat.value}</Typography>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Main Content */}
      <Card sx={{ borderRadius: 5, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, py: 2.5 }}>PEGAWAI</TableCell>
                {activeTab === 0 ? (
                  <>
                    <TableCell sx={{ fontWeight: 800 }}>PRESENSI</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>TERLAMBAT</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>TIKET</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>DURASI</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>RATING PIC</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>SKOR TOTAL</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={{ fontWeight: 800 }}>RATING HARI INI</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>CATATAN</TableCell>
                  </>
                )}
                {activeTab === 1 && <TableCell align="right" sx={{ fontWeight: 800 }}>AKSI</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : employees.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><Typography color="text.secondary">Tidak ada data.</Typography></TableCell></TableRow>
              ) : employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800, fontSize: 14 }}>{emp.full_name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emp.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{emp.position_name}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  
                  {activeTab === 0 ? (
                    <>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{emp.metrics?.attendance_percentage || 0}%</Typography>
                        <Typography variant="caption" color="text.secondary">{emp.metrics?.days_present || 0}/{emp.metrics?.total_work_days || 0} hari</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: (emp.metrics?.late_minutes || 0) > 0 ? 'error.main' : 'text.primary' }}>
                          {formatDuration(emp.metrics?.late_minutes || 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{emp.metrics?.late_count || 0}x terlambat</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{emp.metrics?.ticket_count || 0} Tiket</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 700, color: (emp.metrics?.avg_resolution_time_minutes || 0) > 120 ? 'error.main' : 'text.primary' }}>{formatDuration(emp.metrics?.avg_resolution_time_minutes || 0)}</Typography></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Chip size="small" icon={<GoodIcon sx={{ fontSize: 14 }} />} label={emp.metrics?.good_count || 0} color="success" sx={{ fontWeight: 900, borderRadius: 2 }} />
                          <Chip size="small" icon={<BadIcon sx={{ fontSize: 14 }} />} label={emp.metrics?.bad_count || 0} color="error" sx={{ fontWeight: 900, borderRadius: 2 }} />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ 
                          width: 45, height: 45, borderRadius: '50%', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: (emp.metrics?.total_score || 0) >= 80 ? alpha(theme.palette.success.main, 0.1) : 
                                   (emp.metrics?.total_score || 0) >= 60 ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                          border: '2px solid',
                          borderColor: (emp.metrics?.total_score || 0) >= 80 ? theme.palette.success.main : 
                                       (emp.metrics?.total_score || 0) >= 60 ? theme.palette.warning.main : theme.palette.error.main
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: (emp.metrics?.total_score || 0) >= 80 ? 'success.main' : (emp.metrics?.total_score || 0) >= 60 ? 'warning.main' : 'error.main' }}>
                            {emp.metrics?.total_score || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        {emp.appraisal ? (
                          <Chip 
                            icon={emp.appraisal.rating === 'GOOD' ? <GoodIcon sx={{ fontSize: 14 }} /> : <BadIcon sx={{ fontSize: 14 }} />}
                            label={emp.appraisal.rating} color={emp.appraisal.rating === 'GOOD' ? 'success' : 'error'} size="small" sx={{ fontWeight: 900, borderRadius: 2 }}
                          />
                        ) : <Typography variant="caption" color="text.disabled">-</Typography>}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500 }} noWrap>{emp.appraisal?.notes || '-'}</Typography>
                      </TableCell>
                    </>
                  )}

                  {activeTab === 1 && (
                    <TableCell align="right">
                      {(user?.role === 'admin' || user?.id === emp.pic_id) && (
                        <Button 
                          size="small" variant="outlined" startIcon={<EditIcon />} 
                          onClick={() => handleOpenAppraisal(emp)}
                          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
                        >
                          {emp.appraisal ? 'Edit Harian' : 'Beri Nilai'}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openAppraisal} onClose={() => setOpenAppraisal(false)} PaperProps={{ sx: { borderRadius: 5, p: 1, maxWidth: 450 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Penilaian: {selectedEmp?.full_name}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {activeTab === 0 ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>Statistik Akumulasi Bulan Ini:</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}><Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius:3 }}> <Typography variant="h5" sx={{ fontWeight: 900 }}>{selectedEmp?.metrics?.attendance_percentage}%</Typography> <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Presensi</Typography> </Box></Grid>
                  <Grid size={{ xs: 4 }}><Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius:3 }}> <Typography variant="h5" sx={{ fontWeight: 900, color: (selectedEmp?.metrics?.late_minutes || 0) > 0 ? 'error.main' : 'text.primary' }}>{formatDuration(selectedEmp?.metrics?.late_minutes || 0)}</Typography> <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Terlambat</Typography> </Box></Grid>
                  <Grid size={{ xs: 4 }}><Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius:3 }}> <Typography variant="h5" sx={{ fontWeight: 900 }}>{selectedEmp?.metrics?.ticket_count || 0}</Typography> <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Tiket</Typography> </Box></Grid>
                  
                  <Grid size={{ xs: 6 }}><Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius:3 }}> <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main' }}>{selectedEmp?.metrics?.good_count || 0}</Typography> <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Total GOOD</Typography> </Box></Grid>
                  <Grid size={{ xs: 6 }}><Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius:3 }}> <Typography variant="h5" sx={{ fontWeight: 900, color: 'error.main' }}>{selectedEmp?.metrics?.bad_count || 0}</Typography> <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Total BAD</Typography> </Box></Grid>
                </Grid>
              </Box>
            ) : (
              <>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', mb: 1.5, display: 'block' }}>RATING HARIAN</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button fullWidth variant={appraisalForm.rating === 'GOOD' ? 'contained' : 'outlined'} color="success" onClick={() => setAppraisalForm({ ...appraisalForm, rating: 'GOOD' })} startIcon={<GoodIcon />} sx={{ borderRadius: 3, py: 1.5, fontWeight: 900 }}>GOOD</Button>
                    <Button fullWidth variant={appraisalForm.rating === 'BAD' ? 'contained' : 'outlined'} color="error" onClick={() => setAppraisalForm({ ...appraisalForm, rating: 'BAD' })} startIcon={<BadIcon />} sx={{ borderRadius: 3, py: 1.5, fontWeight: 900 }}>BAD</Button>
                  </Stack>
                </Box>
                <TextField fullWidth multiline rows={3} label="Catatan Harian" value={appraisalForm.notes} onChange={(e) => setAppraisalForm({ ...appraisalForm, notes: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }} />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAppraisal(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Tutup</Button>
          {activeTab === 1 && (
            <Button variant="contained" onClick={handleSubmitAppraisal} disabled={submitting} sx={{ borderRadius: 3, px: 4, fontWeight: 800 }}>Simpan</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const LoadingState = () => (
  <Box sx={{ p: { xs: 3, md: 5 }, minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress size={40} thickness={4} />
  </Box>
);

const PerformancePage = dynamic(() => Promise.resolve(PerformanceDashboard), {
  ssr: false,
  loading: () => <LoadingState />
});

export default PerformancePage;
