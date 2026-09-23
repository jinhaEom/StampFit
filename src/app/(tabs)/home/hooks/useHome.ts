import type { WeekDay } from '@/components/WeekGrass';
import { getMonthlyAnalytics, getPartStatsForLogs } from '@/lib/analytics';
import { quotes } from '@/constants/quotes';
import { addDays, todayStr, weekStart } from '@/lib/date';
import { computeGoalProgress } from '@/lib/goal';
import { computeWeeklyStreak } from '@/lib/streak';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useHome = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = useWorkoutStore((s) => s.logs);
  const goal = useWorkoutStore((s) => s.goal);
  const goalHistory = useWorkoutStore((s) => s.goalHistory);
  const cycle = useWorkoutStore((s) => s.cycle);
  const partNamesById = useWorkoutStore((s) => s.partNamesById);

  const today = todayStr();
  const logsByDate = useMemo(() => new Map(logs.map((l) => [l.logDate, l])), [logs]);
  const ws = weekStart(today);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

  // 방금 기록한 날은 도장이 찍히는 애니메이션
  const stampingDate = useWorkoutStore((s) => s.stampingDate);
  const clearStamping = useWorkoutStore((s) => s.clearStamping);
  const weekDays = useMemo<WeekDay[]>(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(ws, i);
        return {
          date,
          stamped: logsByDate.has(date),
          isToday: date === today,
          stampAnimate: date === stampingDate,
        };
      }),
    [ws, logsByDate, today, stampingDate],
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

  // 주간 목표 연속 달성 (이번 주를 아직 못 채웠어도 지난주까지의 연속은 유지)
  const weeklyStreak = useMemo(
    () => computeWeeklyStreak(logs.map((l) => l.logDate), goalHistory, today),
    [logs, goalHistory, today],
  );

  // 오늘의 한마디 
  const quoteOfDay = useMemo(() => {
    if (quotes.length === 0) return null;
    const seed = Number(today.replace(/-/g, ''));
    return quotes[seed % quotes.length];
  }, [today]);

  const currentCycleStep = cycle && cycle.steps.length > 0 ? cycle.steps[cycle.currentIndex] : null;
  const nextCycleStep =
    cycle && cycle.steps.length > 1 ? cycle.steps[(cycle.currentIndex + 1) % cycle.steps.length] : null;

  return {
    insets,
    router,
    today,
    logsByDate,
    weekDays,
    clearStamping,
    weekLogs,
    weekMin,
    weekPartStats,
    monthAnalytics,
    goalProgress,
    weeklyStreak,
    quoteOfDay,
    currentCycleStep,
    nextCycleStep,
    isCycleModalOpen,
    setIsCycleModalOpen,
    isGoalModalOpen,
    setIsGoalModalOpen,
  }
}
