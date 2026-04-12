import mysql from 'mysql2/promise';
import fs from 'fs';

async function performCleanup() {
  let dbConfig = { host: 'localhost', port: 3306, user: 'root', password: 'advance', database: 'indotungkal_db' };
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key === 'DATABASE_HOST') dbConfig.host = value.trim();
      if (key === 'DATABASE_PORT') dbConfig.port = parseInt(value.trim());
      if (key === 'DATABASE_USER') dbConfig.user = value.trim();
      if (key === 'DATABASE_PASSWORD') dbConfig.password = value.trim();
      if (key === 'DATABASE_NAME') dbConfig.database = value.trim();
    });
  } catch(e) {}

  const tablesToTruncate = [
    'ticket_assignees',
    'support_tickets',
    'task_assignees',
    'tasks',
    'maintenance_jobs',
    'attendance',
    'location_tracking',
    'daily_appraisals',
    'leave_requests',
    'overtime_requests',
    'transactions'
  ];

  console.log('--- STARTING SELECTIVE CLEANUP ---');
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Disable FK checks to allow truncation of parent tables
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    for (const table of tablesToTruncate) {
        console.log(`Truncating ${table}...`);
        await connection.query(`TRUNCATE TABLE ${table};`);
    }
    
    // Re-enable FK checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ Selective cleanup completed successfully.');
    
    // Snapshot verification
    console.log('\n--- VERIFICATION ---');
    for (const table of tablesToTruncate) {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table.padEnd(20)}: ${rows[0].count} rows`);
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await connection.end();
  }
}

performCleanup();
