import fs from 'fs';
import mysql from 'mysql2/promise';

async function extractAllPackages() {
  console.log('🚀 Starting Comprehensive Package Extraction...');
  
  const data = fs.readFileSync('/Users/rifdirectory/app/project/indotungkalnet/data/customers_full.tsv', 'utf8');
  const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
  
  const packageNames = new Set();

  for (const line of lines) {
    // Try to find "Paket" in the line
    const matches = line.match(/Paket\s*(.*)$/i);
    if (matches) {
      let pkg = matches[0].trim();
      // If it's very long, it might have captured multiple things, but usually it's at the end
      // Clean up multiple spaces
      pkg = pkg.replace(/\s+/g, ' ');
      packageNames.add(pkg);
    }
  }

  console.log(`🔍 Found ${packageNames.size} potential package names.`);

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
  });

  let addedCount = 0;
  for (const name of packageNames) {
    const [rows] = await connection.query('SELECT id FROM products WHERE name = ?', [name]);
    if (rows.length === 0) {
      let speed = 20;
      const speedMatch = name.match(/(\d+)\s*MB/i);
      if (speedMatch) speed = parseInt(speedMatch[1]);
      
      await connection.query(
        'INSERT INTO products (name, category, speed_mbps, price, description) VALUES (?, ?, ?, ?, ?)',
        [name, 'broadband', speed, speed * 10000, 'Comprehensive extraction']
      );
      console.log(`✅ Added: ${name}`);
      addedCount++;
    }
  }

  console.log(`🎉 Added ${addedCount} new packages.`);
  await connection.end();
}

extractAllPackages();
