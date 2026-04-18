import mysql from 'mysql2/promise';

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db',
  });

  console.log('Starting Finance Migration...');

  try {
    // 1. Finance Categories
    console.log('Creating finance_categories...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS finance_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          type ENUM('income', 'expense') NOT NULL,
          is_system BOOLEAN DEFAULT FALSE,
          icon VARCHAR(50),
          color VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Vendors
    console.log('Creating vendors...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vendors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(100),
          phone VARCHAR(20),
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Debts
    console.log('Creating debts...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS debts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          entity_type ENUM('staff', 'vendor', 'bank', 'other') NOT NULL,
          entity_id INT,
          debt_type ENUM('payable', 'receivable') NOT NULL,
          total_amount DECIMAL(15, 2) NOT NULL,
          paid_amount DECIMAL(15, 2) DEFAULT 0,
          status ENUM('active', 'settled') DEFAULT 'active',
          due_date DATE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 4. Update Transactions
    console.log('Updating transactions table...');
    const [cols] = await connection.query('SHOW COLUMNS FROM transactions');
    const colNames = cols.map((c) => c.Field);
    
    if (!colNames.includes('category_id')) {
      await connection.query('ALTER TABLE transactions ADD COLUMN category_id INT NULL');
    }
    if (!colNames.includes('debt_id')) {
      await connection.query('ALTER TABLE transactions ADD COLUMN debt_id INT NULL');
    }
    if (!colNames.includes('reference_number')) {
      await connection.query('ALTER TABLE transactions ADD COLUMN reference_number VARCHAR(100) NULL');
    }

    // Seed Categories
    const [existingCats] = await connection.query('SELECT COUNT(*) as count FROM finance_categories');
    if (existingCats[0].count === 0) {
      console.log('Seeding initial categories...');
      await connection.query(`
        INSERT INTO finance_categories (name, type, is_system, icon) VALUES 
        ('Pembayaran Pelanggan', 'income', TRUE, 'People'),
        ('Pemasangan Baru', 'income', TRUE, 'Handyman'),
        ('Pembelian Material', 'expense', FALSE, 'Inventory'),
        ('Gaji Pegawai', 'expense', FALSE, 'Badge'),
        ('Sewa Kantor/POP', 'expense', FALSE, 'Business'),
        ('Listrik & Utilitas', 'expense', FALSE, 'Power'),
        ('Pinjaman Pegawai', 'expense', FALSE, 'RequestQuote'),
        ('Cicilan Pinjaman Pegawai', 'income', FALSE, 'AddCard'),
        ('Biaya Langganan Bandwidth', 'expense', FALSE, 'Wifi')
      `);
    }

    console.log('✅ Finance Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
