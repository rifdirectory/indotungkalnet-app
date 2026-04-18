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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { 
  TrendingUp as GrowthIcon,
  TrendingDown as ChurnIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  History as HistoryIcon,
  Warning as WarningIcon
} from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

export default function ChurnReportPage() {
  const theme = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const fetchChurnData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/churn?year=${year}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChurnData();
  }, [year]);

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const COLORS = [theme.palette.primary.main, theme.palette.error.main, theme.palette.warning.main, theme.palette.success.main];

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 4 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tahun</InputLabel>
            <Select value={year} label="Tahun" onChange={(e) => setYear(e.target.value)}>
                <MenuItem value="2026">2026</MenuItem>
                <MenuItem value="2025">2025</MenuItem>
            </Select>
        </FormControl>
      </Stack>

      {/* Top Level KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 800 }}>TOTAL PELANGGAN BARU ({year})</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                        {data.movement.reduce((acc: number, m: any) => acc + m.new_customers, 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Subscriber yang baru bergabung tahun ini.</Typography>
                </Stack>
            </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.error.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1) }}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 800 }}>TOTAL CHURN/SUSPENDED ({year})</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                        {data.movement.reduce((acc: number, m: any) => acc + m.suspended_customers, 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Kehilangan subscriber (berpotensi menguapnya pendapatan).</Typography>
                </Stack>
            </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 800 }}>NET GROWTH ({year})</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                        {data.movement.reduce((acc: number, m: any) => acc + m.new_customers, 0) - data.movement.reduce((acc: number, m: any) => acc + m.suspended_customers, 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Pertumbuhan bersih subscriber setelah dipotong churn.</Typography>
                </Stack>
            </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Growth vs Churn Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ p: 4, borderRadius: 5, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 4, fontWeight: 800 }}>Trend Pergerakan Subscriber</Typography>
                <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.movement}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickFormatter={(m) => ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m-1]} />
                            <YAxis />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            />
                            <Legend />
                            <Bar name="Baru" dataKey="new_customers" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                            <Bar name="Berhenti/Suspend" dataKey="suspended_customers" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Card>
        </Grid>

        {/* Churn Reasons Pie */}
        <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ p: 4, borderRadius: 5, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 4, fontWeight: 800 }}>Faktor Utama Churn</Typography>
                <Box sx={{ height: 300 }}>
                    {data.reasons.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.reasons}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                >
                                    {data.reasons.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                            <WarningIcon color="disabled" sx={{ fontSize: 40 }} />
                            <Typography color="text.disabled">Data alasan belum tersedia.</Typography>
                        </Box>
                    )}
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Tip: Memahami "Kenapa" mereka berhenti adalah langkah pertama meningkatkan pendapatan.
                    </Typography>
                </Box>
            </Card>
        </Grid>

        {/* Actionable Strategy Section */}
        <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 4, borderRadius: 5, bgcolor: alpha(theme.palette.warning.main, 0.02), border: '1px dashed', borderColor: theme.palette.warning.main }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'warning.dark' }}>Strategi Penanggulangan Churn</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Berdasarkan data saat ini, fokus utama Anda adalah **Reaktivasi Subscriber Suspended**. 
                            Mengaktifkan kembali 10% dari pelanggan suspended lebih murah daripada mencari 50 pelanggan baru.
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: 'right' } }}>
                        <Button 
                            variant="contained" 
                            color="warning" 
                            startIcon={<HistoryIcon />}
                            sx={{ borderRadius: 2, fontWeight: 800 }}
                        >
                            Jadwalkan Re-Engagement WA
                        </Button>
                    </Grid>
                </Grid>
            </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
