const mysql = require('mysql2/promise');

async function checkAttendanceSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [rows] = await connection.execute("DESCRIBE attendance");
        console.log('Attendance table schema:', JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkAttendanceSchema();
