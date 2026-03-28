'use client';

import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  Grid, 
  alpha,
  useTheme,
  LinearProgress
} from "@mui/material";
import { 
  BarChart as BarChartIcon, 
  TrendingUp as TrendingUpIcon, 
  AccountBalance as FinanceIcon, 
  Group as PeopleIcon,
  Timeline as TimelineIcon,
  Inventory as InventoryIcon,
  TrendingDown as TrendingDownIcon
} from "@mui/icons-material";

export default function AnalyticsPage() {
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
                ERP & Business Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Wawasan bisnis mendalam untuk pertumbuhan PT. Indo Tungkal Net.
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              sx={{ borderRadius: 3, fontWeight: 700 }}
            >
              Export Report Lengkap
            </Button>
          </Stack>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ p: 4, height: '100%', bgcolor: '#f1f3f4' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 4, letterSpacing: '0.05em' }}>Pencapaian Revenue</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>Rp 1.5M+</Typography>
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 700, mb: 4, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUpIcon fontSize="small" /> +24% Year over Year
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Target Bulanan (Rp 200M)</Typography>
                      <Typography variant="caption" color="text.secondary">82% Achieved</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={82} sx={{ height: 8, borderRadius: 3 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Customer Retention</Typography>
                      <Typography variant="caption" color="text.secondary">96.5%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={96.5} color="success" sx={{ height: 8, borderRadius: 3 }} />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <Grid container spacing={3}>
                {[
                  { label: "ARPU (Average Revenue Per User)", value: "Rp 185.000", change: "+5%", icon: <TimelineIcon /> },
                  { label: "Churn Rate", value: "1.2%", change: "-0.5%", icon: <TrendingDownIcon /> },
                  { label: "Operating Margin", value: "42%", change: "+2%", icon: <FinanceIcon /> },
                  { label: "Total Asset Value", value: "Rp 4.2B", change: "+12%", icon: <InventoryIcon /> },
                ].map((stat, i) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={i}>
                    <Card sx={{ p: 3, display: 'flex', justifyContent: 'space-between', bgcolor: '#ffffff' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{stat.value}</Typography>
                        <Typography variant="caption" color={stat.change.startsWith('+') ? 'success.main' : 'error.main'} sx={{ fontWeight: 700 }}>{stat.change} vs Last Month</Typography>
                      </Box>
                      <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#f1f3f4', color: 'text.secondary', height: 'fit-content' }}>
                        {stat.icon}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Card sx={{ p: 4, mt: 3, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <BarChartIcon sx={{ fontSize: 48, color: 'divider', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">Monthly Revenue Growth Chart Placeholder</Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
    </Box>
  );
}
