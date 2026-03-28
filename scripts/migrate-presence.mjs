import mysql from 'mysql2/promise';

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
  });

  try {
    console.log('🚀 Creating shifts table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        color VARCHAR(20) DEFAULT '#0a84ff'
      )
    `);

    console.log('🚀 Creating employee_shifts table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS employee_shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        shift_id INT NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee_id (employee_id),
        INDEX idx_date (date),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
      )
    `);

    console.log('🚀 Creating attendance table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        type ENUM('clock_in', 'clock_out') NOT NULL,
        photo_url TEXT,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        status ENUM('on_time', 'late', 'early', 'overtime') DEFAULT 'on_time',
        note TEXT,
        INDEX idx_emp_time (employee_id, timestamp),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Insert default shifts
    const [existingShifts] = await conn.query('SELECT COUNT(*) as count FROM shifts');
    if (existingShifts[0].count === 0) {
      console.log('🚀 Inserting default shifts...');
      await conn.query(`
        INSERT INTO shifts (name, start_time, end_time, color) VALUES 
        ('Pagi', '08:00:00', '17:00:00', '#0a84ff'),
        ('Sore', '16:00:00', '00:00:00', '#f59e0b'),
        ('Malam', '00:00:00', '08:00:00', '#6366f1'),
        ('Full Day', '08:00:00', '20:00:00', '#10b981')
      `);
    }

    console.log('✅ Presence migration complete!');
  } catch (err) {
    console.error('❌ Presence migration failed:', err);
  } finally {
    await conn.end();
  }
}

migrate();
