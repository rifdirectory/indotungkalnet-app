import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
});

async function run() {
  try {
    // 1. Show all tables to see if we have tickets/maintenance
    const [tables] = await pool.query('SHOW TABLES');
    console.log('--- TABLES ---');
    console.log(tables);

    // 2. Describe customers to see status tracking
    const [custSchema] = await pool.query('DESCRIBE customers');
    console.log('\n--- CUSTOMERS SCHEMA ---');
    console.log(custSchema);

    // 3. Check for specific status counts
    const [custStats] = await pool.query('SELECT status, COUNT(*) as total FROM customers GROUP BY status');
    console.log('\n--- CUSTOMER STATS ---');
    console.log(custStats);

    // 4. Check finance categories to see if they are granular
    const [finCats] = await pool.query('SELECT * FROM finance_categories');
    console.log('\n--- FINANCE CATEGORIES ---');
    console.log(finCats);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
