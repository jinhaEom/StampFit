import * as repo from '@/lib/repo';
import { pushAfterWrite } from '@/lib/sync';
import type { BodyPart, Goal, WorkoutCycle, WorkoutCycleStep, WorkoutLog } from '@/lib/types';
import { create } from 'zustand';

interface WorkoutState {
  hydrated: boolean;
  parts: BodyPart[];
  /** 부위 ID로 부위명을 찾는 사전 (삭제된 부위도 과거 기록 조회를 위해 포함) */
  partNamesById: Record<string, string>;
  logs: WorkoutLog[];
  goal: Goal | null;
  /** 목표 변경 이력 (오래된 주부터) — 주 단위 연속 달성 계산용 */
  goalHistory: Goal[];
  cycle: WorkoutCycle | null;
  /** 방금 새로 기록한 날짜. 기록 화면이 닫히고 돌아온 화면의 그 날짜 칸에서 도장 애니메이션을 한 번 보여주고 비운다 */
  stampingDate: string | null;
  loadAll: () => void;
  saveLog: (input: repo.UpsertLogInput) => void;
  removeLog: (logDate: string) => void;
  addPart: (name: string) => string | null;
  setPartActive: (id: string, active: boolean) => void;
  removePart: (id: string) => void;
  movePart: (id: string, dir: -1 | 1) => void;
  setParts: (parts: BodyPart[]) => void;
  setGoal: (targetCount: number, recurring: boolean) => void;
  setCycle: (steps: WorkoutCycleStep[]) => void;
  resetAll: () => void;
  clearStamping: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => {
  const refresh = () => {
    set({
      parts: repo.getBodyParts(),
      partNamesById: repo.getBodyPartNamesById(),
      logs: repo.getLogs(),
      goal: repo.getGoal(),
      goalHistory: repo.getGoalHistory(),
      cycle: repo.getCycle(),
    });
    pushAfterWrite();
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
        set({
          parts: repo.getBodyParts(),
          partNamesById: repo.getBodyPartNamesById(),
          logs: repo.getLogs(),
          goal: repo.getGoal(),
          goalHistory: repo.getGoalHistory(),
          cycle: repo.getCycle(),
          hydrated: true,
        });
      } catch (e) {
        console.warn('로컬 DB 초기화 실패', e);
      }
    },
    saveLog: (input) => {

      const isNew = !get().logs.some((l) => l.logDate === input.logDate);
      repo.upsertLog(input);
      if (isNew) set({ stampingDate: input.logDate });
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
    movePart: (id, dir) => {
      repo.moveBodyPart(id, dir);
      refresh();
    },
    setParts: (parts) => set({ parts }),
    setGoal: (targetCount, recurring) => {
      repo.setGoal(targetCount, recurring);
      refresh();
    },
    setCycle: (steps) => {
      repo.setCycleSteps(steps);
      refresh();
    },
    resetAll: () => {
      repo.resetAllData();
      set({
        parts: repo.getBodyParts(),
        partNamesById: repo.getBodyPartNamesById(),
        logs: repo.getLogs(),
        goal: repo.getGoal(),
        goalHistory: repo.getGoalHistory(),
        cycle: repo.getCycle(),
      });
    },
    clearStamping: () => set({ stampingDate: null }),
  };
});
