import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function setup() {
  console.log('Starting Database Setup...');

  // Connect to MariaDB Server directly (without specifying a database first)
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'advance',
  });

  try {
    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS indotungkal_db;');
    console.log('✅ Database indotungkal_db checked/created.');

    // Switch to the database
    await connection.query('USE indotungkal_db;');

    // Create users table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createTableQuery);
    console.log('✅ Table `users` checked/created.');

    // Seed the admin user
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (Array.isArray(rows) && rows.length === 0) {
      // Admin doesn't exist, create it
      const passwordHash = await bcrypt.hash('advance', 10);
      await connection.query(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        ['admin', passwordHash]
      );
      console.log('✅ Default `admin` account created successfully (Password: advance).');
    } else {
      console.log('ℹ️ Admin account already exists. Skipping creation.');
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await connection.end();
  }
}

setup();
