import db from '../src/lib/db';

async function run() {
  try {
    // Drop old table if exists (since we are refactoring to daily)
    await db.query(`DROP TABLE IF EXISTS performance_appraisals`);
    console.log("Old table 'performance_appraisals' dropped.");

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS daily_appraisals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        pic_id INT NOT NULL,
        date DATE NOT NULL,
        rating ENUM('BAD', 'GOOD') NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_daily (employee_id, date),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (pic_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await db.query(createTableQuery);
    console.log("Table 'daily_appraisals' created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating table:", err);
    process.exit(1);
  }
}

run();
