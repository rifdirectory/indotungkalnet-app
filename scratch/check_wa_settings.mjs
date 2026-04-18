import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
});

async function run() {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE setting_key LIKE "wa_%"');
    console.log(JSON.stringify(rows));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
