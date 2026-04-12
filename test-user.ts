import { query } from './src/lib/db';

async function check() {
  try {
    const users = await query('SELECT * FROM users WHERE username = ?', ['darusalasm']);
    console.log('User found:', users);
    if (users.length > 0) {
        const employees = await query('SELECT * FROM employees WHERE user_id = ?', [users[0].id]);
        console.log('Employee found:', employees);
    } else {
        console.log('User darusalasm NOT FOUND in users table');
    }
  } catch (err) {
    console.error('DB Error:', err);
  }
  process.exit();
}

check();
