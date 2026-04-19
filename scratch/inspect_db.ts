import db from './src/lib/db.ts';

async function inspect() {
  try {
    const roles = await db.query('SELECT DISTINCT position FROM employees');
    console.log('ROLES:', JSON.stringify(roles, null, 2));
    
    // Check if permissions table exists or what tables we have
    const tables = await db.query('SHOW TABLES');
    console.log('TABLES:', JSON.stringify(tables, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

inspect();
