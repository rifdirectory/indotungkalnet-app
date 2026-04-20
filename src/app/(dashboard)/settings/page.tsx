'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Grid, TextField, 
  InputAdornment, Divider, Alert, Snackbar, CircularProgress, alpha,
  ToggleButton, ToggleButtonGroup,
  useTheme
} from "@mui/material";
import { 
  Settings as SettingsIcon, 
  LocationOn as LocationIcon, 
  Save as SaveIcon,
  Map as MapIcon,
  Refresh as RefreshIcon,
  NotificationsActive as NotifIcon,
  Security as SecurityIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import Link from 'next/link';
import { safeFetch } from '@/lib/fetchUtils';

export default function SettingsPage() {
  const theme = useTheme();
  const [settings, setSettings] = useState({
    office_latitude: '',
    office_longitude: '',
    office_radius: '100',
    wa_gateway_url: 'https://api.fonnte.com/send',
    wa_api_token: '',
    wa_notification_enabled: '0',
    wa_gateway_mode: 'cloud'
  });
  const [waStatus, setWaStatus] = useState<{ status: string, qr: string }>({ status: 'OFFLINE', qr: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: 'success', text: '', open: false });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { success, data } = await safeFetch('/api/settings');
      if (success && data?.data) {
        setSettings({
          office_latitude: data.data.office_latitude || '',
          office_longitude: data.data.office_longitude || '',
          office_radius: data.data.office_radius || '100',
          wa_gateway_url: data.data.wa_gateway_url || 'https://api.fonnte.com/send',
          wa_api_token: data.data.wa_api_token || '',
          wa_notification_enabled: data.data.wa_notification_enabled || '0',
          wa_gateway_mode: data.data.wa_gateway_mode || 'cloud'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    let interval: any;
    if (settings.wa_gateway_mode === 'local') {
      const checkStatus = async () => {
        const { success, data } = await safeFetch('http://localhost:8080/status', { silent: true });
        if (success && data) {
          setWaStatus(data);
        } else {
          setWaStatus({ status: 'OFFLINE', qr: '' });
        }
      };
      checkStatus();
      interval = setInterval(checkStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [settings.wa_gateway_mode]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { success, message: errMessage } = await safeFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (success) {
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!', open: true });
      } else {
        throw new Error(errMessage || 'Gagal menyimpan');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message, open: true });
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setSettings(prev => ({
          ...prev,
          office_latitude: position.coords.latitude.toString(),
          office_longitude: position.coords.longitude.toString()
        }));
        setMessage({ type: 'success', text: 'Lokasi saat ini berhasil diambil!', open: true });
      });
    } else {
      setMessage({ type: 'error', text: 'Geolocation tidak didukung oleh browser ini.', open: true });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, pt: 2 }}>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocationIcon color="primary" /> Lokasi Kantor Pusat
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Tentukan koordinat GPS kantor pusat PT. Indo Tungkal Net. Koordinat ini akan digunakan sebagai patokan Geofencing aplikasi mobile (hanya bisa absen jika berada dalam jangkauan kantor).
            </Typography>

            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={settings.office_latitude}
                    onChange={(e) => setSettings({ ...settings, office_latitude: e.target.value })}
                    placeholder="-6.175392"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><MapIcon sx={{ fontSize: 20, color: 'text.disabled' }} /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={settings.office_longitude}
                    onChange={(e) => setSettings({ ...settings, office_longitude: e.target.value })}
                    placeholder="106.827153"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><MapIcon sx={{ fontSize: 20, color: 'text.disabled' }} /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Radius Absensi (Geofence)"
                value={settings.office_radius}
                onChange={(e) => setSettings({ ...settings, office_radius: e.target.value })}
                type="number"
                helperText="Jarak maksimal pegawai dari titik koordinat (dalam Meter)"
                InputProps={{
                  endAdornment: <InputAdornment position="end">Meter</InputAdornment>,
                }}
              />

              <Box sx={{ pt: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  onClick={getCurrentLocation}
                  sx={{ borderRadius: 2, mr: 2 }}
                >
                  Gunakan Lokasi Saya Saat Ini
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ borderRadius: 2, px: 4, py: 1.2, fontWeight: 700 }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <NotifIcon color="primary" /> Konfigurasi WhatsApp
              </Typography>
              <ToggleButtonGroup
                color="primary"
                value={settings.wa_gateway_mode}
                exclusive
                onChange={(_, val) => val && setSettings({ 
                  ...settings, 
                  wa_gateway_mode: val,
                  wa_gateway_url: val === 'local' ? 'http://localhost:8080/send' : settings.wa_gateway_url
                })}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                <ToggleButton value="cloud" sx={{ px: 2, fontWeight: 700 }}>CLOUD (FONNTE)</ToggleButton>
                <ToggleButton value="local" sx={{ px: 2, fontWeight: 700 }}>LOCAL GATEWAY</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {settings.wa_gateway_mode === 'cloud' 
                ? 'Gunakan layanan pihak ketiga (Fonnte) untuk mengirim pesan. Membutuhkan paket berlangganan.' 
                : 'Gunakan engine WhatsApp lokal yang berjalan di server Bapak. Gratis dan lebih privat.'}
            </Typography>

            <Stack spacing={3}>
              {settings.wa_gateway_mode === 'local' && (
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  bgcolor: alpha('#f8fafc', 0.5), 
                  border: '1px solid', 
                  borderColor: 'divider',
                  textAlign: 'center'
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                    Status Gateway Lokal: 
                    <Box component="span" sx={{ ml: 1, color: waStatus.status === 'READY' ? 'success.main' : 'warning.main' }}>
                      {waStatus.status}
                    </Box>
                  </Typography>

                  {waStatus.status === 'OFFLINE' && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                      Gateway Lokal tidak terdeteksi. Silahkan jalankan <code>npm run wa-gateway</code> di server.
                    </Alert>
                  )}

                  {waStatus.status === 'QR_REQUIRED' && (
                    <Box sx={{ mb: 2 }}>
                      {waStatus.qr ? (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Silahkan scan QR Code ini dengan WhatsApp Bapak:
                          </Typography>
                          <Box 
                            component="img" 
                            src={waStatus.qr} 
                            sx={{ 
                              width: 240, 
                              height: 240, 
                              mx: 'auto', 
                              display: 'block', 
                              borderRadius: 2,
                              border: '4px solid #fff',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }} 
                          />
                        </>
                      ) : (
                        <Box sx={{ py: 4 }}>
                          <CircularProgress size={40} sx={{ mb: 2 }} />
                          <Typography variant="body2" color="text.secondary">
                            Sedang menyiapkan QR Code baru... <br/>
                            Harap tunggu sebentar.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {waStatus.status === 'READY' && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                      WhatsApp Terhubung! Sistem siap mengirim notifikasi.
                    </Alert>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button 
                        size="small" 
                        variant="outlined" 
                        color="error" 
                        startIcon={<RefreshIcon />}
                        onClick={async () => {
                            if(confirm('Keluarkan sesi WhatsApp saat ini dan scan ulang QR?')) {
                                const { success } = await safeFetch('http://localhost:8080/reset', { method: 'POST', silent: true });
                                if (success) {
                                    setMessage({ type: 'success', text: 'Reset berhasil. Silahkan tunggu QR Code baru.', open: true });
                                } else {
                                    setMessage({ type: 'error', text: 'Gagal reset gateway.', open: true });
                                }
                            }
                        }}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        Reset & Hubungkan Ulang (Rescan QR)
                    </Button>
                  </Box>
                </Box>
              )}

              <TextField
                fullWidth
                label="WhatsApp Gateway URL"
                value={settings.wa_gateway_url}
                onChange={(e) => setSettings({ ...settings, wa_gateway_url: e.target.value })}
                placeholder={settings.wa_gateway_mode === 'local' ? 'http://localhost:8080/send' : 'https://api.fonnte.com/send'}
                helperText="URL API Endpoint pengiriman pesan"
              />

              {settings.wa_gateway_mode === 'cloud' && (
                <TextField
                  fullWidth
                  label="WhatsApp API Token"
                  type="password"
                  value={settings.wa_api_token}
                  onChange={(e) => setSettings({ ...settings, wa_api_token: e.target.value })}
                  placeholder="Masukkan Token API WA"
                  helperText="Token otorisasi dari penyedia gateway (Fonnte/Woowa)"
                />
              )}

              <Box sx={{ 
                p: 2, 
                borderRadius: 3, 
                bgcolor: settings.wa_notification_enabled === '1' ? alpha('#16a34a', 0.05) : alpha('#f43f5e', 0.05),
                border: '1px solid',
                borderColor: settings.wa_notification_enabled === '1' ? alpha('#16a34a', 0.1) : alpha('#f43f5e', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: settings.wa_notification_enabled === '1' ? '#16a34a' : '#f43f5e' }}>
                    Status Notifikasi WA: {settings.wa_notification_enabled === '1' ? 'AKTIF' : 'NON-AKTIF'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Jika aktif, sistem akan mengirimkan WA otomatis untuk tiket & permohonan.
                  </Typography>
                </Box>
                <Button 
                  size="small"
                  variant="outlined" 
                  color={settings.wa_notification_enabled === '1' ? 'error' : 'success'}
                  onClick={() => setSettings({ ...settings, wa_notification_enabled: settings.wa_notification_enabled === '1' ? '0' : '1' })}
                  sx={{ borderRadius: 2 }}
                >
                  {settings.wa_notification_enabled === '1' ? 'Matikan' : 'Aktifkan'}
                </Button>
              </Box>

              <Box sx={{ pt: 1 }}>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ borderRadius: 2, px: 4, py: 1.2, fontWeight: 700 }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan WA'}
                </Button>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={4}>
            <Card sx={{ 
              p: 4, 
              borderRadius: 4, 
              bgcolor: alpha(theme.palette.primary.main, 0.05), 
              border: '1px solid', 
              borderColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SecurityIcon color="primary" /> Hak Akses Menu
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Kelola menu apa saja yang bisa diakses oleh user/staf di aplikasi Web Dashboard maupun Aplikasi Mobile.
                </Typography>
              </Box>
              <Button 
                component={Link} 
                href="/settings/permissions" 
                variant="contained" 
                fullWidth
                sx={{ borderRadius: 2, py: 1.5, fontWeight: 800, textTransform: 'none' }}
              >
                Atur Hak Akses Menu
              </Button>
            </Card>

            <Card sx={{ 
              p: 4, 
              borderRadius: 4, 
              bgcolor: alpha('#64748b', 0.05), 
              border: '1px solid', 
              borderColor: alpha('#64748b', 0.1),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SettingsIcon color="inherit" sx={{ color: '#64748b' }} /> Audit Logs
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Pantau riwayat aktivitas administratif, transaksi, dan perubahan data di seluruh sistem untuk akuntabilitas staf.
                </Typography>
              </Box>
              <Button 
                component={Link} 
                href="/settings/audit-logs" 
                variant="outlined" 
                fullWidth
                sx={{ borderRadius: 2, py: 1.5, fontWeight: 800, textTransform: 'none', color: '#64748b', borderColor: '#64748b' }}
              >
                Buka Log Aktivitas
              </Button>
            </Card>

            <Card sx={{ p: 4, borderRadius: 4, bgcolor: alpha('#0a84ff', 0.03), border: '1px dashed', borderColor: alpha('#0a84ff', 0.2) }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Penyimpanan Foto</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sistem saat ini dikonfigurasi untuk menyimpan foto absensi di **Server Lokal**. 
              </Typography>
              <Alert icon={false} severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>INFORMASI:</Typography>
                <Typography variant="caption">
                  Foto akan disimpan di direktori: <br/>
                  <code>/public/uploads/presence</code> <br/>
                </Typography>
              </Alert>
            </Card>

            <Card sx={{ p: 4, borderRadius: 4, bgcolor: alpha('#f97316', 0.03), border: '1px dashed', borderColor: alpha('#f97316', 0.2) }}>
               <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Catatan WA</Typography>
               <Typography variant="caption" color="text.secondary">
                  Gunakan variabel berikut pesan otomatis: <br/>
                  - <code>[customer]</code> Nama Pelanggan <br/>
                  - <code>[ticket]</code> Nomor Tiket <br/>
                  - <code>[status]</code> Status Penugasan
               </Typography>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar 
        open={message.open} 
        autoHideDuration={4000} 
        onClose={() => setMessage({ ...message, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={message.type as any} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}
