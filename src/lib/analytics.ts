import { PART_PALETTE } from '@/constants/colors';
import { formatDuration } from './date';
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
  maxStreak: number;
  hasData: boolean;
}

/** 로그 배열에서 부위별 시간/횟수/비중을 계산  */
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

/** 특정 연도/월의 통계 데이터 계산 */
export function getMonthlyAnalytics(
  logs: WorkoutLog[],
  partNamesById: Record<string, string>,
  year: number,
  month: number,
): MonthlyAnalytics {
  const currentPrefix = `${year}-${String(month).padStart(2, '0')}`;

  // 이전 달 연산
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
      maxStreak: 0,
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

  // 이 달 안에서의 최대 연속 운동 일수 계산
  const sortedDates = currentLogs
    .map((l) => l.logDate)
    .sort();

  let maxStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  for (const dStr of sortedDates) {
    const [y, m, d] = dStr.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);

    if (lastDate) {
      const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / 86400000);
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
    lastDate = currentDate;
  }

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
    maxStreak,
    hasData: true,
  };
}

/** 증감 텍스트 및 부호 포맷터 */
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
