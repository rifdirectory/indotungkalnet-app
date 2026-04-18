const mysql = require('mysql2/promise');

const poolConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
};

async function main() {
  const connection = await mysql.createConnection(poolConfig);
  try {
    const [categories] = await connection.query('SELECT * FROM finance_categories');
    const [coas] = await connection.query('SELECT * FROM chart_of_accounts');
    
    console.log(JSON.stringify({ categories, coas }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();
