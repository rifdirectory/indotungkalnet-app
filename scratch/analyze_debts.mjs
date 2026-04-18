import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
});

async function run() {
  try {
    const [debtSchema] = await pool.query('DESCRIBE debts');
    console.log('--- DEBTS SCHEMA ---');
    console.log(debtSchema);
    
    const [samples] = await pool.query('SELECT * FROM debts WHERE debt_type = "receivable" LIMIT 5');
    console.log('\n--- RECEIVABLE SAMPLES ---');
    console.log(samples);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
