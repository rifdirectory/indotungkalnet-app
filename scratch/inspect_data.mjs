import mysql from 'mysql2/promise';
import fs from 'fs';

async function inspectData() {
  let dbConfig = { host: 'localhost', port: 3306, user: 'root', password: 'advance', database: 'indotungkal_db' };
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
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
    const [employees] = await connection.query('SELECT * FROM employees LIMIT 5');
    const [positions] = await connection.query('SELECT * FROM positions LIMIT 5');
    console.log('--- EMPLOYEES ---');
    console.log(JSON.stringify(employees, null, 2));
    console.log('--- POSITIONS ---');
    console.log(JSON.stringify(positions, null, 2));
  } finally {
    await connection.end();
  }
}
inspectData();
