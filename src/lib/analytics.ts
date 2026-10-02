import { PART_PALETTE } from '@/constants/colors';
import { formatDuration, todayStr } from './date';
import type { WorkoutLog } from './types';

export interface PartStat {
  id: string;
  name: string;
  minutes: number;
  percentage: number;
  count: number;
  color: string;
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
  topParts: PartStat[];
  weeklyAvg: number; // 주 평균 운동 횟수
  hasData: boolean;
}

/** 부위별 시간·횟수·비중 */
export function getPartStatsForLogs(
  logs: WorkoutLog[],
  partNamesById: Record<string, string>,
): PartStat[] {
  const partMap = new Map<string, { minutes: number; count: number }>();
  let totalMinutes = 0;

  for (const log of logs) {
    for (const part of log.parts) {
      if (!partNamesById[part.id]) continue;

      const existing = partMap.get(part.id) ?? { minutes: 0, count: 0 };
      existing.minutes += part.durationMin;
      existing.count += 1;
      partMap.set(part.id, existing);
      totalMinutes += part.durationMin;
    }
  }

  return Array.from(partMap.entries())
    .map(([id, data]) => {
      const name = partNamesById[id] || '기타';
      const roundedMin = Math.round(data.minutes);
      const percentage =
        totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0;
      return { id, name, minutes: roundedMin, percentage, count: data.count, color: '' };
    })
    .sort((a, b) => b.minutes - a.minutes)
    .map((item, idx) => ({ ...item, color: PART_PALETTE[idx % PART_PALETTE.length] }));
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
      topParts: [],
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
    topParts: partStats.slice(0, 3),
    weeklyAvg,
    hasData: true,
  };
}

/** 전월 대비 증감 문구 */
export function formatDiffText(diffMinutes: number, diffCount: number): {
  timeText: string;
  countText: string;
  isIncrease: boolean;
  isSame: boolean;
} {
  const isSame = diffMinutes === 0 && diffCount === 0;
  const isIncrease = diffMinutes > 0 || (diffMinutes === 0 && diffCount > 0);

  let timeText = '';
  if (diffMinutes === 0) {
    timeText = '지난달과 동일';
  } else {
    const absMin = Math.abs(diffMinutes);
    const sign = diffMinutes > 0 ? '+' : '-';
    timeText = `${sign}${formatDuration(absMin)}`;
  }

  let countText = '';
  if (diffCount === 0) {
    countText = '동일';
  } else {
    const sign = diffCount > 0 ? '+' : '';
    countText = `${sign}${diffCount}회`;
  }

  return { timeText, countText, isIncrease, isSame };
}
