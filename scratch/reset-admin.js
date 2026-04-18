const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

async function resetAdmin() {
  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST || 'localhost',
    port: parseInt(env.DATABASE_PORT || '3306'),
    user: env.DATABASE_USER || 'root',
    password: env.DATABASE_PASSWORD || '',
    database: env.DATABASE_NAME || 'indotungkal_db',
  });

  try {
    const newPassword = 'advance';
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [passwordHash, 'admin']
    );
    
    console.log(`✅ Admin password has been reset to: ${newPassword}`);
  } catch (error) {
    console.error('Error resetting password:', error.message);
  } finally {
    await connection.end();
  }
}

resetAdmin();
