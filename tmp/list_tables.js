const db = require('./src/lib/db').default;

async function run() {
  try {
    const tables = await db.query("SHOW TABLES");
    console.log(JSON.stringify(tables, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
