import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db',
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [attCount]: any = await connection.execute('SELECT COUNT(*) as count FROM attendance WHERE DATE(timestamp) BETWEEN "2026-04-01" AND "2026-04-30"');
    console.log(`Attendance records for April 2026: ${attCount[0].count}`);

    const [shiftCount]: any = await connection.execute('SELECT COUNT(*) as count FROM employee_shifts WHERE date BETWEEN "2026-04-01" AND "2026-04-30"');
    console.log(`Shift records for April 2026: ${shiftCount[0].count}`);

    const [leaveCount]: any = await connection.execute('SELECT COUNT(*) as count FROM leave_requests WHERE start_date BETWEEN "2026-04-01" AND "2026-04-30"');
    console.log(`Leave records for April 2026: ${leaveCount[0].count}`);

    const [appraisalCount]: any = await connection.execute('SELECT COUNT(*) as count FROM daily_appraisals WHERE date BETWEEN "2026-04-01" AND "2026-04-30"');
    console.log(`Appraisal records for April 2026: ${appraisalCount[0].count}`);

  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await connection.end();
  }
}

check();
