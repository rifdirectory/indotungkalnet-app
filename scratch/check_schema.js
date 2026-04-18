const db = require('./src/lib/db');

async function checkSchema() {
  try {
    console.log('--- DEBTS TABLE ---');
    const debts = await db.query('DESCRIBE debts');
    console.table(debts);

    console.log('\n--- INVENTORY_LOGS TABLE ---');
    const logs = await db.query('DESCRIBE inventory_logs');
    console.table(logs);

    console.log('\n--- CUSTOMERS TABLE ---');
    const customers = await db.query('DESCRIBE customers');
    console.table(customers);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
