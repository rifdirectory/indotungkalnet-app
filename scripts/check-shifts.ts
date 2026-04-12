import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'advance',
  database: process.env.DATABASE_NAME || 'indotungkal_db',
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows]: any = await connection.execute('SELECT id, name FROM shifts');
    console.log('Available Shifts:', rows);
  } catch (error) {
    console.error('Failed to fetch shifts:', error);
  } finally {
    await connection.end();
  }
}

check();
