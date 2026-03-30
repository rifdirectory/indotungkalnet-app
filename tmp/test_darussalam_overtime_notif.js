import { sendExpoPushNotification } from '../src/lib/notifications.ts';

async function run() {
  const token = 'ExponentPushToken[00yoHAMr8R3bZ_15noGYH0]';
  const statusLabel = 'Disetujui';
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  
  const title = `Lembur ${statusLabel}`;
  const body = `Permohonan lembur Anda (${dateStr}) telah ${statusLabel.toLowerCase()} oleh PIC.`;
  const data = { 
    type: 'overtime_status', 
    status: 'approved',
    date: dateStr,
    timestamp: new Date().toISOString() 
  };

  console.log('Sending overtime status notification to M. Darussalam...');
  try {
    const result = await sendExpoPushNotification([token], title, body, data);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}

run();
