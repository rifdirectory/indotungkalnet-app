const { query } = require('./src/lib/db');
async function run() {
    const res = await query('SELECT * FROM attendance ORDER BY timestamp DESC LIMIT 5');
    console.log(JSON.stringify(res, null, 2));
    const leaves = await query('SELECT id, type, start_date, end_date FROM leave_requests');
    console.log('Leaves:', JSON.stringify(leaves, null, 2));
}
run();
