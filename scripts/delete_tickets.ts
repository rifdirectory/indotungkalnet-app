import db from './src/lib/db';

async function deleteAllTickets() {
  try {
    await db.query('DELETE FROM support_tickets');
    console.log('Successfully deleted all tickets');
  } catch (err) {
    console.error('Error deleting tickets:', err);
  } finally {
    process.exit();
  }
}

deleteAllTickets();
