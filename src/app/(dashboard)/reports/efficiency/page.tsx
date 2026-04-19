'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Grid, 
  Card, 
  alpha, 
  useTheme,
  CircularProgress,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip
} from "@mui/material";
import { 
  LocalGasStation as FuelIcon,
  Construction as MaterialIcon,
  Timer as TimeIcon,
  Warning as WarningIcon,
  Person as StaffIcon,
  AttachMoney as MoneyIcon,
  Assignment as TicketIcon
} from "@mui/icons-material";
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import Portal from '@/components/Portal';

export default function EfficiencyReportPage() {
  const theme = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchEfficiencyData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/efficiency?start=${startDate}&end=${endDate}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEfficiencyData();
  }, [startDate, endDate]);

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const COLORS = [theme.palette.primary.main, theme.palette.info.main, theme.palette.warning.main, theme.palette.error.main];

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Portal container={typeof document !== 'undefined' ? document.getElementById('header-actions-portal') : null}>
        <Stack direction="row" spacing={2}>
            <TextField 
                type="date" 
                size="small" 
                label="Mulai" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputBase-root': { height: 32 } }}
            />
            <TextField 
                type="date" 
                size="small" 
                label="Selesai" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputBase-root': { height: 32 } }}
            />
        </Stack>
      </Portal>

      {/* Efficiency KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
                <Typography variant="caption" color="info.main" sx={{ fontWeight: 800 }}>TOTAL TIKET</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>{data.summary?.total_tickets || 0}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TicketIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">Tiket dalam periode ini</Typography>
                </Box>
            </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.warning.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.1) }}>
                <Typography variant="caption" color="warning.main" sx={{ fontWeight: 800 }}>RATA-RATA BIAYA / TIKET</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(data.summary?.avg_cost_per_ticket) || 0)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FuelIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">Bensin + Material + Lainnya</Typography>
                </Box>
            </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.error.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1) }}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 800 }}>TOTAL PENGELUARAN LAPANGAN</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format((Number(data.summary?.total_fuel) || 0) + (Number(data.summary?.total_material) || 0) + (Number(data.summary?.total_other) || 0))}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MoneyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">Total investasi operasional</Typography>
                </Box>
            </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 800 }}>RESOLVED TIKET</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, my: 1 }}>{data.summary?.resolved_tickets || 0}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">Tingkat keberhasilan perbaikan</Typography>
                </Box>
            </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Repetitive Maintenance Audit */}
        <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <WarningIcon color="error" />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>Audit Kerusakan Berulang (High OpEx)</Typography>
                        <Typography variant="caption" color="text.secondary">Pelanggan yang membutuhkan kunjungan lebih dari 1 kali (Biaya Operasional Boros).</Typography>
                    </Box>
                </Stack>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Pelanggan</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>Jumlah Tiket</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Total Biaya Lapangan</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Tindakan</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.repetitive.map((row: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell>{row.customer_name}</TableCell>
                                    <TableCell align="center">
                                        <Chip label={`${row.ticket_count}x`} size="small" color="error" variant="outlined" />
                                    </TableCell>
                                    <TableCell align="right">
                                        {new Intl.NumberFormat('id-ID').format(row.total_cost)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button size="tiny" variant="text" sx={{ textTransform: 'none', fontWeight: 800 }}>Saran: Ganti Alat</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.repetitive.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled' }}>Tidak ada kerusakan berulang dalam periode ini.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Grid>

        {/* Staff Field ROI */}
        <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Produktivitas & Pengeluaran Teknisi</Typography>
                <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.staff} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="technician" type="category" width={100} tick={{ fontSize: 11, fontWeight: 700 }} />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                formatter={(value: any, name: string) => {
                                    if (name === 'Total Biaya') return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
                                    return value;
                                }}
                            />
                            <Bar name="Tiket Selesai" dataKey="assigned_tickets" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} barSize={15} />
                            <Bar name="Total Biaya" dataKey="total_job_costs" fill={theme.palette.error.main} radius={[0, 4, 4, 0]} barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Tip: Gunakan data ini untuk mengevaluasi teknisi mana yang paling efisien dalam mengelola anggaran lapangan.
                    </Typography>
                </Box>
            </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
