require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT || '3306'),
  });

  try {
    console.log('Resetting admin permissions...');
    await pool.query("DELETE FROM sys_menu_permissions WHERE role_name = 'admin'");
    console.log('Admin permissions reset successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
