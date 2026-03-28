const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'advance',
        database: 'indotungkal_db',
        port: 3306 // Mapping might be different inside docker? No, I'll run inside docker.
    });

    console.log('Fetching employees...');
    const [employees] = await connection.execute('SELECT id, password FROM employees');
    
    for (const emp of employees) {
        if (emp.password && emp.password.length < 20) { // Simple check to see if it's already hashed
            console.log(`Hashing password for employee ID: ${emp.id}`);
            const hashedPassword = await bcrypt.hash(emp.password, 10);
            await connection.execute('UPDATE employees SET password = ? WHERE id = ?', [hashedPassword, emp.id]);
        }
    }

    console.log('Migration complete.');
    await connection.end();
}

migrate().catch(console.error);
