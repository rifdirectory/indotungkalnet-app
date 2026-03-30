import { sendExpoPushNotification } from '../src/lib/notifications.ts';

async function run() {
  const token = 'ExponentPushToken[00yoHAMr8R3bZ_15noGYH0]';
  const title = '🔔 ITNET System Test';
  const body = 'Halo Pak Darussalam, ini adalah tes notifikasi sistem ITNET Mobile.';
  const data = { type: 'test', time: new Date().toISOString() };

  console.log('Sending notification to M. Darussalam...');
  try {
    const result = await sendExpoPushNotification([token], title, body, data);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}

run();
