const db = require('./src/lib/db').default;

async function checkConnections() {
  try {
    const rows = await db.query('SHOW STATUS WHERE `variable_name` = "Threads_connected"');
    console.log(JSON.stringify(rows, null, 2));
    const max = await db.query('SHOW VARIABLES LIKE "max_connections"');
    console.log(JSON.stringify(max, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkConnections();
