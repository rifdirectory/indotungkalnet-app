const mysql = require('mysql2/promise');

async function createTrackingTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        console.log('Creating location_tracking table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS location_tracking (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (employee_id),
                INDEX (timestamp)
            )
        `);
        console.log('Table created successfully.');
    } catch (err) {
        console.error('Failed to create table:', err);
    } finally {
        await connection.end();
    }
}

createTrackingTable();
