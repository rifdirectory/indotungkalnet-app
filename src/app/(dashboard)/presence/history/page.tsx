'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Avatar, 
  Chip, TextField, MenuItem, Divider, Grid, IconButton, Tooltip
} from "@mui/material";
import { 
  FactCheck as PresenceIcon, 
  Search as SearchIcon, 
  FileDownload as ExportIcon, 
  LocationOn as LocationIcon, 
  PhotoCamera as PhotoIcon,
  FilterList as FilterIcon
} from "@mui/icons-material";

// Helper to get today's date in YYYY-MM-DD format (Jakarta Time)
const getJakartaDate = () => {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Jakarta', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(new Date());
};

export default function HistoryPage() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState('today');
  const [viewMode, setViewMode] = useState<'log' | 'summary' | 'grid'>('log'); // Default to log
  const [dateRange, setDateRange] = useState({ 
    start: getJakartaDate(), 
    end: getJakartaDate() 
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    // Mode logic: log, summary, or grid
    const modeParam = (filter === 'month' && viewMode === 'summary') ? '&mode=summary' : 
                      (filter === 'month' && viewMode === 'grid') ? '&mode=grid' : '';
    let url = `/api/presence/history?start=${dateRange.start}&end=${dateRange.end}${modeParam}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.success) {
        setHistory(data.data);
        if (data.leaves) setLeaves(data.leaves);
        if (data.overtimes) setOvertimes(data.overtimes);
    }
  };

  const [leaves, setLeaves] = useState<any[]>([]);
  const [overtimes, setOvertimes] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange, viewMode]);

  const handleFilterChange = (val: string) => {
    setFilter(val);
    if (val === 'today') {
      const today = getJakartaDate();
      setDateRange({ start: today, end: today });
      setViewMode('log');
    } else if (val === 'month') {
      const today = new Date();
      const firstDay = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const y = firstDay.getFullYear();
      const m = firstDay.getMonth();
      const firstStr = `${y}-${(m+1).toString().padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0);
      const lastStr = `${y}-${(m+1).toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`;
      
      setDateRange({ start: firstStr, end: lastStr });
      setViewMode('grid'); // Default to Grid (Calendar) for month
    }
  };

  // Helper for Grid Data Processing
  const getGridDays = () => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const days = [];
    let curr = new Date(start);
    while (curr <= end) {
      days.push({
        num: curr.getDate(),
        name: curr.toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase(),
        isHoliday: curr.getDay() === 0, // Sunday
        fullDate: curr.toISOString().split('T')[0]
      });
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  };

  const processGridData = () => {
    const employeesMap: {[id: string]: any} = {};
    const todayStr = getJakartaDate();
    const now = new Date();

    history.forEach(log => {
      if (!employeesMap[log.employee_id]) {
        employeesMap[log.employee_id] = {
          id: log.employee_id,
          name: log.employee_name,
          position: log.position_name,
          days: {}
        };
      }
      if (log.timestamp) {
        const timestamp = new Date(log.timestamp);
        const d = timestamp.getDate();
        const dateStr = timestamp.toISOString().split('T')[0];

        if (!employeesMap[log.employee_id].days[d]) {
          employeesMap[log.employee_id].days[d] = { 
            in: null, out: null, status: null,
            late_m: 0, ovt_m: 0, 
            leave: null, overtimePIC: null
          };
        }
        
        const dayData = employeesMap[log.employee_id].days[d];
        const actual = new Date(log.timestamp);
        
        if (log.type === 'clock_in') {
          dayData.in = actual.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          dayData.status = log.status;
          
          // Calculate Late Minutes (Default 08:00 if no shift)
          const sStart = log.shift_start || '08:00:00';
          const [sh, sm] = sStart.split(':').map(Number);
          const shiftStart = new Date(actual);
          shiftStart.setHours(sh, sm, 0, 0);
          dayData.late_m = Math.max(0, Math.floor((actual.getTime() - shiftStart.getTime()) / 60000));
        } else if (log.type === 'clock_out') {
          dayData.out = actual.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          
          // Calculate Overtime Minutes (Default 16:00 if no shift)
          const sEnd = log.shift_end || '16:00:00';
          const [eh, em] = sEnd.split(':').map(Number);
          const shiftEnd = new Date(actual);
          shiftEnd.setHours(eh, em, 0, 0);
          dayData.ovt_m = Math.max(0, Math.floor((actual.getTime() - shiftEnd.getTime()) / 60000));
        }
      }
    });

    // Map Leaves & Overtimes & Check Absence
    const employees = Object.values(employeesMap);
    const gridDays = getGridDays();

    employees.forEach((emp: any) => {
        gridDays.forEach(day => {
            const dateStr = day.fullDate;
            const dNum = day.num;

            if (!emp.days[dNum]) {
                emp.days[dNum] = { in: null, out: null, status: null, late_m: 0, ovt_m: 0, leave: null, overtimePIC: null };
            }

            // 1. Check for Leaves
            const leave = leaves.find(l => l.employee_id === emp.id && dateStr >= l.start_date && dateStr <= l.end_date);
            if (leave) emp.days[dNum].leave = leave.type;

            // 2. Check for Overtime Assignment
            const ovt = overtimes.find(o => o.employee_id === emp.id && o.date === dateStr);
            if (ovt) emp.days[dNum].overtimePIC = ovt.duration_minutes;

            // 3. Strict 20m Late Logic for past workdays
            if (!emp.days[dNum].in && !emp.days[dNum].leave && !day.isHoliday) {
                // If past date, or today and past grace period
                // For simplicity, if date < today, we mark as 'LATE (ABSENT)'
                if (dateStr < todayStr) {
                    emp.days[dNum].status = 'late';
                    emp.days[dNum].late_m = 'ABSEN';
                }
            }
        });
    });

    return employees;
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PresenceIcon color="primary" /> Data Presensi
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Audit log kehadiran pegawai ITNET secara real-time.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<ExportIcon />}
          sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700 }}
        >
          Export Excel
        </Button>
      </Stack>

      {!mounted ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled">Menyiapkan laporan...</Typography>
        </Box>
      ) : (
        <>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <Stack direction="row" spacing={2}>
                    <TextField
                    id="filter-range-select"
                    select
                    label="Rentang Waktu"
                    size="small"
                    value={filter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    sx={{ minWidth: 200 }}
                    >
                    <MenuItem value="today">Hari Ini</MenuItem>
                    <MenuItem value="month">Laporan Bulanan</MenuItem>
                    <MenuItem value="custom">Pilih Tanggal</MenuItem>
                    </TextField>

                    <TextField
                    id="view-mode-select"
                    select
                    label="Tampilan"
                    size="small"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as any)}
                    sx={{ minWidth: 150 }}
                    >
                    {filter === 'month' && <MenuItem value="grid">Kotak Kalender</MenuItem>}
                    <MenuItem value="log">Log Detail</MenuItem>
                    <MenuItem value="summary">Rekap Performa</MenuItem>
                    </TextField>
                </Stack>

                {filter === 'custom' && (
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                    id="start-date-picker"
                    type="date"
                    size="small"
                    label="Dari"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    />
                    <Typography variant="body2" color="text.secondary">s/d</Typography>
                    <TextField
                    id="end-date-picker"
                    type="date"
                    size="small"
                    label="Sampai"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    />
                </Stack>
                )}
            </Stack>

            <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 800, px: 4, position: 'sticky', left: 0, zIndex: 10, bgcolor: '#fff', minWidth: 220 }}>PEGAWAI</TableCell>
                        {viewMode === 'log' && (
                            <>
                                <TableCell sx={{ fontWeight: 800 }}>WAKTU</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>TIPE</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>LOKASI / FOTO</TableCell>
                                <TableCell sx={{ fontWeight: 800, px: 4 }}>CATATAN</TableCell>
                            </>
                        )}
                        {viewMode === 'summary' && (
                            <>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>TEPAT WAKTU</TableCell>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>TERLAMBAT</TableCell>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>TOTAL MASUK</TableCell>
                                <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>PERSENTASE</TableCell>
                            </>
                        )}
                        {viewMode === 'grid' && getGridDays().map(day => (
                            <TableCell key={day.num} sx={{ textAlign: 'center', p: 1, minWidth: 80, bgcolor: day.isHoliday ? alpha(theme.palette.error.main, 0.03) : 'inherit' }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: day.isHoliday ? 'error.main' : 'text.secondary' }}>{day.name}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900, color: day.isHoliday ? 'error.main' : 'text.primary' }}>{day.num}</Typography>
                            </TableCell>
                        ))}
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {viewMode === 'grid' ? (
                        processGridData().map((emp: any) => (
                            <TableRow key={emp.id} hover>
                                <TableCell sx={{ px: 4, position: 'sticky', left: 0, zIndex: 5, bgcolor: '#fff', borderRight: '1px solid #f0f0f0' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}>{emp.name?.charAt(0)}</Avatar>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{emp.name}</Typography>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem' }} color="text.secondary">{emp.position}</Typography>
                                        </Box>
                                    </Stack>
                                </TableCell>
                                {getGridDays().map(day => {
                                    const data = emp.days[day.num];
                                    
                                    // 1. Holiday View
                                    if (day.isHoliday && !data?.in) {
                                        return (
                                            <TableCell key={day.num} align="center">
                                                <Chip label="LIBUR" size="small" variant="outlined" color="error" sx={{ fontSize: '0.6rem', height: 18, borderRadius: 1, fontWeight: 800, opacity: 0.5 }} />
                                            </TableCell>
                                        );
                                    }

                                    // 2. Leave View (Priority)
                                    if (data?.leave) {
                                        return (
                                            <TableCell key={day.num} align="center" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                                                <Chip 
                                                    label={data.leave.toUpperCase()} 
                                                    size="small" 
                                                    color={data.leave === 'sakit' ? 'warning' : 'info'} 
                                                    sx={{ fontSize: '0.6rem', height: 20, fontWeight: 900, borderRadius: 1.5 }} 
                                                />
                                            </TableCell>
                                        );
                                    }

                                    // 3. Empty / Absent View
                                    if (!data?.in) {
                                        if (data?.status === 'late') {
                                            return (
                                                <TableCell key={day.num} align="center" sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                                                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, fontSize: '0.6rem', color: 'error.main' }}>
                                                        TELAT
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', fontWeight: 700, color: 'error.main' }}>
                                                        (ABSEN)
                                                    </Typography>
                                                </TableCell>
                                            );
                                        }
                                        return <TableCell key={day.num} align="center"><Typography variant="caption" color="text.disabled">-</Typography></TableCell>;
                                    }

                                    // 4. Normal / Late Clock-in View
                                    return (
                                        <TableCell key={day.num} align="center" sx={{ bgcolor: data.status === 'late' ? alpha(theme.palette.error.main, 0.05) : (data.ovt_m > 0 || data.overtimePIC) ? alpha(theme.palette.success.main, 0.02) : 'inherit' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, fontSize: '0.65rem', color: data.status === 'late' ? 'error.main' : 'primary.main' }}>
                                                    {data.in || '--:--'}
                                                </Typography>
                                                {data.late_m > 0 && (
                                                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.55rem', fontWeight: 700, color: 'error.main', mt: -0.5 }}>
                                                        Telat {data.late_m}m
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, fontSize: '0.6rem', color: 'text.secondary', borderTop: '1px dashed #ddd', mt: 0.4, pt: 0.4 }}>
                                                    {data.out || '--:--'}
                                                </Typography>
                                                {(data.ovt_m > 0 || data.overtimePIC) && (
                                                    <Box sx={{ mt: 0.2 }}>
                                                        {data.ovt_m > 0 && <Typography variant="caption" sx={{ display: 'block', fontSize: '0.5rem', fontWeight: 700, color: 'success.main' }}>+{Math.floor(data.ovt_m/60)}j {data.ovt_m%60}m</Typography>}
                                                        {data.overtimePIC && <Typography variant="caption" sx={{ display: 'block', fontSize: '0.5rem', fontWeight: 900, color: 'success.dark', bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 0.5, px: 0.5 }}>Lembur PIC: {data.overtimePIC}m</Typography>}
                                                    </Box>
                                                )}
                                            </Box>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))
                    ) : (
                        history.map((log, index) => (
                            <TableRow key={log.id || `emp-${log.employee_id}-${index}`} hover>
                            <TableCell sx={{ px: 4 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}>{log.employee_name?.charAt(0)}</Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.employee_name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{log.position_name}</Typography>
                                </Box>
                                </Stack>
                            </TableCell>
                            
                            {viewMode === 'log' ? (
                                <>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {log.timestamp ? (
                                            <>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Typography>
                                                <Typography variant="caption" color="text.secondary">{new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Typography>
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.disabled">--:--</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {log.type ? (
                                            <Chip 
                                                label={log.type === 'clock_in' ? 'MASUK' : 'PULANG'} 
                                                size="small" 
                                                color={log.type === 'clock_in' ? 'primary' : 'secondary'}
                                                sx={{ fontWeight: 900, borderRadius: 1.5, fontSize: '0.65rem' }}
                                            />
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                        label={log.status ? log.status.toUpperCase().replace('_', ' ') : 'BELUM ABSEN'} 
                                        size="small" 
                                        variant="outlined"
                                        color={!log.status ? 'default' : (log.status === 'late' ? 'error' : 'success')}
                                        sx={{ 
                                            fontWeight: 900, 
                                            borderRadius: 1.5, 
                                            fontSize: '0.65rem',
                                            opacity: !log.status ? 0.5 : 1
                                        }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                        {log.location_lat && (
                                            <Tooltip title="Lihat Lokasi GPS">
                                            <IconButton size="small" color="primary"><LocationIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                        )}
                                        {log.photo_url && (
                                            <Tooltip title="Lihat Foto Selfi">
                                            <IconButton size="small" color="info"><PhotoIcon fontSize="small" /></IconButton>
                                            </Tooltip>
                                        )}
                                        {!log.location_lat && !log.photo_url && <Typography variant="caption" color="text.disabled">{log.id ? 'Manual / Web' : '-'}</Typography>}
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ px: 4, color: 'text.secondary', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {log.note || '-'}
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>{log.on_time_count || 0}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'error.main' }}>{log.late_count || 0}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.total_days || 0}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                                {log.total_days > 0 ? Math.round((log.on_time_count / log.total_days) * 100) : 0}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </>
                            )}
                            </TableRow>
                        ))
                    )}
                    {history.length === 0 && (
                        <TableRow>
                        <TableCell colSpan={ viewMode === 'grid' ? 32 : (viewMode === 'log' ? 6 : 5) } align="center" sx={{ py: 10 }}>
                            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>Belum ada data kehadiran pada periode ini.</Typography>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </TableContainer>
            </Card>
        </>
      )}
    </Box>
  );
}
