import mysql from 'mysql2/promise';

async function checkSchema() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
  });

  try {
    const [positionsCols] = await conn.query('DESCRIBE positions');
    console.log('\n--- positions table ---');
    console.table(positionsCols);

    const [employeesCols] = await conn.query('DESCRIBE employees');
    console.log('\n--- employees table ---');
    console.table(employeesCols);

    const [productsCols] = await conn.query('DESCRIBE products');
    console.log('\n--- products table ---');
    console.table(productsCols);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await conn.end();
  }
}

checkSchema();
