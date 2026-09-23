import { addDays, weekStart } from './date';
import type { Goal } from './types';

/**
 * 주간 목표 연속 달성.
 * 한 주(월~일)에 그 주의 목표 횟수 이상 기록하면 달성. 목표가 없던 주는 달성으로 치지 않는다.
 */

/** 그 주(월요일)에 적용되던 목표 횟수. 목표가 없던 주면 null */
export function goalTargetForWeek(history: Goal[], week: string): number | null {
  const past = history.filter((g) => g.weekStart <= week);
  const latest = past[past.length - 1];
  if (!latest) return null;
  if (!latest.recurring && latest.weekStart !== week) return null;
  return latest.targetCount;
}

export interface WeeklyStreak {
  weeks: number;
  target: number | null;
  count: number;
}

export function computeWeeklyStreak(logDates: string[], history: Goal[], today: string): WeeklyStreak {
  const countOf = (week: string) => logDates.filter((d) => weekStart(d) === week).length;
  const isAchieved = (week: string) => {
    const target = goalTargetForWeek(history, week);
    return target !== null && countOf(week) >= target;
  };

  // 이번 주를 아직 못 채웠으면 지난주부터 센다. 달성 못 한 주를 만나면 멈춤
  const thisWeek = weekStart(today);
  let week = isAchieved(thisWeek) ? thisWeek : addDays(thisWeek, -7);
  let weeks = 0;
  while (isAchieved(week)) {
    weeks++;
    week = addDays(week, -7);
  }

  return { weeks, target: goalTargetForWeek(history, thisWeek), count: countOf(thisWeek) };
}
