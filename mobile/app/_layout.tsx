import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notifications';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // 1. Register for push notifications on app launch
    // This will request permissions and save the token to the backend
    registerForPushNotificationsAsync();

    // 2. Listen for notification interactions (clicking the notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      console.log('[Notification Interaction] Received Data:', data);

      // Handle navigations based on data payload
      if (data.ticketId) {
        // Support Ticket -> Go to task-detail/[id]
        // IMPORTANT: task-detail requires BOTH 'id' and 'type' params
        router.push({
          pathname: `/task-detail/${data.ticketId}`,
          params: { type: 'ticket' }
        });
      } else if (data.type === 'leave_status') {
        // Leave status update -> Go to leave screen
        router.push('/(drawer)/leave');
      } else if (data.type === 'overtime_status') {
        // Overtime status update -> Go to overtime screen
        router.push('/(drawer)/overtime');
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* The index/login screen */}
        <Stack.Screen name="index" />
        
        {/* The protected drawer area */}
        <Stack.Screen name="(drawer)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
