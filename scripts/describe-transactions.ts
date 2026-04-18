import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db',
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows]: any = await connection.query('DESCRIBE transactions');
    console.log('Transactions Table Schema:');
    console.table(rows);
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await connection.end();
  }
}

check();
