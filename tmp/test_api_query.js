const mysql = require('mysql2/promise');

async function testApiQuery() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const employeeId = '1';
        const jakartaDate = '2026-03-29';

        console.log(`Searching for employee_id: ${employeeId}, date: ${jakartaDate}`);

        const [rows] = await connection.execute(`
            SELECT s.name as shift_name, s.start_time, s.end_time, s.color
            FROM employee_shifts es
            JOIN shifts s ON es.shift_id = s.id
            WHERE es.employee_id = ? AND es.date = ?
            LIMIT 1
        `, [employeeId, jakartaDate]);

        console.log('Query result:', rows);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

testApiQuery();
