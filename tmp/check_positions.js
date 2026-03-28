const mysql = require('mysql2/promise');

async function checkPositions() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [rows] = await connection.execute("SELECT id, name FROM positions");
        console.log('Positions List:', JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkPositions();
