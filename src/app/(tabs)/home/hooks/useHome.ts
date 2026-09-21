import { getMonthlyAnalytics, getPartStatsForLogs } from '@/lib/analytics';
import { quotes } from '@/constants/quotes';
import { addDays, todayStr, weekStart } from '@/lib/date';
import { computeGoalProgress } from '@/lib/goal';
import { heatLevel } from '@/lib/heatmap';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useHome = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = useWorkoutStore((s) => s.logs);
  const goal = useWorkoutStore((s) => s.goal);
  const cycle = useWorkoutStore((s) => s.cycle);
  const partNamesById = useWorkoutStore((s) => s.partNamesById);

  const today = todayStr();
  const logsByDate = useMemo(() => new Map(logs.map((l) => [l.logDate, l])), [logs]);
  const ws = weekStart(today);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(ws, i);
        return { date, level: heatLevel(logsByDate.get(date)), isToday: date === today };
      }),
    [ws, logsByDate, today],
  );
  const weekLogs = logs.filter((l) => l.logDate >= ws && l.logDate < addDays(ws, 7));
  const weekMin = weekLogs.reduce((sum, l) => sum + l.durationMin, 0);
  const goalProgress = useMemo(
    () => computeGoalProgress(goal, ws, weekLogs.length),
    [goal, ws, weekLogs.length],
  );

  // 이번 주 부위 밸런스
  const weekPartStats = useMemo(
    () => getPartStatsForLogs(weekLogs, partNamesById),
    [weekLogs, partNamesById],
  );

  // 이번 달 리포트 요약 (홈 티저용)
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const monthAnalytics = useMemo(
    () => getMonthlyAnalytics(logs, partNamesById, currentYear, currentMonth),
    [logs, partNamesById, currentYear, currentMonth],
  );

  //연속 기록 일수 (오늘 기록 전이어도 어제까지의 운동일자는 유지)
  const hasLoggedToday = logsByDate.has(today);
  const consecutiveDays = useMemo(() => {
    let count = 0;
    let date = hasLoggedToday ? today : addDays(today, -1);
    while (logsByDate.has(date)) {
      count++;
      date = addDays(date, -1);
    }
    return count;
  }, [logsByDate, today, hasLoggedToday]);

  // 오늘의 한마디 
  const quoteOfDay = useMemo(() => {
    if (quotes.length === 0) return null;
    const seed = Number(today.replace(/-/g, ''));
    return quotes[seed % quotes.length];
  }, [today]);

  const currentCycleStep = cycle && cycle.steps.length > 0 ? cycle.steps[cycle.currentIndex] : null;
  const nextCycleStep =
    cycle && cycle.steps.length > 1 ? cycle.steps[(cycle.currentIndex + 1) % cycle.steps.length] : null;

  const hasAnyLogs = logs.length > 0;

  return {
    insets,
    router,
    today,
    logsByDate,
    hasAnyLogs,
    weekDays,
    weekLogs,
    weekMin,
    weekPartStats,
    monthAnalytics,
    goalProgress,
    consecutiveDays,
    hasLoggedToday,
    quoteOfDay,
    currentCycleStep,
    nextCycleStep,
    isCycleModalOpen,
    setIsCycleModalOpen,
    isGoalModalOpen,
    setIsGoalModalOpen,
  }
}
