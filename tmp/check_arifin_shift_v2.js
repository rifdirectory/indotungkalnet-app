const mysql = require('mysql2/promise');

async function checkShift() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db'
    });

    try {
        const [employees] = await connection.execute(
            "SELECT id, full_name FROM employees WHERE full_name LIKE '%Arifin%'"
        );
        console.log('Employees found:', employees);

        if (employees.length > 0) {
            const employeeId = employees[0].id;
            const targetDate = '2026-03-29';
            
            const [shifts] = await connection.execute(
                `SELECT es.date, s.name as shift_name, s.start_time, s.end_time 
                 FROM employee_shifts es 
                 JOIN shifts s ON es.shift_id = s.id 
                 WHERE es.employee_id = ? AND es.date = ?`,
                [employeeId, targetDate]
            );
            console.log(`Shifts for ${employees[0].full_name} on ${targetDate}:`, shifts);
            
            const [allShifts] = await connection.execute(
                `SELECT es.date, s.name as shift_name FROM employee_shifts es JOIN shifts s ON es.shift_id = s.id WHERE es.employee_id = ?`,
                [employeeId]
            );
            console.log(`All shifts for ${employees[0].full_name}:`, JSON.stringify(allShifts, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkShift();
