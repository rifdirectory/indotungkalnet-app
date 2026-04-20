import db from './src/lib/db';

async function fixAdminPermissions() {
  try {
    console.log('Resetting admin permissions...');
    // Delete all specific admin role permissions so it defaults to "enabled"
    await db.query("DELETE FROM sys_menu_permissions WHERE role_name = 'admin'");
    // Also delete any user overrides if they are currently logged in as admin-like user
    // (Optional, but let's stick to the role for now)
    
    console.log('Admin permissions reset successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset admin permissions:', err);
    process.exit(1);
  }
}

fixAdminPermissions();
