'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  alpha,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from "@mui/material";
import { 
  ArrowBack as BackIcon,
  InfoOutlined as InfoIcon,
  FilterList as FilterIcon,
  History as HistoryIcon,
  Security as SecurityIcon
} from "@mui/icons-material";
import Link from 'next/link';
import Portal from '@/components/Portal';

export default function AuditLogsPage() {
  const theme = useTheme();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit?limit=100');
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const getModuleIcon = (module: string) => {
    // Just a color for now
    switch (module) {
        case 'Finance': return theme.palette.success.main;
        case 'Inventory': return theme.palette.warning.main;
        case 'Customers': return theme.palette.primary.main;
        case 'Employees': return theme.palette.secondary.main;
        default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 40 }} /> Log Aktivitas Admin
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Rekaman histori aksi administratif di seluruh sistem (Audit Trail).
            </Typography>
        </Box>
        <Portal>
            <Button 
                variant="outlined" 
                startIcon={<HistoryIcon />} 
                onClick={fetchLogs}
                sx={{ borderRadius: 2, fontWeight: 700, py: 0.5 }}
                size="small"
            >
                Refresh Data
            </Button>
        </Portal>
      </Stack>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Waktu</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Modul</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Aksi</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Referensi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Detail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.user}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getModuleIcon(log.module) }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.module}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={log.action} 
                        size="small" 
                        color={getActionColor(log.action) as any}
                        variant="soft" 
                        sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                        {log.reference_id || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Lihat Detail Data">
                        <IconButton size="small" onClick={() => setSelectedLog(log)}>
                            <InfoIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && logs.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><Typography color="text.secondary">Belum ada aktivitas yang tercatat.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Detail Dialog */}
      <Dialog 
        open={Boolean(selectedLog)} 
        onClose={() => setSelectedLog(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Detail Aktivitas
            {selectedLog && (
                <Chip label={selectedLog.module} size="small" color="primary" />
            )}
        </DialogTitle>
        <DialogContent dividers>
            {selectedLog && (
                <Stack spacing={3} sx={{ py: 1 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>PELAKU AKSI</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>{selectedLog.user}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>WAKTU KEJADIAN</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                            {new Date(selectedLog.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'medium' })}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>DETAIL PERUBAHAN</Typography>
                        <Box sx={{ 
                            mt: 1, 
                            p: 2, 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.text.primary, 0.03),
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            whiteSpace: 'pre-wrap',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            {selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : 'Tidak ada data detail.'}
                        </Box>
                    </Box>
                </Stack>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setSelectedLog(null)} fullWidth variant="contained" sx={{ fontWeight: 800, py: 1.2, borderRadius: 2 }}>
                Tutup
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
