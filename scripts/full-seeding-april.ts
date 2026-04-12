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
  console.log('--- STARTING FULL APRIL 2026 SEEDING ---');

  try {
    const [employees]: any = await connection.execute('SELECT id, full_name FROM employees WHERE status = "active"');
    const allIds = employees.map((e: any) => e.id);
    console.log(`Found ${allIds.length} active employees.`);

    // 1. CLEANUP
    console.log('Cleaning up existing April 2026 data...');
    await connection.execute(`DELETE FROM attendance WHERE DATE(timestamp) BETWEEN '${YEAR}-04-01' AND '${YEAR}-04-30'`);
    await connection.execute(`DELETE FROM daily_appraisals WHERE date BETWEEN '${YEAR}-04-01' AND '${YEAR}-04-30'`);
    await connection.execute(`DELETE FROM employee_shifts WHERE date BETWEEN '${YEAR}-04-01' AND '${YEAR}-04-30'`);
    await connection.execute(`DELETE FROM leave_requests WHERE start_date BETWEEN '${YEAR}-04-01' AND '${YEAR}-04-30'`);

    const holidays = [`${YEAR}-04-03`]; // Good Friday

    // 2. SEED SHIFTS (Everyone gets Shift 4 for workdays)
    console.log('Seeding Shifts & Updating Break Times...');
    // Update shift 4 to have break times
    await connection.execute("UPDATE shifts SET break_start='12:00:00', break_end='13:00:00' WHERE id=4");
    
    for (let day = 1; day <= 30; day++) {
      const dateStr = `${YEAR}-04-${String(day).padStart(2, '0')}`;
      const date = new Date(dateStr);
      if (date.getDay() === 0 || holidays.includes(dateStr)) continue; // Skip Sunday/Holiday

      for (const empId of allIds) {
        await connection.execute(
          'INSERT INTO employee_shifts (employee_id, shift_id, date) VALUES (?, 4, ?)',
          [empId, dateStr]
        );
      }
    }

    // 3. PRE-SEED LEAVES
    console.log('Seeding random leaves...');
    const leaveTypes: any[] = ['cuti', 'izin', 'sakit'];
    const reasons: string[] = [
      'Acara Keluarga', 
      'Demam & Flu', 
      'Urusan Bank', 
      'Pernikahan Saudara', 
      'Check-up Kesehatan', 
      'Kendaraan Mogok',
      'Urusan Sekolah Anak'
    ];
    const employeeLeaves: Record<number, Set<string>> = {};

    for (let k = 0; k < 8; k++) {
      const empId = allIds[Math.floor(Math.random() * allIds.length)];
      const startDay = 8 + (k * 3);
      const start = `${YEAR}-04-${String(startDay).padStart(2, '0')}`;
      const end = `${YEAR}-04-${String(startDay + 1).padStart(2, '0')}`;
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      
      await connection.execute(
        'INSERT INTO leave_requests (employee_id, start_date, end_date, type, reason, status) VALUES (?, ?, ?, ?, ?, "approved")',
        [empId, start, end, leaveTypes[k % 3], reason]
      );

      if (!employeeLeaves[empId]) employeeLeaves[empId] = new Set();
      employeeLeaves[empId].add(start);
      employeeLeaves[empId].add(end);
    }

    // 4. SEED ATTENDANCE & APPRAISALS (Persona Based)
    console.log('Seeding Attendance & Appraisals...');
    for (let i = 0; i < allIds.length; i++) {
      const id = allIds[i];
      let persona = 'Reliable';
      if (i % 5 === 0) persona = 'Elite';
      else if (i % 5 === 1) persona = 'Reliable';
      else if (i % 5 === 2) persona = 'Late';
      else if (i % 5 === 3) persona = 'Poor';
      else persona = 'Reliable';

      for (let day = 1; day <= 30; day++) {
        const dateStr = `${YEAR}-04-${String(day).padStart(2, '0')}`;
        const date = new Date(dateStr);
        const isRed = date.getDay() === 0 || holidays.includes(dateStr);

        // Check if on leave
        const onLeave = employeeLeaves[id]?.has(dateStr);

        // Random Skip (Alpa)
        let skipDay = false;
        if (!isRed && !onLeave) {
            if (persona === 'Poor' && day % 4 === 0) skipDay = true;
            if (persona === 'Late' && day % 12 === 0) skipDay = true;
        }

        if (!isRed && !skipDay && !onLeave) {
          // --- MORNING ---
          let clockInTime = '07:50:00';
          let status = 'on_time';

          if (persona === 'Late' && day % 2 === 0) {
            clockInTime = '08:45:00';
            status = 'late';
          }
          if (persona === 'Poor' && day % 3 === 0) {
            clockInTime = '10:15:00';
            status = 'late';
          }

          await connection.execute(
            `INSERT INTO attendance (employee_id, type, status, timestamp, location_lat, location_lng) VALUES (?, 'clock_in', ?, ?, 0, 0)`,
            [id, status, `${dateStr} ${clockInTime}`]
          );

          // --- LUNCH BREAK (Auto Break-out, only manual Break-in) ---
          // Break In (~13:00ish)
          let breakInTime = '12:58:00';
          if (persona === 'Poor' && day % 2 === 0) breakInTime = '13:45:00'; // Late from break
          if (persona === 'Late' && day % 4 === 0) breakInTime = '13:15:00'; // Late from break
          
          await connection.execute(
            `INSERT INTO attendance (employee_id, type, status, timestamp, location_lat, location_lng) VALUES (?, 'break_in', 'on_time', ?, 0, 0)`,
            [id, `${dateStr} ${breakInTime}`]
          );

          // --- OUT ---
          await connection.execute(
            `INSERT INTO attendance (employee_id, type, status, timestamp, location_lat, location_lng) VALUES (?, 'clock_out', 'on_time', ?, 0, 0)`,
            [id, `${dateStr} 16:30:00`]
          );

          // --- APPRAISAL ---
          if (day % 10 === 0) {
            const rating = status === 'late' || persona === 'Poor' ? 'BAD' : 'GOOD';
            const notes = rating === 'GOOD' ? 'Kerja bagus hari ini.' : 'Sering terlambat, tolong diperbaiki.';
            await connection.execute(
              'INSERT INTO daily_appraisals (employee_id, pic_id, date, rating, notes) VALUES (?, 1, ?, ?, ?)',
              [id, dateStr, rating, notes]
            );
          }
        }
      }
    }

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await connection.end();
  }
}

seed();
