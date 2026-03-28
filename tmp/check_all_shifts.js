const mysql = require('mysql2/promise');

async function checkAllShifts() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [rows] = await connection.execute(
            `SELECT es.date, s.name as shift_name 
             FROM employee_shifts es 
             JOIN shifts s ON es.shift_id = s.id 
             WHERE es.employee_id = 1
             ORDER BY es.date DESC`
        );
        console.log('All shift assignments for Arifin Ahmad:', JSON.stringify(rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkAllShifts();
