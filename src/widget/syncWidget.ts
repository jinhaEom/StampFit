import { addDays, daysBetween, parseDateStr, todayStr, weekStart } from '@/lib/date';
import { heatLevel } from '@/lib/heatmap';
import type { WorkoutCycle, WorkoutLog } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import MyHealthWidget, { type MyHealthWidgetProps } from './MyHealthWidget';
import WorkoutWidget from '../../modules/workout-widget/src/WorkoutWidgetModule';

// 앱을 열지 않아도 자정마다 연속 기록·오늘 완료 여부가 넘어가도록 며칠치를 미리 예약
const TIMELINE_DAYS = 3;

function buildProps(
  logsByDate: Map<string, WorkoutLog>,
  cycle: WorkoutCycle | null,
  date: string,
): MyHealthWidgetProps {
  let streak = 0;
  let cursor = logsByDate.has(date) ? date : addDays(date, -1);
  while (logsByDate.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const ws = weekStart(date);
  const current = cycle && cycle.steps.length > 0 ? cycle.steps[cycle.currentIndex] : null;
  const next =
    cycle && cycle.steps.length > 1 ? cycle.steps[(cycle.currentIndex + 1) % cycle.steps.length] : null;

  return {
    streak,
    doneToday: logsByDate.has(date),
    ...(current && { todayLabel: current.label }),
    ...(next && { nextLabel: next.label }),
    weekLevels: Array.from({ length: 7 }, (_, i) => heatLevel(logsByDate.get(addDays(ws, i)))),
    todayIndex: daysBetween(ws, date),
  };
}

function pushTimeline(logs: WorkoutLog[], cycle: WorkoutCycle | null) {
  const logsByDate = new Map(logs.map((l) => [l.logDate, l]));
  const today = todayStr();
  const entries = Array.from({ length: TIMELINE_DAYS }, (_, i) => {
    const date = addDays(today, i);
    return {
      date: i === 0 ? new Date() : parseDateStr(date),
      props: buildProps(logsByDate, cycle, date),
    };
  });

  MyHealthWidget.updateTimeline(entries);
  WorkoutWidget?.updateTimeline(
    JSON.stringify(entries.map((e) => ({ timestamp: e.date.getTime(), props: e.props }))),
  ).catch((e) => console.warn('Android 위젯 갱신 실패', e));
}

// 운동 기록·싸이클이 바뀔 때마다 위젯 갱신
export function startWidgetSync() {
  return useWorkoutStore.subscribe((state, prev) => {
    if (state.hydrated && (state.logs !== prev.logs || state.cycle !== prev.cycle)) {
      pushTimeline(state.logs, state.cycle);
    }
  });
}
