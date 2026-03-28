'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, IconButton, 
  Tooltip, Divider, Chip, MenuItem, Avatar
} from "@mui/material";
import { 
  EventNote as EventNoteIcon, 
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon
} from "@mui/icons-material";

// --- Utility Functions (Timezone Safe) ---
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return formatDate(d);
};

const getEndOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return formatDate(d);
};

const getMonthDays = (date: Date) => {
  const days = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  
  for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i));
  }
  return days;
};

export default function SchedulePageContent() {
  const theme = useTheme();
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]); 
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [selectedCell, setSelectedCell] = useState<{ employeeId: number, date: string } | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<number | ''>('');

  const fetchData = async () => {
    const year = currentDate.getFullYear();
    const start = getStartOfMonth(currentDate);
    const end = getEndOfMonth(currentDate);
    
    try {
        const [empRes, shiftRes, schedRes, holidayRes] = await Promise.all([
          fetch('/api/employees').then(res => res.json()),
          fetch('/api/presence/shifts').then(res => res.json()),
          fetch(`/api/presence/schedule?start=${start}&end=${end}`).then(res => res.json()),
          fetch(`https://dayoffapi.vercel.app/api?year=${year}`).then(res => res.json()).catch(() => ({ success: false }))
        ]);

        if(empRes.success) setEmployees(Array.isArray(empRes.data) ? empRes.data.filter((e: any) => e.use_presence === 1) : []);
        if(shiftRes.success) setShifts(Array.isArray(shiftRes.data) ? shiftRes.data : []);
        if(schedRes.success) setSchedules(Array.isArray(schedRes.data) ? schedRes.data : []);
        if(holidayRes.success) setHolidays(Array.isArray(holidayRes.data) ? holidayRes.data : []);
    } catch (e) {
        console.error("Fetch error:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const normalDayShift = shifts.find(s => s.name === 'Normal Day');

  const handleCellClick = (employeeId: number, date: Date) => {
    const dateStr = formatDate(date);
    const existing = schedules.find(s => {
        const sDate = formatDate(new Date(s.date));
        return s.employee_id === employeeId && sDate === dateStr;
    });
    
    setSelectedCell({ employeeId, date: dateStr });
    
    if (existing) {
        setSelectedShiftId(existing.shift_id);
    } else if (normalDayShift) {
        setSelectedShiftId(normalDayShift.id);
    } else {
        setSelectedShiftId('');
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCell) return;
    
    const res = await fetch('/api/presence/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: selectedCell.employeeId,
        shift_id: selectedShiftId || null,
        date: selectedCell.date
      })
    });

    if (res.ok) {
      setOpen(false);
      fetchData();
    }
  };

  const monthDays = getMonthDays(currentDate);

  const getShiftInCell = (employee: any, date: Date) => {
    const employeeId = employee.id;
    const isNOC = employee.position_name?.toLowerCase().includes('noc');
    const dateStr = formatDate(date);
    
    // 1. Explicit Database Shift (Highest Priority)
    const explicitShift = schedules.find(s => {
      const sDate = formatDate(new Date(s.date));
      return s.employee_id === employeeId && sDate === dateStr;
    });
    if (explicitShift) return explicitShift;

    // 2. NOC Rule: Fallback to FULL if not scheduled
    if (isNOC) {
      return {
        id: 'full_noc',
        shift_name: 'FULL',
        full_name: 'NOC FULL TIME',
        color: '#7c4dff', // Purple-ish for NOC Full
        isDefault: true
      };
    }

    // 3. Saturday Rule for Ria Puspitasari and Nurani
    const day = date.getDay();
    const isSaturday = day === 6;
    const isTargetEmployee = ['ria puspitasari', 'nurani', 'nurani mila utami'].includes(employee.full_name?.toLowerCase());

    if (isSaturday && isTargetEmployee) {
      return {
        id: 'sabtu_ceria',
        shift_name: 'SABTU CERIA',
        full_name: 'SABTU CERIA',
        color: '#ff9100', // Orange
        isDefault: true
      };
    }

    // 4. Sunday/Holiday Rule
    const isSunday = day === 0;
    const holiday = holidays.find(h => h.date === dateStr);
    const isHoliday = !!holiday;

    if (isSunday || isHoliday) {
      return {
        id: 'libur_default',
        shift_name: isHoliday ? holiday.name.split(' ')[0].toUpperCase() : 'LIBUR',
        full_name: isHoliday ? holiday.name : 'LIBUR HARI MINGGU',
        color: '#f43f5e', // Red
        isDefault: true
      };
    }

    // 5. Default Normal Shift
    const normalDayShift = shifts.find(s => s.shift_name?.toLowerCase().includes('normal') || s.id === 1);
    return {
      ...(normalDayShift || { shift_name: 'NORMAL', color: '#10b981' }),
      id: 'default_normal',
      isDefault: true,
      shift_name: 'NORMAL',
      color: '#10b981'
    };
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventNoteIcon color="primary" /> Jadwal Shift
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Klik pada kotak untuk menentukan jadwal shift pegawai bulanan.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() - 1);
            setCurrentDate(d);
          }}><PrevIcon /></IconButton>
          <Typography sx={{ fontWeight: 800, minWidth: 150, textAlign: 'center', textTransform: 'capitalize' }}>
            {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </Typography>
          <IconButton onClick={() => {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() + 1);
            setCurrentDate(d);
          }}><NextIcon /></IconButton>
          <Button variant="outlined" sx={{ borderRadius: 3, fontWeight: 700 }} onClick={() => setCurrentDate(new Date())}>Hari Ini</Button>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
        <TableContainer sx={{ maxHeight: '70vh' }}>
          <Table sx={{ minWidth: 1500, tableLayout: 'fixed' }}>
            <TableHead sx={{ bgcolor: '#f8f9fa', position: 'sticky', top: 0, zIndex: 20, borderBottom: '2px solid', borderColor: 'divider' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 220, position: 'sticky', left: 0, bgcolor: '#ffffff', zIndex: 30, borderRight: '1px solid', borderColor: 'divider' }}>PEGAWAI</TableCell>
                {monthDays.map(d => {
                  const dateStr = formatDate(d);
                  const isSunday = d.getDay() === 0;
                  const isHoliday = holidays.some(h => h.date === dateStr);
                  const isRed = isSunday || isHoliday;
                  
                  return (
                    <TableCell key={dateStr} align="center" sx={{ fontWeight: 800, width: 70, p: 1, bgcolor: isRed ? alpha(theme.palette.error.main, 0.02) : 'transparent' }}>
                      <Typography variant="caption" color={isRed ? 'error.main' : 'text.secondary'} sx={{ fontWeight: 900, fontSize: '0.65rem' }}>
                        {d.toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: isRed ? 'error.main' : 'text.primary' }}>{d.getDate()}</Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: '#ffffff', zIndex: 10, borderRight: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>{emp.full_name.charAt(0)}</Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{emp.full_name}</Typography>
                    </Stack>
                  </TableCell>
                  {monthDays.map(d => {
                    const shift = getShiftInCell(emp, d);
                    const dateStr = formatDate(d);
                    const isSunday = d.getDay() === 0;
                    const isHoliday = holidays.some(h => h.date === dateStr);
                    const isRed = isSunday || isHoliday;
                    
                    return (
                      <TableCell 
                        key={dateStr} 
                        align="center"
                        onClick={() => handleCellClick(emp.id, d)}
                        sx={{ 
                          cursor: 'pointer', 
                          height: 70,
                          width: 70,
                          transition: 'all 0.2s',
                          bgcolor: isRed ? alpha(theme.palette.error.main, 0.01) : 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                          verticalAlign: 'middle',
                          p: 0.5,
                          borderRight: '1px solid rgba(0,0,0,0.02)'
                        }}
                      >
                        {shift ? (
                          <Chip 
                            label={shift.shift_name === 'Normal Day' ? 'Normal' : shift.shift_name} 
                            sx={{ 
                              bgcolor: alpha(shift.color || '#0a84ff', 0.1), 
                              color: shift.color ? alpha(shift.color, 1) : '#0a84ff', 
                              fontWeight: 800,
                              borderRadius: 1,
                              width: '100%',
                              height: 24,
                              fontSize: '0.65rem',
                              border: '1px solid',
                              borderColor: alpha(shift.color || '#0a84ff', 0.3),
                              filter: 'brightness(0.8)',
                              '& .MuiChip-label': { px: 0.5, textTransform: 'uppercase' }
                            }} 
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 800 }}>-</Typography>
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

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 4, minWidth: 350 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Tentukan Shift</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Pilih shift untuk {employees.find(e => e.id === selectedCell?.employeeId)?.full_name} pada tanggal {selectedCell?.date}.
            </Typography>
            <TextField
              select
              label="Shift"
              fullWidth
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value as any as number)}
              placeholder="Pilih Shift"
            >
              <MenuItem value=""><em>Libur / Tidak Ada Shift</em></MenuItem>
              {shifts.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.start_time.substring(0,5)} - {s.end_time.substring(0,5)})</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Batal</Button>
          <Button onClick={handleSave} variant="contained" sx={{ px: 4, borderRadius: 2 }}>Simpan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
