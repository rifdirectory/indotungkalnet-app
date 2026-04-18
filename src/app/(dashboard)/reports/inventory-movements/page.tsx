'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, alpha, useTheme, Grid, Paper, 
  CircularProgress, IconButton, Chip, Tabs, Tab, FormControl, InputLabel, 
  Select, MenuItem 
} from "@mui/material";
import { 
  History as HistoryIcon,
  ArrowDownward as InIcon,
  ArrowUpward as OutIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon,
  CalendarMonth as MonthIcon,
  Person as PersonIcon,
  Description as NoteIcon
} from "@mui/icons-material";

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const years = [2024, 2025, 2026];

import Portal from '@/components/Portal';

export default function InventoryMovementsPage() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState({
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString()
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/inventory-movements?month=${period.month}&year=${period.year}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (err) {
            console.error('Error fetching movements:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period]);

    const handleTabChange = (_: any, newValue: number) => {
        setTabValue(newValue);
    };

    const movements = data?.movements || [];
    const incoming = movements.filter((m: any) => m.type === 'IN');
    const outgoing = movements.filter((m: any) => m.type === 'OUT' || m.type === 'ADJUST');

    if (loading && !data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 3, md: 5 } }}>
            <Portal>
                <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={period.month}
                            size="small"
                            onChange={(e) => setPeriod({ ...period, month: e.target.value })}
                            sx={{ borderRadius: 2, bgcolor: 'transparent', height: 32 }}
                        >
                            {months.map((m, i) => (
                                <MenuItem key={i} value={(i + 1).toString()}>{m}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                            value={period.year}
                            size="small"
                            onChange={(e) => setPeriod({ ...period, year: e.target.value })}
                            sx={{ borderRadius: 2, bgcolor: 'transparent', height: 32 }}
                        >
                            {years.map(y => (
                                <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<DownloadIcon />} sx={{ borderRadius: 2, fontWeight: 800, py: 0.5, height: 32 }} size="small">Export</Button>
                </Stack>
            </Portal>

            {/* Quick Stats */}
            {(() => {
                const formatTotal = (movementsArray: any[]) => {
                    if (movementsArray.length === 0) return "0 Unit";
                    
                    // Group and aggregate by Item ID to respect individual conversion factors
                    const aggregates: { [key: number]: { qty: number, unit: string, secondary: string, factor: number } } = {};
                    
                    movementsArray.forEach(m => {
                        if (!aggregates[m.item_id]) {
                            aggregates[m.item_id] = { 
                                qty: 0, 
                                unit: m.unit || 'Unit', 
                                secondary: m.secondary_unit, 
                                factor: Number(m.conversion_factor || 1) 
                            };
                        }
                        aggregates[m.item_id].qty += Number(m.quantity);
                    });

                    // Now group those aggregates by their "Unit Signature" (to combine FO 1 Core, FO 2 Core, etc.)
                    const unitGroups: { [key: string]: { totalQty: number, unit: string, secondary: string, factor: number } } = {};
                    
                    Object.values(aggregates).forEach(agg => {
                        const sig = `${agg.unit}-${agg.secondary}-${agg.factor}`;
                        if (!unitGroups[sig]) {
                            unitGroups[sig] = { ...agg, totalQty: 0 };
                        }
                        unitGroups[sig].totalQty += agg.qty;
                    });

                    // Generate a list of formatted strings
                    const results = Object.values(unitGroups).map(group => {
                        if (group.factor > 1 && group.secondary) {
                            const rolls = Math.floor(group.totalQty / group.factor);
                            const meters = Math.round(group.totalQty % group.factor);
                            if (rolls > 0) {
                                return `${rolls} ${group.secondary}${meters > 0 ? ` ${meters} ${group.unit}` : ''}`;
                            }
                            return `${group.totalQty} ${group.unit}`;
                        }
                        return `${group.totalQty} ${group.unit}`;
                    });

                    // Return as a nice list
                    return results.join(", ");
                };

                const calculateTotalItems = (arr: any[]) => {
                    const total = arr.reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);
                    return `${total} Item`;
                };

                return (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, borderRadius: 5, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1), bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <InIcon />
                                    </Box>
                                    <Box sx={{ overflow: 'hidden' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Barang Masuk</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.dark', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                            {calculateTotalItems(incoming)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, borderRadius: 5, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1), bgcolor: alpha(theme.palette.error.main, 0.02) }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'error.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <OutIcon />
                                    </Box>
                                    <Box sx={{ overflow: 'hidden' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Barang Keluar</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'error.dark', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                            {calculateTotalItems(outgoing)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper sx={{ p: 3, borderRadius: 5, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1), bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FilterIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Total Transaksi</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.dark' }}>
                                            {movements.length} Record
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                );
            })()}

            {/* Main Tabs */}
            <Card sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ px: 2 }}>
                        <Tab label="LIST BARANG MASUK" sx={{ fontWeight: 800, fontSize: '0.85rem', py: 2 }} />
                        <Tab label="LIST BARANG KELUAR" sx={{ fontWeight: 800, fontSize: '0.85rem', py: 2 }} />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 900 }}>TANGGAL & JAM</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>NAMA BARANG</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>JUMLAH</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>PETUGAS</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>REFERENSI / CATATAN</TableCell>
                                    {tabValue === 0 && <TableCell sx={{ fontWeight: 900 }}>NILAI MODAL</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(tabValue === 0 ? incoming : outgoing).map((row: any) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }}>
                                                {new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.item_name}</Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                              <Typography variant="caption" color="text.secondary">{row.item_code} • {row.category}</Typography>
                                              {row.sn && (
                                                <Chip 
                                                  label={`SN: ${row.sn}`} 
                                                  size="small" 
                                                  variant="outlined"
                                                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, color: 'primary.main', borderColor: 'primary.main' }} 
                                                />
                                              )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                              {row.conversion_factor > 1 && row.secondary_unit ? (() => {
                                                const factor = Number(row.conversion_factor);
                                                // If the log was recorded in secondary unit (e.g. 2 Roll)
                                                if (row.trx_unit === row.secondary_unit) {
                                                  return (
                                                    <Chip 
                                                      label={`${row.quantity} ${row.secondary_unit}`} 
                                                      size="small" 
                                                      color={row.type === 'IN' ? 'success' : 'error'}
                                                      sx={{ fontWeight: 900, borderRadius: 1.5 }}
                                                    />
                                                  );
                                                }
                                                // Otherwise it's in meters (e.g. 2000m), show split
                                                const rolls = Math.floor(row.quantity / factor);
                                                const meters = Math.round(row.quantity % factor);
                                                return (
                                                  <Stack spacing={0.5} alignItems="center">
                                                    <Chip 
                                                      label={rolls > 0 ? `${rolls} ${row.secondary_unit}${meters > 0 ? ` ${meters} ${row.unit}` : ''}` : `${row.quantity} ${row.unit}`} 
                                                      size="small" 
                                                      color={row.type === 'IN' ? 'success' : 'error'}
                                                      sx={{ fontWeight: 900, borderRadius: 1.5 }}
                                                    />
                                                    {rolls > 0 && <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>({row.quantity} {row.unit})</Typography>}
                                                  </Stack>
                                                );
                                              })() : (
                                                <Chip 
                                                  label={row.trx_unit ? `${row.quantity} ${row.trx_unit}` : `${row.quantity} ${row.unit || 'Unit'}`} 
                                                  size="small" 
                                                  color={row.type === 'IN' ? 'success' : 'error'}
                                                  sx={{ fontWeight: 900, borderRadius: 1.5 }}
                                                />
                                              )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <PersonIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.employee_name}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500, fontStyle: row.notes ? 'normal' : 'italic', color: row.notes ? 'text.primary' : 'text.disabled' }}>
                                                {row.notes || 'Tanpa catatan'}
                                            </Typography>
                                            {row.reference_id && (
                                                <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>Ref: {row.reference_id}</Typography>
                                            )}
                                        </TableCell>
                                        {tabValue === 0 && (
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {formatCurrency(row.quantity * row.sale_price)} 
                                                {/* Note: for IN we use sale_price as purchase cost if recorded in logs, 
                                                    but usually logs for IN store the price in sale_price or purchase_price. 
                                                    I'll adjust this based on the actual log structure. */}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                                {(tabValue === 0 ? incoming : outgoing).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                Belum ada data {tabValue === 0 ? 'barang masuk' : 'barang keluar'} di bulan ini.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Card>
        </Box>
    );
}
