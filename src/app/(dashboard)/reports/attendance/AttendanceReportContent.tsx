'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Stack, 
  Tooltip,
  CircularProgress,
  alpha,
  useTheme,
  Avatar,
  Chip,
  Button,
  Divider
} from '@mui/material';
import { 
  ChevronLeft as PrevIcon, 
  ChevronRight as NextIcon,
  FactCheck as PresenceIcon,
  HelpOutline as HelpIcon,
  FileDownload as DownloadIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';

// --- HELPERS ---
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMonthDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

const getMonthName = (date: Date) => {
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

// --- COMPONENT ---
export default function AttendanceReportContent() {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    employees: any[];
    attendance: any[];
    leaves: any[];
    shifts: any[];
    holidays: any[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`/api/reports/attendance?year=${year}&month=${month}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const monthDays = getMonthDays(currentDate);

  const getAttendanceStatus = (employeeId: number, date: Date) => {
    if (!data) return null;
    const dateStr = formatDate(date);
    const day = date.getDay();
    const isSunday = day === 0;

    // 0. Check for Explicit Shift on this date
    const shift = data.shifts.find(s => s.employee_id === employeeId && formatDate(new Date(s.date)) === dateStr);

    // 1. Check Holiday/Sunday (ONLY if no explicit shift is scheduled)
    const holiday = data.holidays.find(h => h.date === dateStr);
    const isRedDay = !!holiday || isSunday;
    
    if (isRedDay && !shift) {
      return { status: 'L', color: '#94a3b8', label: holiday?.name || 'Hari Minggu' };
    }

    // 2. Check Attendance Logs
    const dayLogs = data.attendance.filter(a => a.employee_id === employeeId && formatDate(new Date(a.date)) === dateStr);
    const clockIn = dayLogs.find(a => a.type === 'clock_in');
    const breakIn = dayLogs.find(a => a.type === 'break_in');
    
    if (clockIn || breakIn) {
      // Calculate late duration
      let lateLabels: string[] = [];
      let totalLateM = 0;
      let color = '#10b981';
      let statusLetter = 'H';

      // A. Morning Late
      if (clockIn && shift && shift.start_time) {
        const actual = new Date(clockIn.timestamp);
        const [sh, sm] = shift.start_time.split(':').map(Number);
        const shiftStart = new Date(actual);
        shiftStart.setHours(sh, sm, 0, 0);
        
        const lateM = Math.floor((actual.getTime() - shiftStart.getTime()) / 60000);
        if (lateM > 0) {
          totalLateM += lateM;
          lateLabels.push(`Pagi: ${lateM >= 60 ? `${Math.floor(lateM/60)}j ${lateM%60}m` : `${lateM}m`}`);
        }
      }

      // B. Break Late (Grace period 10 minutes)
      if (breakIn && shift && shift.break_end) {
        const actual = new Date(breakIn.timestamp);
        const [bh, bm] = shift.break_end.split(':').map(Number);
        const breakEnd = new Date(actual);
        breakEnd.setHours(bh, bm, 0, 0);

        const lateM = Math.floor((actual.getTime() - breakEnd.getTime()) / 60000);
        if (lateM > 10) { // Only count as late if > 10 minutes
          totalLateM += lateM;
          lateLabels.push(`Istirahat: ${lateM >= 60 ? `${Math.floor(lateM/60)}j ${lateM%60}m` : `${lateM}m`}`);
        }
      }

      if (totalLateM > 0) {
        color = '#f59e0b'; // Orange
        statusLetter = 'T'; // Terlambat
      }

      return { 
        status: statusLetter, 
        color: color, 
        label: totalLateM > 0 ? `Terlambat (${lateLabels.join(', ')})` : 'Hadir',
        isLate: totalLateM > 0
      };
    }

    // 3. Check Leave
    const leave = data.leaves.find(l => 
      l.employee_id === employeeId && 
      dateStr >= formatDate(new Date(l.start_date)) && 
      dateStr <= formatDate(new Date(l.end_date))
    );
    if (leave) {
      const typeLabel = leave.type ? leave.type.charAt(0).toUpperCase() + leave.type.slice(1) : 'Izin';
      return { 
        status: 'I', 
        color: '#f59e0b', 
        label: `${typeLabel}${leave.reason ? `: ${leave.reason}` : ''}` 
      };
    }

    // 4. Fallback: Alpa (If it was a workday or a RedDay with a Shift)
    const now = new Date();
    const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (isPast) {
      return { status: 'A', color: '#ef4444', label: 'Alpa (Tanpa Keterangan)' };
    }

    return null;
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PresenceIcon color="primary" /> Laporan Absensi
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Rekapan kehadiran bulanan untuk penilaian performa.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Stack direction="row" alignItems="center" bgcolor="background.paper" sx={{ borderRadius: 2, p: 0.3, border: '1px solid', borderColor: 'divider' }}>
            <IconButton size="small" onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() - 1);
              setCurrentDate(d);
            }}><PrevIcon fontSize="small" /></IconButton>
            <Typography variant="body2" sx={{ px: 1, fontWeight: 700, minWidth: 120, textAlign: 'center' }}>
              {getMonthName(currentDate)}
            </Typography>
            <IconButton size="small" onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() + 1);
              setCurrentDate(d);
            }}><NextIcon fontSize="small" /></IconButton>
          </Stack>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
            PDF
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer sx={{ maxHeight: '75vh' }}>
          <Table sx={{ tableLayout: 'fixed' }} stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 900, 
                  width: 160, 
                  position: 'sticky', 
                  left: 0, 
                  bgcolor: '#ffffff', 
                  zIndex: 50,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  top: 0,
                  fontSize: '0.7rem'
                }}>
                  PEGAWAI
                </TableCell>
                {monthDays.map(d => {
                  const dateStr = formatDate(d);
                  const isSunday = d.getDay() === 0;
                  const holiday = data?.holidays.find(h => h.date === dateStr);
                  const isRed = isSunday || !!holiday;
                  
                  return (
                    <TableCell key={dateStr} align="center" sx={{ 
                      fontWeight: 900, 
                      width: 32, 
                      p: 0, 
                      bgcolor: isRed ? '#fef2f2' : '#ffffff', // Solid color to prevent 'shadows'
                      borderBottom: holiday ? '2px solid #ef4444' : 'none',
                      zIndex: 45
                    }}>
                      <Tooltip title={holiday?.name || (isSunday ? 'Hari Minggu' : '')} arrow disableHoverListener={!isRed}>
                        <Box sx={{ cursor: 'help' }}>
                          <Typography variant="caption" color={isRed ? 'error.main' : 'text.secondary'} sx={{ fontWeight: 900, fontSize: '0.55rem', display: 'block', mb: -0.2 }}>
                            {d.toLocaleDateString('id-ID', { weekday: 'short' }).charAt(0).toUpperCase()}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.7rem', color: isRed ? 'error.main' : 'text.primary' }}>{d.getDate()}</Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell sx={{ 
                    position: 'sticky', 
                    left: 0, 
                    bgcolor: '#ffffff', 
                    zIndex: 40,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    p: 1
                  }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}>
                        {emp.full_name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{emp.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', display: 'block', mt: -0.3 }}>{emp.position_name}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  {monthDays.map(d => {
                    const res = getAttendanceStatus(emp.id, d);
                    
                    return (
                      <TableCell key={d.toISOString()} align="center" sx={{ 
                        p: '2px', 
                        borderRight: '1px solid rgba(0,0,0,0.02)',
                        bgcolor: res?.status === 'A' ? '#fef2f2' : (res?.status === 'L' ? '#f8fafc' : '#ffffff')
                      }}>
                        {res && (
                          <Tooltip title={res.label} arrow>
                            <Box sx={{ 
                              width: 26, 
                              height: 26, 
                              borderRadius: '4px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              margin: 'auto',
                              bgcolor: alpha(res.color, 0.1),
                              color: res.color,
                              fontSize: '0.7rem',
                              fontWeight: 900,
                              border: '1px solid',
                              borderColor: alpha(res.color, 0.2)
                            }}>
                              {res.status}
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        * Laporan ini dihasilkan secara otomatis berdasarkan log absensi dan permohonan izin yang disetujui.
      </Typography>
    </Box>
  );
}
