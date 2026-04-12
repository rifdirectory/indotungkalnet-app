import { sendExpoPushNotification } from '../src/lib/notifications';
import db from '../src/lib/db';

async function testNotification(employeeName: string) {
  try {
    const employees: any = await db.query(
      'SELECT id, full_name, push_token FROM employees WHERE full_name LIKE ?',
      [`%${employeeName}%`]
    );

    if (employees.length === 0) {
      console.log(`No employee found with name: ${employeeName}`);
      return;
    }

    const employee = employees[0];
    if (!employee.push_token) {
      console.log(`Employee ${employee.full_name} (ID: ${employee.id}) does not have a push token.`);
      
      // Check if there are ANY tokens to test with
      const anyToken: any = await db.query('SELECT full_name, push_token FROM employees WHERE push_token IS NOT NULL LIMIT 1');
      if (anyToken.length > 0) {
          console.log(`Found a token for ${anyToken[0].full_name}. Using it for test instead.`);
          await sendExpoPushNotification(
              [anyToken[0].push_token],
              'Tes Notifikasi ITNET 🚀',
              `Halo ${employeeName}, ini adalah pesan tes dari sistem ISP Management.`,
              { test: true, target: employeeName }
          );
          console.log('Test notification sent to available token!');
      } else {
          console.log('No push tokens found in the database. Please log in to the mobile app first.');
      }
      return;
    }

    console.log(`Sending notification to ${employee.full_name}...`);
    await sendExpoPushNotification(
        [employee.push_token],
        'Tes Notifikasi ITNET 🚀',
        `Halo ${employeeName}, ini adalah pesan tes dari sistem ISP Management.`,
        { test: true }
    );
    console.log('Notification sent successfully!');
  } catch (error) {
    console.error('Error sending test notification:', error);
  } finally {
    process.exit(0);
  }
}

const targetName = process.argv[2] || 'Arifin Ahmad';
testNotification(targetName);
