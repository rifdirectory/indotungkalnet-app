const mysql = require('mysql2/promise');

async function listTables() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [rows] = await connection.execute("SHOW TABLES");
        console.log('Tables in indotungkal_db:', JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

listTables();
