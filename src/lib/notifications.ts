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
