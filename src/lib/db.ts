import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+07:00'
};

// Singleton pattern for Next.js HMR
const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
};

export const pool = globalForDb.pool ?? mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export async function query(sql: string, params?: any[]) {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

const db = {
  query,
  pool
};

export default db;
