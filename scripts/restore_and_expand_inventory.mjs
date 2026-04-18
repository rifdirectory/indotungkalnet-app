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
    console.log('--- Database Restoration & Expansion Starting ---');
    
    // Check Columns first to avoid errors
    const [columns] = await pool.query('DESCRIBE inventory_items');
    const existingColumns = columns.map(r => r.Field);
    
    // Add missing standard columns
    if (!existingColumns.includes('unit')) {
      console.log('Adding column: unit');
      await pool.query("ALTER TABLE inventory_items ADD COLUMN unit VARCHAR(50) DEFAULT 'Unit'");
    }
    if (!existingColumns.includes('min_stock')) {
      console.log('Adding column: min_stock');
      await pool.query("ALTER TABLE inventory_items ADD COLUMN min_stock INT DEFAULT 1");
    }
    if (!existingColumns.includes('price')) {
      console.log('Adding column: price (Selling Price)');
      await pool.query("ALTER TABLE inventory_items ADD COLUMN price DECIMAL(15,2) DEFAULT 0");
    }
    if (!existingColumns.includes('location')) {
      console.log('Adding column: location');
      await pool.query("ALTER TABLE inventory_items ADD COLUMN location VARCHAR(100) DEFAULT 'Gudang Utama'");
    }
    
    // Add NEW Strategic columns
    if (!existingColumns.includes('purchase_price')) {
      console.log('Adding column: purchase_price (New Feature)');
      await pool.query("ALTER TABLE inventory_items ADD COLUMN purchase_price DECIMAL(15,2) DEFAULT 0");
    }

    // Update Logs table
    const [logColumns] = await pool.query('DESCRIBE inventory_logs');
    const existingLogColumns = logColumns.map(r => r.Field);
    
    if (!existingLogColumns.includes('sale_price')) {
      console.log('Adding column: sale_price to inventory_logs');
      await pool.query("ALTER TABLE inventory_logs ADD COLUMN sale_price DECIMAL(15,2) DEFAULT 0");
    }

    console.log('--- Migration Successful! ---');
  } catch (err) {
    console.error('Migration Error:', err.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

migrate();
