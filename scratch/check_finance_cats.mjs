import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'advance',
  database: 'indotungkal_db'
};

async function check() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT id, name FROM finance_categories WHERE type = "income"');
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

check();
