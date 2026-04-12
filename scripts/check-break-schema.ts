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
    const [cols]: any = await connection.execute('DESC shifts');
    console.log('Shifts Columns:', cols.map((c: any) => ({ Field: c.Field, Type: c.Type })));
    
    const [types]: any = await connection.execute('SELECT DISTINCT type FROM attendance');
    console.log('Attendance Types:', types);
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await connection.end();
  }
}

check();
