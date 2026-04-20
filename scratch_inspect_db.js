const db = require('./src/lib/db').default;

async function inspect() {
  try {
    console.log('--- CUSTOMERS COLUMNS ---');
    const custCols = await db.query("SHOW COLUMNS FROM customers");
    console.log(custCols);

    console.log('\n--- SUBSCRIPTIONS COLUMNS ---');
    try {
        const subCols = await db.query("SHOW COLUMNS FROM subscriptions");
        console.log(subCols);
    } catch (e) {
        console.log('Subscriptions table does not exist or error:', e.message);
    }

    console.log('\n--- PLANS/PRODUCTS COLUMNS ---');
    try {
        const productCols = await db.query("SHOW COLUMNS FROM products");
        console.log(productCols);
    } catch (e) {
         try {
             const planCols = await db.query("SHOW COLUMNS FROM plans");
             console.log(planCols);
         } catch (ee) {
             console.log('Neither products nor plans table exist.');
         }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
