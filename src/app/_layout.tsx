import '@/global.css';

import { LaunchStamp } from '@/components/LaunchStamp';
import { Colors } from '@/constants/colors';
import { createSessionFromUrl } from '@/lib/socialAuth';
import { syncAll } from '@/lib/sync';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { startWidgetSync } from '@/widget/syncWidget';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadAll = useWorkoutStore((s) => s.loadAll);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    const stopWidgetSync = startWidgetSync();
    loadAll();
    initializeAuth();
    return stopWidgetSync;
  }, [loadAll, initializeAuth]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  const userId = useAuthStore((s) => s.user?.id);
  useEffect(() => {
    if (!userId) return;
    syncAll(userId)
      .catch((e) => console.warn('서버 동기화 실패', e))
      .finally(loadAll);
  }, [userId, loadAll]);

  const url = Linking.useLinkingURL();
  useEffect(() => {
    if (url) createSessionFromUrl(url).catch((e) => console.warn('딥링크 세션 처리 실패', e));
  }, [url]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      {/* 스플래시 직후 로고 전환 (앱 시작 시 한 번) */}
      <LaunchStamp ready={hydrated}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="login/index" />
          <Stack.Screen name="email" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="record/index" options={{ presentation: 'modal' }} />
        </Stack>
      </LaunchStamp>
    </GestureHandlerRootView>
  );
}
