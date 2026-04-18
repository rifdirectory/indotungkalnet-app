
import db from './src/lib/db';

async function migrate() {
  try {
    console.log('Checking columns for inventory_logs...');
    const columns: any = await db.query('SHOW COLUMNS FROM inventory_logs');
    const hasPurchasePrice = columns.some((c: any) => c.Field === 'purchase_price');
    
    if (!hasPurchasePrice) {
      console.log('Adding purchase_price column to inventory_logs...');
      await db.query('ALTER TABLE inventory_logs ADD COLUMN purchase_price DECIMAL(15, 2) DEFAULT 0 AFTER sale_price');
      console.log('Column added successfully.');
    } else {
      console.log('Column already exists.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
