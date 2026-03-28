'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Button, Card, Grid, TextField, 
  InputAdornment, Divider, Alert, Snackbar, CircularProgress, alpha
} from "@mui/material";
import { 
  Settings as SettingsIcon, 
  LocationOn as LocationIcon, 
  Save as SaveIcon,
  Map as MapIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    office_latitude: '',
    office_longitude: '',
    office_radius: '100'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: 'success', text: '', open: false });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings({
          office_latitude: data.data.office_latitude || '',
          office_longitude: data.data.office_longitude || '',
          office_radius: data.data.office_radius || '100'
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!', open: true });
      } else {
        throw new Error(data.message);
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
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon color="primary" /> Pengaturan Sistem
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Kelola konfigurasi dasar aplikasi dan parameter absensi.
          </Typography>
        </Box>
      </Stack>

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

        <Grid size={{ xs: 12, md: 5 }}>
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
                Pastikan server memiliki ruang penyimpanan yang cukup.
              </Typography>
            </Alert>
          </Card>
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
