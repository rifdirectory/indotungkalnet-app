import db from './src/lib/db';
async function test() {
  try {
    const rows = await db.query('SELECT * FROM debts');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
test();
