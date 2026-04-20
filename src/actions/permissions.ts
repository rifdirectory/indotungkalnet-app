'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function ensureTableExists() {
  // Create table with employee_id support
  const sql = `
    CREATE TABLE IF NOT EXISTS sys_menu_permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_name VARCHAR(100) NULL,
      employee_id INT NULL,
      menu_key VARCHAR(100) NOT NULL,
      platform ENUM('web', 'mobile') NOT NULL,
      is_enabled TINYINT(1) DEFAULT 1,
      UNIQUE KEY unique_role_perm (role_name, menu_key, platform, employee_id)
    );
  `;
  await db.query(sql);

  // Migration: Ensure table structure is correct for existing tables
  try {
    const columns: any = await db.query("SHOW COLUMNS FROM sys_menu_permissions");
    const hasEmployeeId = columns.some((c: any) => c.Field === 'employee_id');
    const roleColumn = columns.find((c: any) => c.Field === 'role_name');
    const isRoleNameNullable = roleColumn?.Null === 'YES';

    // 1. Make role_name nullable if it's not
    if (!isRoleNameNullable) {
      console.log('[Migration] Making role_name nullable in sys_menu_permissions');
      await db.query("ALTER TABLE sys_menu_permissions MODIFY role_name VARCHAR(100) NULL");
    }

    // 2. Add employee_id and update index if missing
    if (!hasEmployeeId) {
      console.log('[Migration] Adding employee_id to sys_menu_permissions');
      await db.query("ALTER TABLE sys_menu_permissions ADD COLUMN employee_id INT NULL AFTER role_name");
      try {
        await db.query("ALTER TABLE sys_menu_permissions DROP INDEX unique_perm");
      } catch (e) { /* ignore if doesn't exist */ }
      await db.query("ALTER TABLE sys_menu_permissions ADD UNIQUE KEY unique_role_perm (role_name, employee_id, menu_key, platform)");
    }
  } catch (err) {
    console.error('[Migration] Failed to migrate sys_menu_permissions:', err);
  }
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

export async function getEmployeesAction() {
  try {
    const rows: any = await db.query(`
      SELECT e.id, e.full_name, p.name as position_name 
      FROM employees e 
      LEFT JOIN positions p ON e.position_id = p.id 
      WHERE e.status = 'active'
      ORDER BY e.full_name ASC
    `);
    return { success: true, employees: rows };
  } catch (error) {
    console.error('[Action] getEmployees error:', error);
    return { success: false, message: 'Failed to get employees' };
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

export async function getMenuPermissionsAction(role?: string, employeeId?: number) {
  try {
    await ensureTableExists();
    let rows: any;
    if (employeeId) {
      rows = await db.query('SELECT * FROM sys_menu_permissions WHERE employee_id = ?', [employeeId]);
    } else if (role) {
      rows = await db.query('SELECT * FROM sys_menu_permissions WHERE role_name = ? AND employee_id IS NULL', [role]);
    } else {
      // Default to empty if no target provided (prevents leaking all perms)
      return { success: true, permissions: [] };
    }
    return { success: true, permissions: rows };
  } catch (error) {
    console.error('[Action] getMenuPermissions error:', error);
    return { success: false, message: 'Failed to fetch permissions' };
  }
}

export async function updateMenuPermissionAction(
  target: { role?: string; employeeId?: number },
  platform: 'web' | 'mobile', 
  menuKey: string, 
  isEnabled: boolean
) {
  try {
    await ensureTableExists();
    
    if (target.employeeId) {
      await db.query(`
        INSERT INTO sys_menu_permissions (employee_id, platform, menu_key, is_enabled)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)
      `, [target.employeeId, platform, menuKey, isEnabled ? 1 : 0]);
    } else {
      await db.query(`
        INSERT INTO sys_menu_permissions (role_name, platform, menu_key, is_enabled)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)
      `, [target.role, platform, menuKey, isEnabled ? 1 : 0]);
    }
    
    revalidatePath('/'); // Refresh sidebar caches
    return { success: true };
  } catch (error) {
    console.error('[Action] updateMenuPermission error:', error);
    return { success: false, message: 'Failed to update permission' };
  }
}
