import db from '../src/lib/db';

async function run() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS performance_appraisals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        pic_id INT NOT NULL,
        period_month INT NOT NULL,
        period_year INT NOT NULL,
        attendance_percentage FLOAT DEFAULT 0,
        ticket_count INT DEFAULT 0,
        avg_resolution_time_minutes FLOAT DEFAULT 0,
        pic_rating ENUM('BAD', 'GOOD') NOT NULL,
        pic_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_appraisal (employee_id, period_month, period_year),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (pic_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await db.query(createTableQuery);
    console.log("Table 'performance_appraisals' created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating table:", err);
    process.exit(1);
  }
}

run();
