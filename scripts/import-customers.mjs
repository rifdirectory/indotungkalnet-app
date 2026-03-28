import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importCustomers() {
  console.log('🚀 Starting Customer Data Import...');

  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'advance',
    database: process.env.DATABASE_NAME || 'indotungkal_db',
  });

  try {
    // Ensure table exists with the schema the UI expects
    console.log('📦 Ensuring `customers` table exists...');
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

    // Read TSV data
    const tsvPath = path.join(__dirname, '../data/customers_full.tsv');
    const tsvData = fs.readFileSync(tsvPath, 'utf8');
    const lines = tsvData.split('\n').filter(line => line.trim() !== '');

    console.log(`📄 Found ${lines.length} records in TSV.`);

    // Clear existing data to avoid duplicates if re-run (optional, or check)
    // await connection.query('TRUNCATE TABLE customers');

    let importedCount = 0;
    const now = new Date().toISOString().split('T')[0];

    for (const line of lines) {
      const columns = line.split('\t');
      if (columns.length < 2) continue;

      // Map columns:
      // 0: ID/Identity, 1: Name, 2: Email, 3: Phone, 4: Address, 5: Username, 6: Package
      const fullName = columns[1] ? columns[1].trim() : 'Unknown';
      const email = columns[2] ? columns[2].trim() : '';
      const packageName = columns[6] ? columns[6].trim() : 'Standard';
      
      // Default values for fields not in TSV
      const status = 'active';
      const ipAddress = null;
      const joinDate = now;

      await connection.query(
        'INSERT INTO customers (full_name, email, package, status, ip_address, join_date) VALUES (?, ?, ?, ?, ?, ?)',
        [fullName, email, packageName, status, ipAddress, joinDate]
      );
      importedCount++;
    }

    console.log(`✅ Successfully imported ${importedCount} customers.`);
    console.log('🎉 Import completed successfully!');

  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await connection.end();
  }
}

importCustomers();
