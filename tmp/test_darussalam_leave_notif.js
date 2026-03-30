import { sendExpoPushNotification } from '../src/lib/notifications.ts';

async function run() {
  const token = 'ExponentPushToken[00yoHAMr8R3bZ_15noGYH0]';
  const type = 'Cuti Tahunan';
  const statusLabel = 'Disetujui';
  
  const title = `Permohonan ${type} ${statusLabel}`;
  const body = `Permohonan ${type} Anda telah ${statusLabel.toLowerCase()} oleh PIC.`;
  const data = { 
    type: 'leave_status', 
    status: 'approved',
    leave_type: type,
    timestamp: new Date().toISOString() 
  };

  console.log('Sending leave status notification to M. Darussalam...');
  try {
    const result = await sendExpoPushNotification([token], title, body, data);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}

run();
