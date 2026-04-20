const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env.local'});
async function run() {
  const db = await mysql.createConnection(process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'indotungkalnet'
  });
  const [rows] = await db.query('SELECT id, title, entity_type, debt_type, total_amount FROM debts');
  console.log('DEBTS:', rows);
  
  const [trxRows] = await db.query(`SELECT id, category_id, amount, notes FROM transactions WHERE category_id = 30`);
  console.log('ORPHAN KASBON TRX:', trxRows);
  process.exit();
}
run();
