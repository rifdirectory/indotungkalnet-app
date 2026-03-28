const mysql = require('mysql2/promise');

async function checkDateEntries() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [rows] = await connection.execute(
            `SELECT date, employee_id, shift_id FROM employee_shifts`
        );
        console.log('Random entries from employee_shifts (raw dates):', JSON.stringify(rows.slice(0, 10), null, 2));

        const [lastEntries] = await connection.execute(
            `SELECT es.date, e.full_name, s.name as shift_name 
             FROM employee_shifts es
             JOIN employees e ON es.employee_id = e.id
             JOIN shifts s ON es.shift_id = s.id
             ORDER BY es.date DESC
             LIMIT 10`
        );
        console.log('Most recent shift assignments:', JSON.stringify(lastEntries, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkDateEntries();
