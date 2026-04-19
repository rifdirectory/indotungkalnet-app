import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Hardcoded standard menu keys for both platforms
const STANDARD_MENUS = {
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

async function ensureTableExists() {
  const sql = `
    CREATE TABLE IF NOT EXISTS sys_menu_permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_name VARCHAR(100) NOT NULL,
      menu_key VARCHAR(100) NOT NULL,
      platform ENUM('web', 'mobile') NOT NULL,
      is_enabled TINYINT(1) DEFAULT 1,
      UNIQUE KEY unique_perm (role_name, menu_key, platform)
    );
  `;
  await db.query(sql);
}

export async function GET(request: Request) {
  try {
    await ensureTableExists();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // 1. Fetch available roles (Positions + admin)
    const positions: any = await db.query('SELECT name FROM positions');
    const roles = ['admin', ...positions.map((p: any) => p.name)];

    // 2. Fetch permissions
    let permissionsRows: any;
    if (role) {
      permissionsRows = await db.query('SELECT * FROM sys_menu_permissions WHERE role_name = ?', [role]);
    } else {
      permissionsRows = await db.query('SELECT * FROM sys_menu_permissions');
    }

    return NextResponse.json({
      success: true,
      roles,
      standardMenus: STANDARD_MENUS,
      permissions: permissionsRows
    });
  } catch (error) {
    console.error('[API Permissions] GET Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTableExists();
    const body = await request.json();
    const { role, platform, menu_key, is_enabled } = body;

    if (!role || !platform || !menu_key) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    // Upsert logic
    await db.query(`
      INSERT INTO sys_menu_permissions (role_name, platform, menu_key, is_enabled)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)
    `, [role, platform, menu_key, is_enabled ? 1 : 0]);

    return NextResponse.json({ success: true, message: 'Permission updated successfully' });
  } catch (error) {
    console.error('[API Permissions] POST Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
