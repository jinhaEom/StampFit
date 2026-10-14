import type { WorkoutCycleStep, WorkoutLog } from './types';

/* 운동 싸이클 차례 계산 (저장하지 않고 기록을 따라가며 매번 계산) */

/** 기준점 (이 날짜부터의 기록으로 차례를 넘김) */
export interface CycleAnchor {
  index: number; // 기준 날짜를 시작할 때의 차례
  date: string; // YYYY-MM-DD
  partIds: string[]; // 기준을 잡을 때 그날 이미 기록돼 있던 부위 (다시 세지 않음)
}

/** 지금 차례 (기준점부터 기록을 날짜순으로 따라감, logs는 날짜 오름차순) */
export function computeCurrentIndex(steps: WorkoutCycleStep[], anchor: CycleAnchor, logs: WorkoutLog[]): number {
  let index = anchor.index % steps.length;
  for (const log of logs) {
    if (log.logDate < anchor.date) continue;
    const partIds = log.parts
      .map((p) => p.id)
      .filter((id) => log.logDate !== anchor.date || !anchor.partIds.includes(id));
    index = advance(steps, index, partIds);
  }
  return index;
}

/** 하루 기록만큼 차례 넘기기 */
function advance(steps: WorkoutCycleStep[], index: number, partIds: string[]): number {
  const left = new Set(partIds); // 아직 단계에 안 쓴 부위
  const overlap = (i: number) => steps[i].bodyPartIds.filter((id) => left.has(id)).length;

  /* 지금 차례부터 돌면서 겹치는 부위가 가장 많은 단계 찾기 (같으면 지금 차례에 가까운 쪽) */
  let start = -1;
  let best = 0;
  for (let i = 0; i < steps.length; i++) {
    const at = (index + i) % steps.length;
    const n = overlap(at);
    if (n > best) {
      best = n;
      start = at;
    }
  }
  /* 싸이클에 없는 부위만 했으면 (예: 유산소) 차례 그대로 */
  if (start < 0) return index;

  /* 다음 단계 부위도 했으면 연달아 넘어감 (하루 두 번 운동) */
  let at = start;
  for (let done = 0; done < steps.length && overlap(at) > 0; done++) {
    steps[at].bodyPartIds.forEach((id) => left.delete(id));
    at = (at + 1) % steps.length;
  }
  return at;
}
