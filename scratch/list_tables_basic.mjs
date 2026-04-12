import mysql from 'mysql2/promise';
import fs from 'fs';

async function listTables() {
  let dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db',
  };

  // Try to parse .env.local if it exists
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const lines = env.split('\n');
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key === 'DATABASE_HOST') dbConfig.host = value.trim();
      if (key === 'DATABASE_PORT') dbConfig.port = parseInt(value.trim());
      if (key === 'DATABASE_USER') dbConfig.user = value.trim();
      if (key === 'DATABASE_PASSWORD') dbConfig.password = value.trim();
      if (key === 'DATABASE_NAME') dbConfig.database = value.trim();
    });
  } catch(e) {}

  const connection = await mysql.createConnection(dbConfig);

  try {
    const [rows] = await connection.query('SHOW TABLES');
    console.log('TABLES_LIST_START');
    console.log(JSON.stringify(rows));
    console.log('TABLES_LIST_END');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

listTables();
