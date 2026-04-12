import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'props.pointerEvents is deprecated. Use style.pointerEvents',
]);

export default function RootLayout() {

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* The index/login screen */}
          <Stack.Screen name="index" />
          
          {/* The protected drawer area */}
          <Stack.Screen name="(drawer)" />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
