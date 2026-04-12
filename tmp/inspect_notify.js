const mysql = require('mysql2/promise');

const poolConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db',
};

async function run() {
  const connection = await mysql.createConnection(poolConfig);
  try {
    console.log('--- Employees ---');
    const [employees] = await connection.query(
      "SELECT id, full_name, push_token FROM employees WHERE full_name LIKE ? OR full_name LIKE ?",
      ['%Arifin Ahmad%', '%Darrusalam%']
    );
    console.log(JSON.stringify(employees, null, 2));

    console.log('\n--- Recent Attendance Logs ---');
    const [logs] = await connection.query(
      "SELECT a.id, e.full_name, a.type, a.timestamp FROM attendance a JOIN employees e ON a.employee_id = e.id ORDER BY a.timestamp DESC LIMIT 10"
    );
    console.log(JSON.stringify(logs, null, 2));

    console.log('\n--- Duplicate Tokens ---');
    const [duplicates] = await connection.query(
      "SELECT push_token, COUNT(*) as count, GROUP_CONCAT(full_name) as names FROM employees WHERE push_token IS NOT NULL GROUP BY push_token HAVING count > 1"
    );
    console.log(JSON.stringify(duplicates, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
