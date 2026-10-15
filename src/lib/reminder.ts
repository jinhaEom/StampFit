import { addDays, parseDateStr, todayStr, weekStart } from '@/lib/date';
import { goalTargetForWeek } from '@/lib/streak';
import type { Goal, WorkoutLog } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * 미리 7일치를 예약해놓고 알림 전송
 * 사용자가 앱을 켜서 들어올 때마다 갱신
 */

const REMIND_HOUR = 20; // 알림 시각 (저녁 8시)
const DAYS_AHEAD = 7; // 미리 예약하는 날 수

/* 앱 켜져 있을 때도 배너 표시 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/* 그날 알림 문구 (안 보낼 날이면 null) */
function messageFor(date: string, logDates: string[], goalHistory: Goal[]) {
  if (logDates.includes(date)) return null; // 이미 기록함
  const week = weekStart(date);
  const target = goalTargetForWeek(goalHistory, week);
  if (target === null) return null; // 목표 없음
  const left = target - logDates.filter((d) => weekStart(d) === week).length;
  if (left <= 0) return null; // 이번 주 달성
  return `이번 주 목표까지 ${left}회 남았어요`;
}

/* 오늘부터 7일치 알림 다시 예약 */
async function reschedule(logs: WorkoutLog[], goalHistory: Goal[]) {
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  const logDates = logs.map((l) => l.logDate);
  const today = todayStr();
  const now = new Date();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = addDays(today, i);
    const id = `remind-${date}`;
    const at = parseDateStr(date);
    at.setHours(REMIND_HOUR, 0, 0, 0);
    const body = messageFor(date, logDates, goalHistory);

    await Notifications.cancelScheduledNotificationAsync(id);
    if (!body || at <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title: '스탬핏', body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  }
}

/** 홈 첫 진입 시 권한 요청 (아직 안 물어본 경우만) */
export async function requestReminderPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'undetermined') return;


  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '운동 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return;

  const { logs, goalHistory } = useWorkoutStore.getState();
  await reschedule(logs, goalHistory);
}

/** 기록·목표 바뀔 때마다 알림 다시 예약 */
export function startReminderSync() {
  return useWorkoutStore.subscribe((state, prev) => {
    if (state.hydrated && (state.logs !== prev.logs || state.goalHistory !== prev.goalHistory)) {
      reschedule(state.logs, state.goalHistory).catch((e) => console.warn('알림 예약 실패', e));
    }
  });
}
