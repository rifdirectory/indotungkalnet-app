import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

const [rows] = await pool.query('SELECT * FROM settings WHERE setting_key LIKE "wa_%"');
console.log(JSON.stringify(rows, null, 2));
process.exit(0);
