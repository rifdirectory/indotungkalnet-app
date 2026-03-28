'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  Button, 
  Stack, 
  IconButton,
  alpha,
  useTheme,
  Chip
} from "@mui/material";
import { 
  People as PeopleIcon, 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Headphones as SupportIcon,
  ArrowForward as ArrowForwardIcon
} from "@mui/icons-material";
const stats = [
  { 
    label: "Total Customer", 
    value: "0", 
    change: "+0%", 
    trend: "up", 
    icon: <PeopleIcon />,
    color: "#3b82f6"
  },
  { 
    label: "Revenue (MTD)", 
    value: "Rp 0", 
    change: "+0%", 
    trend: "up", 
    icon: <MoneyIcon />,
    color: "#10b981"
  },
  { 
    label: "Active Tickets", 
    value: "0", 
    change: "0", 
    trend: "down", 
    icon: <SupportIcon />,
    color: "#f59e0b"
  },
  { 
    label: "Inventory Status", 
    value: "0%", 
    change: "Normal", 
    trend: "up", 
    icon: <InventoryIcon />,
    color: "#6366f1"
  },
];

export default function Dashboard() {
  const theme = useTheme();
  const [dashboardStats, setDashboardStats] = useState(stats);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, ticketRes] = await Promise.all([
          fetch('/api/dashboard-stats').then(r => r.json()),
          fetch('/api/support').then(r => r.json()),
        ]);

        if (statsRes.success) {
          const s = statsRes.data;
          const newStats = [...stats];
          newStats[0].value = s.totalCustomers.toLocaleString();
          newStats[1].value = `Rp ${(s.revenue / 1000000).toFixed(1)}M`;
          newStats[2].value = s.activeTickets.toString();
          newStats[3].value = `${s.inventoryStatus}%`;
          setDashboardStats(newStats);
        }

        if (ticketRes.success) {
          const tickets = Array.isArray(ticketRes.data) ? ticketRes.data : [];
          setRecentTickets(tickets.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Dashboard ITNET
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Selamat datang kembali di pusat kendali ISP.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {dashboardStats.map((stat: any, i: number) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.label}>
              <Card sx={{ 
                p: 3, 
                position: 'relative', 
                overflow: 'hidden',
                borderRadius: 3,
                '&:hover': { borderColor: '#bdc1c6' }
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 3, 
                    bgcolor: alpha(stat.color, 0.1), 
                    color: stat.color,
                    display: 'flex'
                  }}>
                    {stat.icon}
                  </Box>
                  <Chip 
                    label={stat.change}
                    size="small"
                    icon={stat.trend === "up" ? <TrendingUpIcon sx={{ fontSize: '14px !important' }} /> : <TrendingDownIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{ 
                      height: 24,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: alpha(stat.trend === "up" ? theme.palette.success.main : theme.palette.error.main, 0.1),
                      color: stat.trend === "up" ? 'success.main' : 'error.main',
                      border: 'none',
                      '& .MuiChip-icon': { color: 'inherit', ml: 0.5 }
                    }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{stat.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{stat.value}</Typography>
              </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 4, height: '100%', borderRadius: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SupportIcon color="primary" />
                Tiket Hari Ini
              </Typography>
              <Button 
                size="small" 
                sx={{ fontWeight: 600 }}
                component={Link}
                href="/support"
              >
                Lihat Semua
              </Button>
            </Stack>
            
            <Box sx={{ mt: 3 }}>
              {recentTickets.length === 0 ? (
                <Box sx={{ 
                  py: 8, 
                  textAlign: 'center', 
                  bgcolor: '#f1f3f4', 
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" color="text.secondary">Tidak ada tiket aktif</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {recentTickets.map((ticket) => (
                    <Box key={ticket.id} sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      bgcolor: '#f1f3f4', 
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Box sx={{ width: 4, height: 40, borderRadius: 3, bgcolor: ticket.priority === 'High' ? 'error.main' : 'warning.main' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{ticket.subject}</Typography>
                          <Typography variant="caption" color="text.secondary">{ticket.customer_name} • {ticket.created_time_str}</Typography>
                        </Box>
                      </Stack>
                      <Chip 
                        label={ticket.status} 
                        size="small" 
                        sx={{ 
                          height: 22, 
                          fontSize: '0.625rem', 
                          fontWeight: 800,
                          bgcolor: alpha(ticket.status === 'Open' ? theme.palette.warning.main : theme.palette.primary.main, 0.1),
                          color: ticket.status === 'Open' ? 'warning.main' : 'primary.main',
                          border: '1px solid'
                        }} 
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 4, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TrendingUpIcon sx={{ color: 'primary.main' }} />
              Billing Alerts
            </Typography>
            
            <Stack spacing={2}>
              {[
                { user: "Andi Permana", status: "Overdue", amount: "Rp 255.000", color: 'error.main' },
                { user: "Siti Rahma", status: "Expiring Today", amount: "Rp 350.000", color: 'warning.main' },
                { user: "Toko Berkah", status: "Auto-pay Scheduled", amount: "Rp 1.200.000", color: 'info.main' },
              ].map((bill, i) => (
                <Box key={i} sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  bgcolor: '#f1f3f4', 
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{bill.user}</Typography>
                    <Typography variant="caption" sx={{ color: bill.color, fontWeight: 600 }}>{bill.status}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{bill.amount}</Typography>
                </Box>
              ))}
            </Stack>
            
            <Button 
              fullWidth 
              sx={{ 
                mt: 3, 
                color: 'primary.main', 
                fontSize: '0.75rem', 
                fontWeight: 700,
                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
              }}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            >
              Lihat Semua Tagihan
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
