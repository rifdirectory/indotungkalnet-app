import mysql from 'mysql2/promise';

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db',
  });

  console.log('Starting Fixed Assets Migration...');

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category ENUM('land', 'infrastructure', 'equipment', 'vehicle', 'other') DEFAULT 'other',
          purchase_date DATE,
          cost_price DECIMAL(15, 2) NOT NULL,
          useful_life_months INT DEFAULT 60, -- Default 5 years
          current_value DECIMAL(15, 2) NOT NULL,
          accumulated_depreciation DECIMAL(15, 2) DEFAULT 0,
          location VARCHAR(255),
          notes TEXT,
          status ENUM('active', 'maintenance', 'disposed') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Check if columns exist (for existing tables)
    const [cols] = await connection.query('SHOW COLUMNS FROM fixed_assets');
    const colNames = cols.map((c: any) => c.Field);

    if (!colNames.includes('useful_life_months')) {
      await connection.query('ALTER TABLE fixed_assets ADD COLUMN useful_life_months INT DEFAULT 60');
    }
    if (!colNames.includes('cost_price')) {
      await connection.query('ALTER TABLE fixed_assets ADD COLUMN cost_price DECIMAL(15, 2) DEFAULT 0');
    }
    if (!colNames.includes('accumulated_depreciation')) {
      await connection.query('ALTER TABLE fixed_assets ADD COLUMN accumulated_depreciation DECIMAL(15, 2) DEFAULT 0');
    }

    console.log('✅ Fixed Assets table is ready!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
