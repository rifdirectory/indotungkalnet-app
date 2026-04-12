import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'advance',
  database: process.env.DATABASE_NAME || 'indotungkal_db',
};

async function deleteAllTickets() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('Starting full deletion of all tickets...');

  try {
    // 1. Delete all ticket assignments first (child table)
    const [taRes]: any = await connection.execute(`DELETE FROM ticket_assignees`);
    console.log(`Deleted ${taRes.affectedRows} ticket assignment records.`);

    // 2. Delete all support tickets (parent table)
    const [tRes]: any = await connection.execute(`DELETE FROM support_tickets`);
    console.log(`Deleted ${tRes.affectedRows} support tickets.`);

    console.log('All tickets have been successfully deleted!');
  } catch (error) {
    console.error('Deletion failed:', error);
  } finally {
    await connection.end();
  }
}

deleteAllTickets();
