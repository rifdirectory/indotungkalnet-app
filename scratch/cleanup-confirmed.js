const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1].trim()] = value;
  }
});

async function cleanup() {
  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST || 'localhost',
    port: parseInt(env.DATABASE_PORT || '3306'),
    user: env.DATABASE_USER || 'root',
    password: env.DATABASE_PASSWORD || '',
    database: env.DATABASE_NAME || 'indotungkal_db',
  });

  try {
    const tablesToClear = [
      'attendance',
      'daily_appraisals',
      'employee_shifts',
      'leave_requests',
      'support_tickets',
      'ticket_assignees'
    ];

    console.log('Cleaning up verified dummy and ticket data...');

    for (const table of tablesToClear) {
      try {
        const [res] = await connection.execute(`DELETE FROM ${table}`);
        console.log(`✅ Table \`${table}\` cleared. (Deleted ${res.affectedRows} records)`);
      } catch (err) {
        console.warn(`⚠️ Could not clear table \`${table}\`:`, err.message);
      }
    }

    console.log('\n--- Cleanup Finished ---');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  } finally {
    await connection.end();
  }
}

cleanup();
