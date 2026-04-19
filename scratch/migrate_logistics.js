const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'indotungkalnet'
    });

    try {
        console.log('Starting migrations...');

        // 1. Update inventory_categories
        await connection.query(`
            ALTER TABLE inventory_categories 
            ADD COLUMN IF NOT EXISTS asset_type ENUM('fixed', 'current') DEFAULT 'current'
        `);
        console.log('✓ Updated inventory_categories');

        // 2. Update fixed_assets
        await connection.query(`
            ALTER TABLE fixed_assets 
            ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS inventory_item_id INT,
            ADD COLUMN IF NOT EXISTS entity_id INT,
            ADD COLUMN IF NOT EXISTS entity_type ENUM('customer', 'staff', 'other') DEFAULT 'customer'
        `);
        console.log('✓ Updated fixed_assets');

        // 3. Update inventory_logs
        await connection.query(`
            ALTER TABLE inventory_logs 
            ADD COLUMN IF NOT EXISTS \`condition\` ENUM('new', 'used', 'broken') DEFAULT 'new'
        `);
        console.log('✓ Updated inventory_logs');

        // 4. Create inventory_sales
        await connection.query(`
            CREATE TABLE IF NOT EXISTS inventory_sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_number VARCHAR(50) UNIQUE,
                customer_id INT,
                total_amount DECIMAL(15, 2) NOT NULL,
                payment_mode ENUM('cash', 'debt') DEFAULT 'cash',
                payment_status ENUM('unpaid', 'paid', 'partially_paid') DEFAULT 'unpaid',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user VARCHAR(50),
                notes TEXT
            )
        `);
        console.log('✓ Created inventory_sales table');

        // 5. Create inventory_sale_items
        await connection.query(`
            CREATE TABLE IF NOT EXISTS inventory_sale_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT,
                item_id INT,
                quantity DECIMAL(15, 2) NOT NULL,
                unit VARCHAR(20),
                price DECIMAL(15, 2) NOT NULL,
                cost_price DECIMAL(15, 2) NOT NULL,
                asset_type ENUM('fixed', 'current') DEFAULT 'current',
                sn VARCHAR(100),
                FOREIGN KEY (sale_id) REFERENCES inventory_sales(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Created inventory_sale_items table');

        console.log('Migrations completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
