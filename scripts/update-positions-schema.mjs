import mysql from 'mysql2/promise';

async function updateSchema() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
  });

  console.log('🚀 Updating positions table schema...');

  try {
    const columns = [
      'basic_salary',
      'allowance_pos',
      'allowance_trans',
      'allowance_meal',
      'allowance_presence',
      'deduction_bpjs'
    ];

    for (const col of columns) {
      await conn.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS ${col} DECIMAL(15,2) DEFAULT 0`);
      console.log(`✅ Added column ${col} to positions table.`);
    }

    console.log('🎉 Schema update complete!');
  } catch (err) {
    console.error('❌ Schema update failed:', err);
  } finally {
    await conn.end();
  }
}

updateSchema();
