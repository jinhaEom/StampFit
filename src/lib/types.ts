/** 부위 칩  */
export interface BodyPart {
  id: string;
  name: string;
  sortOrder: number;
  /** false면 새 기록 화면에서만 숨김 */
  isActive: boolean;
}

/** 하루 기록에서 부위 하나가 차지한 시간 */
export interface WorkoutLogPart {
  id: string;
  durationMin: number;
}

/** 하루 기록 — 날짜당 1건, 부위마다 시간을 따로 기록 */
export interface WorkoutLog {
  id: string;
  /** YYYY-MM-DD (로컬 기준) */
  logDate: string;
  /** 전체 부위 시간의 합 (파생값) */
  durationMin: number;
  /** 1~5, 평소 대비 강도 */
  intensity: number;
  /** 1~5, 몸 상태 */
  condition: number;
  memo: string | null;
  parts: WorkoutLogPart[];
}

/** 주간 운동 횟수 목표 */
export interface Goal {
  targetCount: number;
  /** true면 매주 자동 적용, false면 weekStart가 속한 주에만 유효 */
  recurring: boolean;
  /** 이 설정이 적용되기 시작한 주의 월요일 (YYYY-MM-DD) */
  weekStart: string;
}

export interface GoalProgress {
  targetCount: number;
  achievedCount: number;
  percent: number;
  recurring: boolean;
}
export interface WorkoutCycleStep {
  id: string;
  label: string;
  bodyPartIds: string[];
}

export interface WorkoutCycle {
  steps: WorkoutCycleStep[];
  currentIndex: number;
}
