import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'indotungkal_management',
};

async function inspect() {
  const connection = await mysql.createConnection(poolConfig);
  try {
    const [roles] = await connection.query('SELECT DISTINCT position FROM employees');
    console.log('ROLES:', JSON.stringify(roles, null, 2));
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log('TABLES:', JSON.stringify(tables, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

inspect();
