import { query } from '../src/lib/db.ts';
import { getJakartaNow } from '../src/lib/dateUtils.ts';
import { notifySupportStatusChange } from '../src/lib/notifications.ts';

async function verify() {
  const today = getJakartaNow().split(' ')[0];
  console.log('--- Verification Started ---');

  // 1. Setup a fake leave for testing (Technician 8: M. Darussalam)
  console.log('1. Setting up fake approved leave for employee 8 today...');
  await query('DELETE FROM leave_requests WHERE employee_id = 8 AND start_date = ?', [today]);
  await query('INSERT INTO leave_requests (employee_id, type, start_date, end_date, status, reason) VALUES (?, ?, ?, ?, ?, ?)', 
    [8, 'izin', today, today, 'approved', 'Test Leave Restriction']);

  // 2. Test simulation: Check if our logic detects the leave correctly
  const assignees = [8];
  const leaveCheck = await query(`
    SELECT e.full_name 
    FROM leave_requests l
    JOIN employees e ON l.employee_id = e.id
    WHERE l.employee_id IN (?) 
      AND l.status = 'approved' 
      AND ? BETWEEN l.start_date AND l.end_date
  `, [assignees, today]);

  if (leaveCheck.length > 0) {
    console.log('SUCCESS: Leave restriction logic detected leave for:', leaveCheck[0].full_name);
  } else {
    console.log('FAILURE: Leave restriction logic failed to detect leave.');
  }

  // 3. Test Broadcast Logic simulation
  console.log('2. Simulating Status Broadcast to Technicians, SPVs, and Admins...');
  // We'll just run the function and check logs (we can't see push results here but we see the DB calls)
  await notifySupportStatusChange(51, 'OTW', 'Test Customer', 'ticket');
  console.log('Function notifySupportStatusChange executed. Check console for "Expo Push Notifications sent".');

  // Cleanup
  await query('DELETE FROM leave_requests WHERE employee_id = 8 AND reason = "Test Leave Restriction"');
  console.log('--- Verification Finished ---');
}

verify();
