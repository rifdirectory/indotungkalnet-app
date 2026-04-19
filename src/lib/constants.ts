export const FINANCE_CONFIG = {
  BANK_ADMIN_FEE_CATEGORY_ID: 31,
  // Future configurations can go here
};

export const AUTH_CONFIG = {
  SESSION_COOKIE_NAME: 'session',
  EXPIRATION_TIME: '24h',
};

export const UI_CONFIG = {
  CURRENCY: 'IDR',
  LOCALE: 'id-ID',
};

// Menu Keys for Role-Based Access Control
export const STANDARD_MENUS = {
  web: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'customers', label: 'Data Customer' },
    { key: 'products', label: 'Data Produk' },
    { key: 'finance', label: 'Keuangan' },
    { key: 'sales', label: 'Penjualan' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'employees', label: 'Data Pegawai' },
    { key: 'reports', label: 'Laporan' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'support', label: 'Layanan Pelanggan' },
    { key: 'presence', label: 'Presensi' },
    { key: 'notifications', label: 'Kirim Notifikasi' },
    { key: 'settings', label: 'Settings' },
  ],
  mobile: [
    { key: 'home', label: 'Dashboard' },
    { key: 'tickets', label: 'Tiket Support' },
    { key: 'tasks', label: 'Tugas Saya' },
    { key: 'schedule', label: 'Jadwal Shift' },
    { key: 'leave', label: 'Permohonan Izin' },
    { key: 'history', label: 'Riwayat Absen' },
    { key: 'approval', label: 'Persetujuan Izin' },
    { key: 'overtime', label: 'Penugasan Lembur' },
    { key: 'performance', label: 'Penilaian Harian' },
  ]
};
