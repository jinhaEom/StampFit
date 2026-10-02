import * as repo from '@/lib/repo';
import { pushAfterWrite } from '@/lib/sync';
import type { BodyPart, Goal, WorkoutCycle, WorkoutCycleStep, WorkoutLog } from '@/lib/types';
import { create } from 'zustand';

interface WorkoutState {
  hydrated: boolean;
  parts: BodyPart[];
  partNamesById: Record<string, string>; // 부위 id → 이름 (삭제된 부위 포함)
  logs: WorkoutLog[];
  goal: Goal | null;
  goalHistory: Goal[]; // 목표 변경 이력 (연속 달성 계산용)
  cycle: WorkoutCycle | null;
  stampingDate: string | null; // 방금 새로 기록한 날짜 (돌아간 화면에서 도장 1회)
  loadAll: () => void;
  saveLog: (input: repo.UpsertLogInput) => void;
  removeLog: (logDate: string) => void;
  addPart: (name: string) => string | null;
  setPartActive: (id: string, active: boolean) => void;
  removePart: (id: string) => void;
  reorderParts: (parts: BodyPart[]) => void;
  setGoal: (targetCount: number, recurring: boolean) => void;
  setCycle: (steps: WorkoutCycleStep[]) => void;
  resetAll: () => void;
  stampDate: (date: string) => void;
  clearStamping: () => void;
}

// 로컬 DB 전체 읽기 (화면 상태 한 벌)
const readSnapshot = () => ({
  parts: repo.getBodyParts(),
  partNamesById: repo.getBodyPartNamesById(),
  logs: repo.getLogs(),
  goal: repo.getGoal(),
  goalHistory: repo.getGoalHistory(),
  cycle: repo.getCycle(),
});

export const useWorkoutStore = create<WorkoutState>((set) => {
  // 쓰기 후 화면 갱신 + 서버 반영
  const refresh = () => {
    set(readSnapshot());
    /* pull로 부위 id가 바뀔 수 있어 끝나고 다시 읽음 */
    pushAfterWrite().then(() => set(readSnapshot()));
  };
  return {
    hydrated: false,
    parts: [],
    partNamesById: {},
    logs: [],
    goal: null,
    goalHistory: [],
    cycle: null,
    stampingDate: null,
    loadAll: () => {
      try {
        set({ ...readSnapshot(), hydrated: true });
      } catch (e) {
        console.warn('로컬 DB 초기화 실패', e);
      }
    },
    saveLog: (input) => {
      repo.upsertLog(input);
      refresh();
    },
    removeLog: (logDate) => {
      repo.softDeleteLog(logDate);
      refresh();
    },
    addPart: (name) => {
      const id = repo.addBodyPart(name.trim());
      if (id) refresh();
      return id;
    },
    setPartActive: (id, active) => {
      repo.setBodyPartActive(id, active);
      refresh();
    },
    removePart: (id) => {
      repo.deleteBodyPart(id);
      refresh();
    },
    reorderParts: (parts) => {
      repo.reorderBodyParts(parts.map((p) => p.id));
      refresh();
    },
    setGoal: (targetCount, recurring) => {
      repo.setGoal(targetCount, recurring);
      refresh();
    },
    setCycle: (steps) => {
      repo.setCycleSteps(steps);
      set(readSnapshot()); // 기기 전용이라 서버 동기화 안 함
    },
    resetAll: () => {
      repo.resetAllData();
      set(readSnapshot());
    },
    stampDate: (date) => set({ stampingDate: date }),
    clearStamping: () => set({ stampingDate: null }),
  };
});
