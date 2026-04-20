import db from './src/lib/db';
async function test() {
  const [rows] = await db.query('SELECT * FROM debts');
  console.log('DEBTS:', rows);
  process.exit(0);
}
test();
