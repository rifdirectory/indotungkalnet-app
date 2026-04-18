import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
});

async function run() {
  try {
    // 1. Analyze support tickets
    const [ticketSchema] = await pool.query('DESCRIBE support_tickets');
    console.log('--- TICKETS SCHEMA ---');
    console.log(ticketSchema);

    // 2. Analyze maintenance jobs
    const [maintSchema] = await pool.query('DESCRIBE maintenance_jobs');
    console.log('\n--- MAINTENANCE SCHEMA ---');
    console.log(maintSchema);

    // 3. Look for any existing ticket entries to see patterns
    const [tickets] = await pool.query('SELECT * FROM support_tickets LIMIT 5');
    console.log('\n--- TICKET SAMPLES ---');
    console.log(tickets);

    // 4. Check products/packages to see if revenue logic is sound
    const [products] = await pool.query('SELECT * FROM products');
    console.log('\n--- PRODUCTS ---');
    console.log(products);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
