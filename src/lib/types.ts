/** 운동 부위 */
export interface BodyPart {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean; // false면 새 기록 화면에서만 숨김
}

/** 기록 속 부위 하나의 시간 */
export interface WorkoutLogPart {
  id: string;
  durationMin: number;
}

/** 하루 운동 기록 (날짜당 1건) */
export interface WorkoutLog {
  id: string;
  logDate: string; // YYYY-MM-DD (로컬 기준)
  durationMin: number; // 부위 시간 합
  intensity: number; // 1~5 (평소 대비 강도)
  condition: number; // 1~5 (몸 상태)
  memo: string | null;
  parts: WorkoutLogPart[];
}

/** 주간 운동 횟수 목표 */
export interface Goal {
  targetCount: number;
  recurring: boolean; // true면 매주 적용, false면 weekStart 주에만
  weekStart: string; // 적용 시작 주의 월요일 (YYYY-MM-DD)
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
