const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1].trim()] = value;
  }
});

async function checkAdmin() {
  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST || 'localhost',
    port: parseInt(env.DATABASE_PORT || '3306'),
    user: env.DATABASE_USER || 'root',
    password: env.DATABASE_PASSWORD || '',
    database: env.DATABASE_NAME || 'indotungkal_db',
  });

  try {
    console.log('Checking database:', env.DATABASE_NAME);
    
    // Check if users table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('Error: "users" table does not exist!');
      return;
    }

    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (rows.length === 0) {
      console.log('Error: "admin" user not found in "users" table!');
      
      // List all users to see what's there
      const [allUsers] = await connection.query('SELECT username, role FROM users');
      console.log('Available users:', allUsers);
    } else {
      console.log('Admin user found:', {
        id: rows[0].id,
        username: rows[0].username,
        role: rows[0].role,
        has_password: !!rows[0].password_hash,
        password_hash: rows[0].password_hash
      });
    }
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdmin();
