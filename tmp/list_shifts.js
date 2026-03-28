const mysql = require('mysql2/promise');

async function listShifts() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [shifts] = await connection.execute("SELECT * FROM shifts");
        console.log('Shifts found:', JSON.stringify(shifts, null, 2));

        const [employees] = await connection.execute("SELECT full_name, shift_id FROM employees WHERE id = 1");
        console.log('Employee 1 (Arifin Ahmad) default shift data:', employees);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

listShifts();
