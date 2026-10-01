import { quotes } from '@/constants/quotes';
import { todayStr } from '@/lib/date';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useMemo } from 'react';

/** 오늘 기록·싸이클 차례·오늘의 명언 */
export function useTodayPlan() {
  const today = todayStr();
  const todayLog = useWorkoutStore((s) => s.logs.find((l) => l.logDate === today));
  const cycle = useWorkoutStore((s) => s.cycle);

  // 지금 차례 (오늘 기록하면 다음 단계로 넘어감)
  const currentStep = cycle && cycle.steps.length > 0 ? cycle.steps[cycle.currentIndex] : null;
  // 그다음 차례 (단계 2개 이상일 때만)
  const nextStep =
    cycle && cycle.steps.length > 1 ? cycle.steps[(cycle.currentIndex + 1) % cycle.steps.length] : null;

  // 날짜로 고르는 오늘의 명언
  const quoteOfDay = useMemo(() => {
    if (quotes.length === 0) return null;
    const seed = Number(today.replace(/-/g, ''));
    return quotes[seed % quotes.length];
  }, [today]);

  return { todayLog, currentStep, nextStep, quoteOfDay };
}
