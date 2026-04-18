import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
});

async function run() {
  try {
    console.log('--- STARTING GOVERNANCE SCHEMA UPGRADE ---');

    // 1. Upgrade Customers for Churn Tracking
    console.log('Upgrading customers table...');
    await pool.query(`
      ALTER TABLE customers 
      ADD COLUMN suspended_at DATETIME NULL,
      ADD COLUMN closed_at DATETIME NULL,
      ADD COLUMN churn_reason VARCHAR(255) NULL
    `);
    console.log('Customers table upgraded.');

    // 2. Upgrade Support Tickets for Cost Tracking
    console.log('Upgrading support_tickets table...');
    await pool.query(`
      ALTER TABLE support_tickets 
      ADD COLUMN fuel_cost DECIMAL(15, 2) DEFAULT 0,
      ADD COLUMN other_cost DECIMAL(15, 2) DEFAULT 0,
      ADD COLUMN material_cost DECIMAL(15, 2) DEFAULT 0
    `);
    console.log('Support tickets table upgraded.');

    console.log('--- GOVERNANCE SCHEMA UPGRADE COMPLETE ---');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('Columns already exist. Migration skipped.');
    } else {
        console.error('Migration failed:', err);
    }
  } finally {
    await pool.end();
  }
}
run();
