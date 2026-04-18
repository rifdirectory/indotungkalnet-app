
const mysql = require('mysql2/promise');
const fs = require('fs');

// Simple manual .env parser
function loadEnv() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
  });
  return env;
}

const env = loadEnv();

const poolConfig = {
  host: env.DATABASE_HOST,
  port: parseInt(env.DATABASE_PORT || '3306'),
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  timezone: '+07:00'
};

async function migrate() {
  const connection = await mysql.createConnection(poolConfig);
  try {
    console.log('Checking columns for inventory_logs...');
    const [columns] = await connection.query('SHOW COLUMNS FROM inventory_logs');
    const hasPurchasePrice = columns.some((c) => c.Field === 'purchase_price');
    
    if (!hasPurchasePrice) {
      console.log('Adding purchase_price column to inventory_logs...');
      await connection.query('ALTER TABLE inventory_logs ADD COLUMN purchase_price DECIMAL(15, 2) DEFAULT 0 AFTER sale_price');
      console.log('Column added successfully.');
    } else {
      console.log('Column already exists.');
    }
    
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

migrate();
