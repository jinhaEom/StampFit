import { todayStr } from './date';
import type { WorkoutLog } from './types';

export interface PartStat {
  id: string;
  name: string;
  minutes: number;
  count: number;
}

export interface MonthlyAnalytics {
  year: number;
  month: number;
  totalCount: number;
  totalMinutes: number;
  avgMinutesPerWorkout: number;
  avgIntensity: number;
  avgCondition: number;
  prevMonthDiff: {
    diffMinutes: number;
    diffCount: number;
  };
  partStats: PartStat[];
  weeklyAvg: number; // 주 평균 운동 횟수
  hasData: boolean;
}

/** 부위별 시간·횟수 */
export function getPartStatsForLogs(
  logs: WorkoutLog[],
  partNamesById: Record<string, string>,
): PartStat[] {
  const partMap = new Map<string, { minutes: number; count: number }>();

  for (const log of logs) {
    for (const part of log.parts) {
      if (!partNamesById[part.id]) continue;

      const existing = partMap.get(part.id) ?? { minutes: 0, count: 0 };
      existing.minutes += part.durationMin;
      existing.count += 1;
      partMap.set(part.id, existing);
    }
  }

  return Array.from(partMap.entries())
    .map(([id, data]) => {
      const name = partNamesById[id] || '기타';
      return { id, name, minutes: Math.round(data.minutes), count: data.count };
    })
    .sort((a, b) => b.minutes - a.minutes);
}

/** 월간 통계 */
export function getMonthlyAnalytics(
  logs: WorkoutLog[],
  partNamesById: Record<string, string>,
  year: number,
  month: number,
): MonthlyAnalytics {
  const currentPrefix = `${year}-${String(month).padStart(2, '0')}`;

  // 지난달 (전월 대비용)
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prevPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  const currentLogs = logs.filter((l) => l.logDate.startsWith(currentPrefix));
  const prevLogs = logs.filter((l) => l.logDate.startsWith(prevPrefix));

  const totalCount = currentLogs.length;
  const prevTotalCount = prevLogs.length;

  const totalMinutes = currentLogs.reduce((acc, l) => acc + l.durationMin, 0);
  const prevTotalMinutes = prevLogs.reduce((acc, l) => acc + l.durationMin, 0);

  if (totalCount === 0) {
    return {
      year,
      month,
      totalCount: 0,
      totalMinutes: 0,
      avgMinutesPerWorkout: 0,
      avgIntensity: 0,
      avgCondition: 0,
      prevMonthDiff: {
        diffMinutes: -prevTotalMinutes,
        diffCount: -prevTotalCount,
      },
      partStats: [],
      weeklyAvg: 0,
      hasData: false,
    };
  }

  const avgMinutesPerWorkout = Math.round(totalMinutes / totalCount);
  const avgIntensity = Number(
    (currentLogs.reduce((acc, l) => acc + l.intensity, 0) / totalCount).toFixed(1),
  );
  const avgCondition = Number(
    (currentLogs.reduce((acc, l) => acc + l.condition, 0) / totalCount).toFixed(1),
  );

  const partStats = getPartStatsForLogs(currentLogs, partNamesById);

  /* 주 평균 운동 횟수 (이번 달은 오늘까지, 지난달은 말일까지 기준) */
  const today = todayStr();
  const days = today.startsWith(currentPrefix) ? Number(today.slice(8, 10)) : new Date(year, month, 0).getDate();
  const weeklyAvg = Number((totalCount / Math.max(1, days / 7)).toFixed(1)); // 첫 주는 횟수 그대로

  return {
    year,
    month,
    totalCount,
    totalMinutes,
    avgMinutesPerWorkout,
    avgIntensity,
    avgCondition,
    prevMonthDiff: {
      diffMinutes: totalMinutes - prevTotalMinutes,
      diffCount: totalCount - prevTotalCount,
    },
    partStats,
    weeklyAvg,
    hasData: true,
  };
}

/** 지난달 비교 문구 (지난달 기록 없으면 null) */
export function formatCompareText(totalCount: number, diffCount: number): string | null {
  const prevCount = totalCount - diffCount;
  if (prevCount === 0) return null;
  if (diffCount > 0) return `지난달보다 ${diffCount}번 더`;
  if (diffCount < 0) return `지난달보다 ${-diffCount}번 적게`;
  return '지난달과 같은 횟수';
}
