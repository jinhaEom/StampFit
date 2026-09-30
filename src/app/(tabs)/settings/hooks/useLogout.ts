import { countUnsyncedLogs, syncAll } from '@/lib/sync';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useState } from 'react';
import Toast from 'react-native-simple-toast';

/** 로그아웃 (이 기기 기록을 지우므로 서버 저장 먼저 확인) */
export function useLogout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const loadAll = useWorkoutStore((s) => s.loadAll);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0); // 서버에 못 올린 기록 수 (0 초과 시 경고)

  const logoutNow = async () => {
    setUnsyncedCount(0);
    try {
      await logout();
      loadAll(); // 비워진 로컬 DB로 화면 갱신
      Toast.show('로그아웃됐어요', Toast.SHORT);
    } catch (e) {
      console.warn('로그아웃 실패', e);
      Toast.show('로그아웃하지 못했어요. 인터넷 연결을 확인해 주세요', Toast.SHORT);
    } finally {
      setLoggingOut(false);
    }
  };

  // 동기화 후 남은 기록 있으면 경고만 띄움
  const requestLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (user) await syncAll(user.id);
    } catch (e) {
      console.warn('로그아웃 전 동기화 실패', e);
    }
    const unsynced = countUnsyncedLogs();
    if (unsynced > 0) {
      setUnsyncedCount(unsynced);
      setLoggingOut(false);
      return;
    }
    await logoutNow();
  };

  const dismissWarning = () => setUnsyncedCount(0);

  return { loggingOut, unsyncedCount, requestLogout, logoutNow, dismissWarning };
}
