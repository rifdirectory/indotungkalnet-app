const mysql = require('mysql2/promise');

async function checkShiftsSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [rows] = await connection.execute("DESCRIBE employee_shifts");
        console.log('employee_shifts schema:', JSON.stringify(rows, null, 2));

        const [data] = await connection.execute(
            `SELECT * FROM employee_shifts WHERE employee_id = 1`
        );
        console.log('Raw data from employee_shifts (id: 1):', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkShiftsSchema();
