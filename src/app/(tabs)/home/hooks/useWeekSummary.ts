import type { WeekDay } from '../components/WeekGrass';
import { addDays, todayStr, weekStart } from '@/lib/date';
import { heatLevel } from '@/lib/heatmap';
import { computeWeeklyStreak } from '@/lib/streak';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useMemo } from 'react';

/** 이번 주 요약 (7칸 도장·총 시간·연속 달성) */
export function useWeekSummary() {
  const logs = useWorkoutStore((s) => s.logs);
  const goalHistory = useWorkoutStore((s) => s.goalHistory);
  const stampingDate = useWorkoutStore((s) => s.stampingDate); // 방금 기록한 날짜 (도장 애니메이션 대상)
  const clearStamping = useWorkoutStore((s) => s.clearStamping);

  const today = todayStr();
  const monday = weekStart(today); // 이번 주 월요일
  const logsByDate = useMemo(() => new Map(logs.map((l) => [l.logDate, l])), [logs]);

  // 월~일 7칸
  const weekDays = useMemo<WeekDay[]>(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(monday, i);
        return {
          date,
          stamped: logsByDate.has(date),
          level: heatLevel(logsByDate.get(date)),
          isToday: date === today,
          stampAnimate: date === stampingDate,
        };
      }),
    [monday, logsByDate, today, stampingDate],
  );

  // 이번 주 총 운동 시간 (분)
  const weekMin = weekDays.reduce((sum, d) => sum + (logsByDate.get(d.date)?.durationMin ?? 0), 0);

  // 연속 달성 (이번 주 미달성이어도 지난주까지 유지)
  const weeklyStreak = useMemo(
    () => computeWeeklyStreak(logs.map((l) => l.logDate), goalHistory, today),
    [logs, goalHistory, today],
  );

  return { weekDays, weekMin, weeklyStreak, onStampPlayed: clearStamping };
}
