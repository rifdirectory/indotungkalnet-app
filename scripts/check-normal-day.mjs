import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
};

async function check() {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query("SELECT * FROM shifts WHERE name = 'Normal Day'");
    console.log(JSON.stringify(rows));
    await conn.end();
}

check();
