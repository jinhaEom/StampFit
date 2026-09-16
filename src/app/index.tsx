import SplashScreen from '@/app/splash';
import { useAuthStore } from '@/store/useAuthStore';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

const MIN_SPLASH_DURATION_MS = 1500;

export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), MIN_SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!hydrated || !minDurationElapsed) {
    return <SplashScreen />;
  }

  return <Redirect href={isLoggedIn ? '/home' : '/login'} />;
}
