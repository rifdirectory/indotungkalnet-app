const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({ 
    host: 'localhost', 
    port: 3306, 
    user: 'root', 
    password: 'advance', 
    database: 'indotungkal_db' 
  });

  console.log('--- Starting Multi-Account Schema Migration ---');

  try {
    // 1. Add account_id and transfer_id columns
    await pool.query(`
      ALTER TABLE transactions 
      ADD COLUMN account_id INT NULL AFTER category_id,
      ADD COLUMN transfer_id VARCHAR(100) NULL AFTER reference_number,
      ADD INDEX (account_id),
      ADD INDEX (transfer_id)
    `);
    console.log('Added account_id and transfer_id columns.');

    // 2. Set default account_id to 1 (Kas) for all existing records
    await pool.query('UPDATE transactions SET account_id = 1');
    console.log('Migrated existing transactions to account_id = 1 (Kas).');

  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping alter.');
    } else {
      throw err;
    }
  }

  console.log('--- Migration Complete ---');
  await pool.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
