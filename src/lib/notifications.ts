/**
 * Utility to send push notifications using Expo Push Service
 * Compatible with Android and iOS devices running the Expo-based app.
 */
export async function sendExpoPushNotification(tokens: string[], title: string, body: string, data: any = {}) {
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Expo Push Notifications sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending Expo Push Notification:', error);
    throw error;
  }
}

/**
 * Broadcast status change notifications to Technicians, SPVs, and Support Admins
 */
export async function notifySupportStatusChange(ticketId: string | number, newStatus: string, customerName: string, type: 'ticket' | 'manual' = 'ticket') {
  try {
      const db = (await import('./db')).default;
      
      // 1. Get Assigned Technicians
      const assigneeTable = type === 'ticket' ? 'ticket_assignees' : 'task_assignees';
      const idField = type === 'ticket' ? 'ticket_id' : 'task_id';
      
      const technicians: any = await db.query(`
          SELECT e.push_token 
          FROM employees e
          JOIN ${assigneeTable} a ON e.id = a.employee_id
          WHERE a.${idField} = ? AND e.push_token IS NOT NULL
      `, [ticketId]);

      // 2. Get SPV Office and Support Admin
      const management: any = await db.query(`
          SELECT e.push_token 
          FROM employees e
          JOIN positions p ON e.position_id = p.id
          WHERE p.name IN ('SPV Office', 'Support admin') 
            AND e.push_token IS NOT NULL
      `);

      // 3. Combine unique tokens
      const allTokens = Array.from(new Set([
          ...technicians.map((t: any) => t.push_token),
          ...management.map((m: any) => m.push_token)
      ]));

      if (allTokens.length > 0) {
          const title = 'Pembaruan Status Tiket 🔄';
          const body = `Tiket #${ticketId} (${customerName}) sekarang berstatus: ${newStatus}`;
          await sendExpoPushNotification(allTokens, title, body, { 
              ticketId: ticketId.toString(), 
              type: type,
              newStatus 
          });
      }
  } catch (error) {
      console.error('[Notification Broadcast] Error:', error);
  }
}
