const mysql = require('mysql2/promise');

async function checkTime() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [rows] = await connection.execute("SELECT NOW() as db_now, @@global.time_zone, @@session.time_zone");
        console.log('Database Time Info:', JSON.stringify(rows, null, 2));
        console.log('Node.js Time:', new Date().toLocaleString());
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkTime();
