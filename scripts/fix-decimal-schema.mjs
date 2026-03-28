import mysql from 'mysql2/promise';

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
  });

  try {
    console.log('🚀 Altering positions table...');
    await conn.query(`
      ALTER TABLE positions 
      MODIFY COLUMN basic_salary BIGINT DEFAULT 0,
      MODIFY COLUMN allowance_pos BIGINT DEFAULT 0,
      MODIFY COLUMN allowance_trans BIGINT DEFAULT 0,
      MODIFY COLUMN allowance_meal BIGINT DEFAULT 0,
      MODIFY COLUMN allowance_presence BIGINT DEFAULT 0,
      MODIFY COLUMN deduction_bpjs BIGINT DEFAULT 0
    `);

    console.log('🚀 Altering employees table...');
    await conn.query(`
      ALTER TABLE employees 
      MODIFY COLUMN basic_salary BIGINT DEFAULT 0,
      MODIFY COLUMN allowance_pos BIGINT DEFAULT 0,
      MODIFY COLUMN allowance_trans BIGINT DEFAULT 0,
      MODIFY COLUMN allowance_meal BIGINT DEFAULT 0,
      MODIFY COLUMN allowance_presence BIGINT DEFAULT 0,
      MODIFY COLUMN deduction_bpjs BIGINT DEFAULT 0
    `);

    console.log('🚀 Altering products table...');
    await conn.query(`
      ALTER TABLE products 
      MODIFY COLUMN price BIGINT DEFAULT 0
    `);

    console.log('✅ Database migration successful! DECIMAL(15,2) converted to BIGINT.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await conn.end();
  }
}

migrate();
