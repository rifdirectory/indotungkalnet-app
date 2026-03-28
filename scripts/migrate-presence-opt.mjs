import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
};

async function migrate() {
    const conn = await mysql.createConnection(dbConfig);
    try {
        console.log('Adding use_presence column to positions table...');
        // First check if column exists (MySQL 8+ support)
        const [columns] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'indotungkal_db' 
            AND TABLE_NAME = 'positions' 
            AND COLUMN_NAME = 'use_presence'
        `);

        if (columns.length === 0) {
            await conn.query(`
                ALTER TABLE positions 
                ADD COLUMN use_presence TINYINT(1) DEFAULT 1
            `);
            console.log('Added use_presence column.');
        } else {
            console.log('use_presence column already exists.');
        }

        console.log('Ensuring "Normal Day" shift exists...');
        const [shifts] = await conn.query('SELECT id FROM shifts WHERE name = "Normal Day"');
        if (shifts.length === 0) {
            await conn.query(`
                INSERT INTO shifts (name, start_time, end_time, color) 
                VALUES ("Normal Day", "08:00:00", "17:00:00", "#4caf50")
            `);
            console.log('Created "Normal Day" shift.');
        } else {
            console.log('"Normal Day" shift already exists.');
        }

        console.log('Migration successful.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await conn.end();
    }
}

migrate();
