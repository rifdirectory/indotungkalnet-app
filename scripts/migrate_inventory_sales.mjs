import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function migrate() {
  try {
    console.log('--- Starting Strategic Inventory Migration ---');
    
    // Add purchase_price to inventory_items
    console.log('Adding purchase_price to inventory_items...');
    await pool.query('ALTER TABLE inventory_items ADD COLUMN purchase_price DECIMAL(15,2) DEFAULT 0 AFTER price');
    
    // Add sale_price to inventory_logs
    console.log('Adding sale_price to inventory_logs...');
    await pool.query('ALTER TABLE inventory_logs ADD COLUMN sale_price DECIMAL(15,2) DEFAULT 0 AFTER quantity');
    
    console.log('--- Migration Completed Successfully! ---');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN') {
      console.log('Column already exists, skipping...');
    } else {
      console.error('Migration Error:', err.message);
    }
  } finally {
    await pool.end();
    process.exit();
  }
}

migrate();
