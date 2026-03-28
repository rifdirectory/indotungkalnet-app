const db = require('../src/lib/db').default;

async function checkData() {
  try {
    const rows = await db.query('SELECT id, subject, status, created_at, otw_at FROM support_tickets ORDER BY id DESC LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
