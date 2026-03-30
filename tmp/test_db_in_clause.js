import { query } from '../src/lib/db.ts';

async function test() {
  try {
    // Testing IN clause with array expansion
    console.log('Testing IN clause with [8, 1, 2]...');
    const res = await query('SELECT id, full_name FROM employees WHERE id IN (?)', [[8, 1, 2]]);
    console.log('Found Employees:', JSON.stringify(res, null, 2));
    
    if (Array.isArray(res) && res.length > 0) {
      console.log('SUCCESS: Array expansion working!');
    } else {
      console.log('FAILURE: Array expansion did not return results.');
    }
  } catch (err) {
    console.error('Test Error:', err);
  }
}

test();
