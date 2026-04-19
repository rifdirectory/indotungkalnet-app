'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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

export async function getUserSessionAction() {
  try {
    const session = await getSession();
    return { success: true, user: session };
  } catch (error) {
    console.error('[Action] getUserSession error:', error);
    return { success: false, message: 'Failed to get session' };
  }
}

export async function getRolesAction() {
  try {
    const positions: any = await db.query('SELECT name FROM positions');
    const roles = ['admin', ...positions.map((p: any) => p.name)];
    return { success: true, roles };
  } catch (error) {
    console.error('[Action] getRoles error:', error);
    return { success: false, message: 'Failed to get roles' };
  }
}

export async function getMenuPermissionsAction(role?: string) {
  try {
    await ensureTableExists();
    let rows: any;
    if (role) {
      rows = await db.query('SELECT * FROM sys_menu_permissions WHERE role_name = ?', [role]);
    } else {
      rows = await db.query('SELECT * FROM sys_menu_permissions');
    }
    return { success: true, permissions: rows };
  } catch (error) {
    console.error('[Action] getMenuPermissions error:', error);
    return { success: false, message: 'Failed to fetch permissions' };
  }
}

export async function updateMenuPermissionAction(
  role: string, 
  platform: 'web' | 'mobile', 
  menuKey: string, 
  isEnabled: boolean
) {
  try {
    await ensureTableExists();
    await db.query(`
      INSERT INTO sys_menu_permissions (role_name, platform, menu_key, is_enabled)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)
    `, [role, platform, menuKey, isEnabled ? 1 : 0]);
    
    revalidatePath('/'); // Refresh sidebar caches if any
    return { success: true };
  } catch (error) {
    console.error('[Action] updateMenuPermission error:', error);
    return { success: false, message: 'Failed to update permission' };
  }
}
