'use client';

import React, { useState, useEffect } from 'react';
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
  LinearProgress
} from "@mui/material";
import { 
  Handyman as MaintenanceIcon, 
  Schedule as ScheduleIcon, 
  CheckCircle as CheckIcon, 
  Warning as WarningIcon, 
  Add as AddIcon,
  Timeline as TimelineIcon
} from "@mui/icons-material";

export default function MaintenancePage() {
  const theme = useTheme();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/maintenance')
      .then(res => res.json())
      .then(data => {
        if (data.success) setJobs(Array.isArray(data.data) ? data.data : []);
      });
  }, []);

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
              sx={{ borderRadius: 3, fontWeight: 600 }}
            >
              Buat Job Order
            </Button>
          </Stack>

          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              { label: "Jobs Hari Ini", value: "24", icon: <TimelineIcon />, color: theme.palette.primary.main },
              { label: "Dalam Pengerjaan", value: "8", icon: <ScheduleIcon />, color: theme.palette.warning.main },
              { label: "Selesai", value: "16", icon: <CheckIcon />, color: theme.palette.success.main },
              { label: "Pending/Delayed", value: "2", icon: <WarningIcon />, color: theme.palette.error.main },
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

          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Daftar Tugas Lapangan
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f1f3f4' }}>
                  <TableRow>
                    <TableCell>Teknisi</TableCell>
                    <TableCell>Tipe Pekerjaan</TableCell>
                    <TableCell>Lokasi</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'rgba(0, 0, 0, 0.03)', color: 'primary.main', fontWeight: 800 }}>{job.technician_name.charAt(0)}</Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{job.technician_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{job.job_type}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{job.location}</TableCell>
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
                            bgcolor: alpha(job.status === 'Completed' ? theme.palette.success.main : job.status === 'In Progress' ? theme.palette.primary.main : theme.palette.text.secondary, 0.1),
                            color: job.status === 'Completed' ? 'success.main' : job.status === 'In Progress' ? 'primary.main' : 'text.secondary',
                            border: '1px solid'
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
  );
}
