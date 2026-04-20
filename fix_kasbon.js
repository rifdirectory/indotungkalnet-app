const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env.local'});
async function run() {
  try {
    const db = await mysql.createConnection(process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indotungkalnet'
    });
    
    // Check if there are orphan kasbon transactions
    const [orphanRows] = await db.query("SELECT id, amount, notes, trx_date FROM transactions WHERE category_id = 30 AND debt_id IS NULL AND type = 'expense'");
    console.log(`Found ${orphanRows.length} orphan kasbon transactions.`);
    
    for (const trx of orphanRows) {
      console.log(`Migrating: ${trx.notes} - ${trx.amount}`);
      const [res] = await db.query(
        "INSERT INTO debts (title, entity_type, debt_type, total_amount, created_at, description) VALUES (?, 'staff', 'receivable', ?, ?, ?)",
        [trx.notes || 'Kasbon Karyawan (Legacy)', trx.amount, trx.trx_date, 'Auto-migrated from legacy transaction']
      );
      await db.query("UPDATE transactions SET debt_id = ? WHERE id = ?", [res.insertId, trx.id]);
    }
    console.log('Done migrating.');
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
run();
