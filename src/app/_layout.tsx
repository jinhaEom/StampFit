import '@/global.css';

import { Colors } from '@/constants/colors';
import { createSessionFromUrl } from '@/lib/socialAuth';
import { syncAll } from '@/lib/sync';
import { useAdsStore } from '@/store/useAdsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { startWidgetSync } from '@/widget/syncWidget';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadAll = useWorkoutStore((s) => s.loadAll);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const initAds = useAdsStore((s) => s.init);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    const stopWidgetSync = startWidgetSync();
    loadAll();
    initializeAuth();
    mobileAds().initialize();
    initAds();
    return stopWidgetSync;
  }, [loadAll, initializeAuth, initAds]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  const userId = useAuthStore((s) => s.user?.id);
  useEffect(() => {
    if (!userId) return;
    syncAll(userId)
      .then(loadAll)
      .catch((e) => console.warn('서버 동기화 실패', e));
  }, [userId, loadAll]);

  const url = Linking.useLinkingURL();
  useEffect(() => {
    if (url) createSessionFromUrl(url).catch((e) => console.warn('딥링크 세션 처리 실패', e));
  }, [url]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.tabBarColor },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="record" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
