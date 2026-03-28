const XLSX = require('xlsx');
const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

// Connection details from env or hardcoded for this script
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db',
  port: 3306
};

async function run() {
  const connection = await mysql.createConnection(DB_CONFIG);
  console.log('Connected to MariaDB');

  try {
    // 1. Get Products for Mapping
    const [products] = await connection.query('SELECT id, name FROM products');
    const productMap = {};
    products.forEach(p => {
      productMap[p.name.toLowerCase()] = p.id;
    });

    // 2. Read Excel (Master Data)
    console.log('Reading Excel Master Data...');
    const masterBuf = fs.readFileSync('Data Customer.xlsx');
    const masterWb = XLSX.read(masterBuf, { type: 'buffer' });
    const masterData = XLSX.utils.sheet_to_json(masterWb.Sheets[masterWb.SheetNames[0]]);
    
    // Create map by CUSTOMER ID
    const masterMap = {};
    masterData.forEach(row => {
      const id = String(row['CUSTOMER ID'] || '').trim();
      if (id) masterMap[id] = row;
    });
    console.log(`Loaded ${Object.keys(masterMap).length} master records from Excel.`);

    // 3. Read CSV (Technical Data)
    console.log('Reading CSV Technical Data...');
    const csvContent = fs.readFileSync('Export Services Plan Export Services Plan PPPOE.csv', 'utf-8');
    const csvLines = csvContent.split('\n');
    const csvHeaders = csvLines[0].replace(/"/g, '').split(',');
    
    const technicalData = [];
    for (let i = 1; i < csvLines.length; i++) {
      const line = csvLines[i].trim();
      if (!line) continue;
      
      // Simple CSV parser for quoted fields
      const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const cleanRow = row.map(v => v.replace(/^"|"$/g, ''));
      
      const obj = {};
      csvHeaders.forEach((h, idx) => {
        obj[h] = cleanRow[idx];
      });
      technicalData.push(obj);
    }
    console.log(`Loaded ${technicalData.length} technical records from CSV.`);

    // 4. Merge and Import
    console.log('Merging and Importing...');
    
    // Clear existing customers (optional, or update)
    await connection.query('DELETE FROM customers');
    
    let imported = 0;
    let skipped = 0;

    for (const tech of technicalData) {
      const id = String(tech['id_customer'] || '').trim();
      const master = masterMap[id];
      
      if (!master) {
        skipped++;
        continue;
      }

      const fullName = (String(master['NAMA'] || '')).trim();
      const email = master['EMAIL'] || 'pelanggan@indotungkal.net';
      const phoneNumber = String(master['NO HP'] || '').trim();
      const address = master['ALAMAT'] || tech['alamat_customer'] || '';
      const packageName = tech['nama_paket'];
      const productId = productMap[packageName?.toLowerCase()] || null;
      const status = tech['status_akun'] === 'aktif' ? 'active' : 'suspended';
      const pppoeUser = tech['username'];
      const pppoePass = tech['password'];
      const joinDate = new Date().toISOString().split('T')[0]; // Default to today
      const customerType = 'broadband'; // Default or infer from package

      await connection.query(
        `INSERT INTO customers (full_name, email, phone_number, address, package, product_id, status, join_date, customer_type, pppoe_username, pppoe_password) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullName, email, phoneNumber, address, packageName, productId, status, joinDate, customerType, pppoeUser, pppoePass]
      );
      
      imported++;
    }

    console.log(`Import Complete: ${imported} imported, ${skipped} skipped (no match in Master).`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await connection.end();
  }
}

run();
