import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'advance',
  database: process.env.DATABASE_NAME || 'indotungkal_db',
};

const YEAR = 2026;
const MONTH = 4; // April

async function seed() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('Fetching all active employees...');

  try {
    const [employees]: any = await connection.execute('SELECT id FROM employees WHERE status = "active"');
    const allIds = employees.map((e: any) => e.id);
    console.log(`Found ${allIds.length} active employees. Populating April 2026...`);

    // 1. Cleanup existing April 2026 data for these employees
    console.log('Cleaning up April 2026 data...');
    await connection.execute(
      `DELETE FROM attendance WHERE DATE(timestamp) BETWEEN '${YEAR}-${MONTH}-01' AND '${YEAR}-${MONTH}-30'`
    );
    await connection.execute(
      `DELETE FROM daily_appraisals WHERE date BETWEEN '${YEAR}-${MONTH}-01' AND '${YEAR}-${MONTH}-30'`
    );
    await connection.execute(
      `DELETE FROM ticket_assignees WHERE ticket_id IN (SELECT id FROM support_tickets WHERE description LIKE '%Dummy ticket%')`
    );
    await connection.execute(
      `DELETE FROM support_tickets WHERE description LIKE '%Dummy ticket%'`
    );

    // 2. Persona Distribution
    for (let i = 0; i < allIds.length; i++) {
      const id = allIds[i];
      let persona = 'Reliable';
      if (i < 4) persona = 'Elite';
      else if (i >= 8 && i < 12) persona = 'Late';
      else if (i >= 12) persona = 'Poor';

      console.log(`Seeding Employee ID ${id} as persona: ${persona}`);

      for (let day = 1; day <= 30; day++) {
        const dateStr = `${YEAR}-${String(MONTH).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const date = new Date(dateStr);
        
        // Skip Sundays (0) and National Holidays / Cuti Bersama for April 2026 (Official SKB)
        const holidays = ['2026-04-03', '2026-04-05'];
        if (date.getDay() === 0 || holidays.includes(dateStr)) continue; 

        // --- ATTENDANCE ---
        let clockInTime = '07:55:00';
        let status = 'on_time';
        let skipDay = false;

        if (persona === 'Reliable' && day % 15 === 0) skipDay = true; // Skip 2 days
        if (persona === 'Late') {
          if (day % 2 === 0) {
            clockInTime = '08:45:00';
            status = 'late';
          }
        }
        if (persona === 'Poor') {
          if (day % 3 === 0) skipDay = true; // Skip many days
          if (!skipDay && day % 2 === 0) {
            clockInTime = '09:50:00';
            status = 'late';
          }
        }

        if (!skipDay) {
          await connection.execute(
            `INSERT INTO attendance (employee_id, type, status, timestamp, location_lat, location_lng) VALUES (?, 'clock_in', ?, ?, 0, 0)`,
            [id, status, `${dateStr} ${clockInTime}`]
          );
          await connection.execute(
            `INSERT INTO attendance (employee_id, type, status, timestamp, location_lat, location_lng) VALUES (?, 'clock_out', 'on_time', ?, 0, 0)`,
            [id, `${dateStr} 16:05:00`]
          );
        }

        // --- APPRAISALS ---
        if (persona === 'Elite' && day % 2 === 0) {
           await connection.execute(
            `INSERT INTO daily_appraisals (employee_id, pic_id, date, rating, notes) VALUES (?, 1, ?, 'GOOD', 'Luar biasa, sangat membantu.')`,
            [id, dateStr]
          );
        }
        if (persona === 'Reliable' && day % 7 === 0) {
           await connection.execute(
            `INSERT INTO daily_appraisals (employee_id, pic_id, date, rating, notes) VALUES (?, 1, ?, 'GOOD', 'Bagus, teruskan.')`,
            [id, dateStr]
          );
        }
        if (persona === 'Poor' && day % 10 === 0) {
           await connection.execute(
            `INSERT INTO daily_appraisals (employee_id, pic_id, date, rating, notes) VALUES (?, 1, ?, 'BAD', 'Sering menghilang saat dibutuhkan.')`,
            [id, dateStr]
          );
        }
      }

      // --- TICKETS ---
      let ticketDiff = 'Low';
      let duration = 30; // mins
      let count = 10;

      if (persona === 'Reliable') { count = 8; duration = 50; }
      if (persona === 'Late') { count = 6; duration = 90; ticketDiff = 'Medium'; }
      if (persona === 'Poor') { count = 3; duration = 300; ticketDiff = 'Medium'; }

      for (let t = 0; t < count; t++) {
        const start = `${YEAR}-04-10 10:00:00`;
        // Use a simple local date addition or string format to avoid UTC mismatch
        const resolveHour = 10 + Math.floor(duration / 60);
        const resolveMin = duration % 60;
        const end = `${YEAR}-04-10 ${String(resolveHour).padStart(2, '0')}:${String(resolveMin).padStart(2, '0')}:00`;
        
        const [res]: any = await connection.execute(
          `INSERT INTO support_tickets (customer_name, subject, description, status, difficulty, working_at, resolved_at) 
           VALUES (?, ?, ?, 'Resolved', ?, ?, ?)`,
          ['Dummy Customer', `Test Ticket ${persona} ${t}`, 'Dummy ticket for testing efficiency', ticketDiff, start, end]
        );
        await connection.execute(`INSERT INTO ticket_assignees (ticket_id, employee_id) VALUES (?, ?)`, [res.insertId, id]);
      }
    }

    console.log('Seeding completed successfully for all employees!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await connection.end();
  }
}

seed();
