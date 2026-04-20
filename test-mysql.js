import db from './src/lib/db.js';
db.query("SELECT id, name FROM transaction_categories").then(res => { console.log(JSON.stringify(res)); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })
