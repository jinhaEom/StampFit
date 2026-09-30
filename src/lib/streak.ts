import { addDays, weekStart } from './date';
import type { Goal } from './types';

/* 주간 연속 달성 (그 주 목표 이상 기록 = 달성, 목표 없는 주 = 미달성) */

/** 그 주에 적용되던 목표 횟수 (없으면 null) */
export function goalTargetForWeek(history: Goal[], week: string): number | null {
  const past = history.filter((g) => g.weekStart <= week);
  const latest = past[past.length - 1];
  if (!latest) return null;
  if (!latest.recurring && latest.weekStart !== week) return null;
  return latest.targetCount;
}

export interface WeeklyStreak {
  weeks: number; // 연속 달성 주 수
  target: number | null; // 이번 주 목표 (없으면 null)
  count: number; // 이번 주 기록 수
}

export function computeWeeklyStreak(logDates: string[], history: Goal[], today: string): WeeklyStreak {
  const countOf = (week: string) => logDates.filter((d) => weekStart(d) === week).length;
  const isAchieved = (week: string) => {
    const target = goalTargetForWeek(history, week);
    return target !== null && countOf(week) >= target;
  };

  /* 이번 주 미달성이면 지난주부터 셈, 미달성 주에서 멈춤 */
  const thisWeek = weekStart(today);
  let week = isAchieved(thisWeek) ? thisWeek : addDays(thisWeek, -7);
  let weeks = 0;
  while (isAchieved(week)) {
    weeks++;
    week = addDays(week, -7);
  }

  return { weeks, target: goalTargetForWeek(history, thisWeek), count: countOf(thisWeek) };
}
