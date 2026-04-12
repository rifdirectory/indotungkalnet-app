import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'advance',
  database: process.env.DATABASE_NAME || 'indotungkal_db',
};

async function cleanup() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('Starting cleanup of dummy data...');

  try {
    // 1. Delete Attendance for April 2026
    const [attRes]: any = await connection.execute(
      `DELETE FROM attendance WHERE DATE(timestamp) BETWEEN '2026-04-01' AND '2026-04-30'`
    );
    console.log(`Deleted ${attRes.affectedRows} attendance records.`);

    // 2. Delete Daily Appraisals for April 2026
    const [appRes]: any = await connection.execute(
      `DELETE FROM daily_appraisals WHERE date BETWEEN '2026-04-01' AND '2026-04-30'`
    );
    console.log(`Deleted ${appRes.affectedRows} appraisal records.`);

    // 3. Delete Dummy Tickets and Assignees
    const [taRes]: any = await connection.execute(
      `DELETE FROM ticket_assignees WHERE ticket_id IN (SELECT id FROM support_tickets WHERE description LIKE '%Dummy ticket%')`
    );
    console.log(`Deleted ${taRes.affectedRows} ticket assignment records.`);

    const [tRes]: any = await connection.execute(
      `DELETE FROM support_tickets WHERE description LIKE '%Dummy ticket%'`
    );
    console.log(`Deleted ${tRes.affectedRows} dummy tickets.`);

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await connection.end();
  }
}

cleanup();
