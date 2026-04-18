import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
};

async function repair() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('--- STARTING FINANCIAL DATA REPAIR ---');

        // 1. Fix incorrect Category ID (10 -> 11)
        const [upResult] = await connection.query('UPDATE transactions SET category_id = 11 WHERE category_id = 10');
        console.log(`Updated ${upResult.changedRows} records from Category 10 to 11 (Pendapatan Retail ITNET).`);

        // 2. Identify existing sales that need HPP entries
        // We look for OUT transactions in inventory_logs (ID 1-4)
        const [logs] = await connection.query('SELECT * FROM inventory_logs WHERE id IN (1, 2, 3, 4)');
        
        for (const log of logs) {
            const hppAmount = Number(log.quantity) * Number(log.purchase_price);
            if (hppAmount > 0) {
                // Check if HPP transaction already exists to avoid double (though unlikely after reset)
                const [exists] = await connection.query('SELECT id FROM transactions WHERE notes LIKE ?', [`%[HPP] Modal Penjualan (Log ID:${log.id})%`]);
                
                if (exists.length === 0) {
                    await connection.query(
                        'INSERT INTO transactions (trx_date, type, category_id, amount, status, notes) VALUES (?, "expense", 28, ?, "completed", ?)',
                        [log.created_at, hppAmount, `[HPP] Modal Penjualan (Log ID:${log.id}): ${log.quantity} unit`]
                    );
                    console.log(`Created HPP entry for Log ID ${log.id}: Rp ${hppAmount}`);
                }
            }
        }

        console.log('--- REPAIR COMPLETED ---');

    } catch (err) {
        console.error('Repair Error:', err);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

repair();
