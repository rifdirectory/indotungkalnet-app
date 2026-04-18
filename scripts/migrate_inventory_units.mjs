import mysql from 'mysql2/promise';

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
  });

  try {
    console.log('Adding columns to inventory_items...');
    try {
        await connection.query('ALTER TABLE inventory_items ADD COLUMN conversion_factor DECIMAL(15,2) DEFAULT 1.00 AFTER unit');
        await connection.query('ALTER TABLE inventory_items ADD COLUMN secondary_unit VARCHAR(50) DEFAULT NULL AFTER conversion_factor');
        console.log('inventory_items updated.');
    } catch (e) {
        if (e.code === 'ER_DUP_COLUMN') console.log('inventory_items columns already exist.');
        else throw e;
    }

    console.log('Adding columns to inventory_logs...');
    try {
        await connection.query('ALTER TABLE inventory_logs ADD COLUMN trx_unit VARCHAR(50) DEFAULT NULL AFTER quantity');
        await connection.query('ALTER TABLE inventory_logs ADD COLUMN trx_factor DECIMAL(15,2) DEFAULT 1.00 AFTER trx_unit');
        console.log('inventory_logs updated.');
    } catch (e) {
        if (e.code === 'ER_DUP_COLUMN') console.log('inventory_logs columns already exist.');
        else throw e;
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
