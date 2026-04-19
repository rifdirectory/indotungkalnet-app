const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkData() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  const today = '2026-04-20';
  const [rows] = await connection.execute(
    'SELECT a.id, a.type, a.timestamp, e.full_name FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE DATE(a.timestamp) = ?',
    [today]
  );

  console.log(`Found ${rows.length} records for ${today}:`);
  rows.forEach(r => {
    console.log(`- ${r.full_name} (${r.type}) at ${r.timestamp}`);
  });

  await connection.end();
}

checkData().catch(console.error);
