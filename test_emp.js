import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
(async () => {
  const db = await mysql.createConnection(process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'indotungkalnet'
  });
  const [rows] = await db.query("SELECT id, full_name, nickname FROM employees WHERE LOWER(full_name) LIKE '%mirwan%'");
  console.log(rows);
  process.exit();
})();
