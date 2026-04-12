import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'advance',
  database: process.env.DATABASE_NAME || 'indotungkal_db',
};

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('--- STARTING DATABASE MIGRATION (BREAK MANAGEMENT) ---');

  try {
    // 1. Add break columns to shifts table
    console.log('Updating shifts table...');
    const [cols]: any = await connection.execute('DESC shifts');
    const columnNames = cols.map((c: any) => c.Field);
    
    if (!columnNames.includes('break_start')) {
      await connection.execute("ALTER TABLE shifts ADD COLUMN break_start TIME DEFAULT '12:00:00' AFTER end_time");
      console.log('Added break_start column.');
    }
    if (!columnNames.includes('break_end')) {
      await connection.execute("ALTER TABLE shifts ADD COLUMN break_end TIME DEFAULT '13:00:00' AFTER break_start");
      console.log('Added break_end column.');
    }

    // 2. Update attendance types (If its an ENUM, we need to redefine it)
    console.log('Updating attendance table types...');
    // Note: Assuming 'type' is a varchar or enum. Looking at previous experiments, it's used as 'clock_in', 'clock_out'.
    // Let's ensure it can accept 'break_in', 'break_out'.
    const [attCols]: any = await connection.execute('DESC attendance');
    const typeCol = attCols.find((c: any) => c.Field === 'type');
    
    if (typeCol.Type.includes('enum')) {
      // If it's an enum, we expand it. 
      // Need to find existing values first or just use a comprehensive list.
      await connection.execute("ALTER TABLE attendance MODIFY COLUMN type ENUM('clock_in', 'clock_out', 'break_out', 'break_in') NOT NULL");
      console.log('Updated attendance type enum.');
    } else {
      console.log('Attendance type is not an ENUM, skipping modification.');
    }

    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();
