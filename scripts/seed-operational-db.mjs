import mysql from 'mysql2/promise';

async function seedOperationalData() {
  console.log('Starting Operational Database Setup & Seeding...');

  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'advance',
    database: process.env.DATABASE_NAME || 'indotungkal_db',
  });

  try {
    // 1. Customers Table
    console.log('Creating `customers` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        package VARCHAR(100),
        status VARCHAR(50),
        ip_address VARCHAR(50),
        join_date DATE
      );
    `);
    
    // Seed Customers
    const [existingCustomers] = await connection.query('SELECT COUNT(*) as count FROM customers');
    if (existingCustomers[0].count === 0) {
      await connection.query(`
        INSERT INTO customers (full_name, email, package, status, ip_address, join_date) VALUES 
        ('PT Maju Bersama', 'it@majubersama.com', '100 Mbps Corporate', 'Active', '103.14.55.12', '2023-01-15'),
        ('Budi Santoso', 'budi.s@gmail.com', '20 Mbps Family', 'Active', '103.14.55.45', '2023-05-20'),
        ('Siti Aminah', 'siti99@yahoo.com', '10 Mbps Personal', 'Suspended', '103.14.55.88', '2023-11-05'),
        ('Toko Sumber Rejeki', 'sumber.rejeki@outlook.com', '50 Mbps Business', 'Active', '103.14.55.102', '2024-02-10');
      `);
      console.log('✅ Customers seeded.');
    } else {
      console.log('ℹ️ Customers table already has data. Skipping seed.');
    }

    // 2. Transactions Table
    console.log('Creating `transactions` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trx_date DATE NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        category VARCHAR(100),
        user VARCHAR(255),
        amount DECIMAL(15,2),
        status VARCHAR(50)
      );
    `);

    // Seed Transactions
    const [existingTransactions] = await connection.query('SELECT COUNT(*) as count FROM transactions');
    if (existingTransactions[0].count === 0) {
      await connection.query(`
        INSERT INTO transactions (trx_date, type, category, user, amount, status) VALUES 
        ('2024-03-24', 'income', 'Subscription', 'Budi Santoso', 255000, 'completed'),
        ('2024-03-23', 'expense', 'Electricity', 'PLN (Kantor)', 1200000, 'completed'),
        ('2024-03-22', 'income', 'Installation', 'Siti Aminah', 150000, 'completed'),
        ('2024-03-21', 'expense', 'Hardware', 'Vendor Fiber', 5500000, 'pending');
      `);
      console.log('✅ Transactions seeded.');
    }

    // 3. Inventory Table
    console.log('Creating `inventory_items` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_code VARCHAR(50) UNIQUE NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        stock INT DEFAULT 0,
        status VARCHAR(50)
      );
    `);

    // Seed Inventory
    const [existingInventory] = await connection.query('SELECT COUNT(*) as count FROM inventory_items');
    if (existingInventory[0].count === 0) {
      await connection.query(`
        INSERT INTO inventory_items (item_code, item_name, category, stock, status) VALUES 
        ('RTR-MK-01', 'MikroTik RB750Gr3', 'Router & Switch', 12, 'In Stock'),
        ('CBL-FBR-1C', 'Kabel Fiber Optic 1 Core (Roll)', 'Kabel & Pasif', 5, 'Low Stock'),
        ('ONT-ZTE-F6', 'ZTE F609 ONT Router', 'Perangkat Pelanggan', 45, 'In Stock'),
        ('SFP-1G-20', 'SFP Module 1.25G 20km', 'Aksesoris Jaringan', 0, 'Out of Stock');
      `);
      console.log('✅ Inventory items seeded.');
    }

    // 4. Maintenance Jobs Table
    console.log('Creating `maintenance_jobs` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS maintenance_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        technician_name VARCHAR(100) NOT NULL,
        job_type VARCHAR(100),
        location VARCHAR(255),
        priority ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
        status VARCHAR(50)
      );
    `);

    // Seed Maintenance Jobs
    const [existingJobs] = await connection.query('SELECT COUNT(*) as count FROM maintenance_jobs');
    if (existingJobs[0].count === 0) {
      await connection.query(`
        INSERT INTO maintenance_jobs (technician_name, job_type, location, priority, status) VALUES 
        ('Rahmat H.', 'Instalasi Baru', 'Jl. Jendral Sudirman', 'High', 'In Progress'),
        ('Doni Prasetyo', 'Perbaikan Kabel', 'Kuala Tungkal', 'Medium', 'Scheduled'),
        ('Eko S.', 'Maintenance ODP', 'Pasar Lama', 'Low', 'Completed');
      `);
      console.log('✅ Maintenance jobs seeded.');
    }

    // 5. Support Tickets Table
    console.log('Creating `support_tickets` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        priority ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
        status VARCHAR(50),
        created_time_str VARCHAR(100)
      );
    `);

    // Seed Support Tickets
    const [existingTickets] = await connection.query('SELECT COUNT(*) as count FROM support_tickets');
    if (existingTickets[0].count === 0) {
      // Using created_time_str to match the UI's string-based display ("2 jam yang lalu") temporarily
      await connection.query(`
        INSERT INTO support_tickets (customer_name, subject, priority, status, created_time_str) VALUES 
        ('Andi Permana', 'Internet Lambat', 'High', 'Open', '2 jam yang lalu'),
        ('Siti Rahma', 'Pindah Titik Kabel', 'Medium', 'In Progress', '5 jam yang lalu'),
        ('Toko Berkah', 'Upgrade Paket 50Mbps', 'Medium', 'Open', '1 hari yang lalu'),
        ('Budi Santoso', 'Sinyal Wifi Lemah', 'Low', 'Closed', 'Yesterday');
      `);
      console.log('✅ Support tickets seeded.');
    }

    console.log('🎉 Operational Database Setup & Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await connection.end();
  }
}

seedOperationalData();
