const { query } = require('../src/lib/db');
async function run() {
  const columns = await query('SHOW COLUMNS FROM employees');
  console.log(JSON.stringify(columns, null, 2));
}
run();
