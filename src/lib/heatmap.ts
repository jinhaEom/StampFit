import { Colors } from '@/constants/colors';
import { HEATMAP_LEVELS, HEATMAP_MAX_SCORE } from '@/constants/recovery';
import { addDays, weekStart } from './date';
import type { WorkoutLog } from './types';

/** 기록 점수 (강도 × 시간) */
export function logScore(log: WorkoutLog): number {
  return log.intensity * log.durationMin;
}

/** 히트맵 단계 (0 기록 없음, 1~HEATMAP_LEVELS) */
export function heatLevel(log: WorkoutLog | undefined): number {
  if (!log) return 0;
  const ratio = Math.min(1, logScore(log) / HEATMAP_MAX_SCORE);
  return Math.max(1, Math.ceil(ratio * HEATMAP_LEVELS));
}

const LEVEL_ALPHA = ['', '40', '73', 'BF', 'FF']; // 단계별 민트 투명도 (hex)

export function heatColor(level: number): string {
  if (level <= 0) return Colors.border;
  return `${Colors.main}${LEVEL_ALPHA[Math.min(level, LEVEL_ALPHA.length - 1)]}`;
}

export function yearGrid(year: number): { weeks: (string | null)[][]; monthLabels: (string | null)[] } {
  const start = weekStart(`${year}-01-01`);
  const end = `${year}-12-31`;
  const weeks: (string | null)[][] = [];
  const monthLabels: (string | null)[] = [];
  let cursor = start;
  let prevMonth = '';
  while (cursor <= end) {
    const col: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(cursor, i);
      col.push(d.startsWith(`${year}-`) ? d : null);
    }
    const firstInYear = col.find((d) => d !== null);
    const month = firstInYear ? firstInYear.slice(5, 7) : '';
    monthLabels.push(month && month !== prevMonth ? `${Number(month)}월` : null);
    if (month) prevMonth = month;
    weeks.push(col);
    cursor = addDays(cursor, 7);
  }
  return { weeks, monthLabels };
}
