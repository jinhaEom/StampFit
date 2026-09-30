import { useAuthStore } from '@/store/useAuthStore';
import { Redirect } from 'expo-router';

export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!hydrated) return null;

  return <Redirect href={isLoggedIn ? '/home' : '/login'} />;
}
