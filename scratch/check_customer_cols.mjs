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
        const [cols] = await connection.query('DESCRIBE customers');
        console.table(cols);
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

check();
