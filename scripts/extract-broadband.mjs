import mysql from 'mysql2/promise';

async function extractBroadbandProducts() {
  console.log('📦 Starting Broadband Product Extraction...');

  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'advance',
    database: process.env.DATABASE_NAME || 'indotungkal_db',
  });

  try {
    // 1. Get unique packages from customers table
    const [customerPackages] = await connection.query('SELECT DISTINCT package FROM customers WHERE package IS NOT NULL AND package != ""');
    
    console.log(`🔍 Found ${customerPackages.length} unique package names in customer data.`);

    for (const row of customerPackages) {
      const originalName = row.package.trim();
      
      // Heuristic parsing for speed/price
      let speed = 20; // Default
      let price = 0;
      
      // Example: "PAKET 30 MBPS 500 RIBU"
      const speedMatch = originalName.match(/(\d+)\s*MBPS/i);
      if (speedMatch) {
        speed = parseInt(speedMatch[1]);
      } else {
        // Example: "Paket 100", "Paket 150" - assume these are Mbps if small, else price?
        // Let's assume numbers like 100, 150, 250, 300 are Speed in Mbps for now unless "ribu" is present
        const numMatch = originalName.match(/(\d+)/);
        if (numMatch) {
          const val = parseInt(numMatch[1]);
          if (val >= 10 && val <= 1000) speed = val;
        }
      }

      const priceMatch = originalName.match(/(\d+)\s*RIBU/i);
      if (priceMatch) {
        price = parseInt(priceMatch[1]) * 1000;
      } else {
        // Default prices if not found
        price = speed * 10000; // Mock price: 10k per Mbps
      }

      // Check if product already exists
      const [existing] = await connection.query('SELECT id FROM products WHERE name = ?', [originalName]);
      
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO products (name, category, speed_mbps, price, description) VALUES (?, ?, ?, ?, ?)',
          [originalName, 'broadband', speed, price, `Paket diekstrak dari data pelanggan: ${originalName}`]
        );
        console.log(`✅ Extracted: ${originalName} (${speed} Mbps, Rp ${price})`);
      } else {
        console.log(`ℹ️ Product already exists: ${originalName}. Skipping.`);
      }
    }

    console.log('🎉 Broadband product extraction complete!');

  } catch (error) {
    console.error('❌ Error during extraction:', error);
  } finally {
    await connection.end();
  }
}

extractBroadbandProducts();
