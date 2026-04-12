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
    const [cols]: any = await connection.execute('DESC leave_requests');
    console.log('Columns:', cols.map((c: any) => ({ Field: c.Field, Type: c.Type })));
    
    const [rows]: any = await connection.execute('SELECT * FROM leave_requests WHERE start_date LIKE "2026-04-%"');
    console.log('April 2026 Leaves:', rows);
  } catch (error) {
    console.error('Failed to check leave_requests:', error);
  } finally {
    await connection.end();
  }
}

check();
