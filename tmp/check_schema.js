const mysql = require('mysql2/promise');

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [rows] = await connection.execute("DESCRIBE employees");
        console.log('Employees table schema:', JSON.stringify(rows, null, 2));

        const [config] = await connection.execute("SELECT * FROM settings");
        console.log('Settings table found:', JSON.stringify(config, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkSchema();
