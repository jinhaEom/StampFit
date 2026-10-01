import type { WorkoutCycleStep } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';

/** 운동 싸이클 편집 (저장 전까지는 화면 안에서만 바뀜) */
export function useCycleEditor() {
  const parts = useWorkoutStore((s) => s.parts);
  const cycle = useWorkoutStore((s) => s.cycle);
  const setCycle = useWorkoutStore((s) => s.setCycle);
  const [cycleSteps, setCycleSteps] = useState<WorkoutCycleStep[]>(cycle?.steps ?? []); // 편집 중인 단계
  const [cycleDirty, setCycleDirty] = useState(false); // 저장 안 한 변경 있음
  const [invalidCycleAlertVisible, setInvalidCycleAlertVisible] = useState(false);

  /* 편집 전이면 저장된 싸이클로 맞춤 */
  useEffect(() => {
    if (cycleDirty) return;
    setCycleSteps(cycle?.steps ?? []);
  }, [cycle, cycleDirty]);

  // 단계 목록 변경 + 저장 안 함 표시
  const editSteps = (update: (prev: WorkoutCycleStep[]) => WorkoutCycleStep[]) => {
    setCycleSteps(update);
    setCycleDirty(true);
  };

  // 고른 부위 이름을 이어붙인 단계 이름 (예: "가슴 , 삼두")
  const labelFromPartIds = (partIds: string[]) =>
    partIds
      .map((pid) => parts.find((p) => p.id === pid)?.name)
      .filter(Boolean)
      .join(' , ');

  const addCycleStep = () =>
    editSteps((prev) => [...prev, { id: Crypto.randomUUID(), label: '', bodyPartIds: [] }]);

  const removeCycleStep = (id: string) => editSteps((prev) => prev.filter((s) => s.id !== id));

  const toggleCycleStepPart = (id: string, partId: string) =>
    editSteps((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const bodyPartIds = s.bodyPartIds.includes(partId)
          ? s.bodyPartIds.filter((p) => p !== partId)
          : [...s.bodyPartIds, partId];
        return { ...s, bodyPartIds, label: labelFromPartIds(bodyPartIds) };
      }),
    );

  // 한 칸 위(-1)·아래(+1)로 이동
  const moveCycleStep = (id: string, dir: -1 | 1) =>
    editSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const swapIdx = idx + dir;
      if (idx < 0 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });

  // 저장 (부위 없는 단계 있으면 실패)
  const saveCycle = () => {
    if (cycleSteps.some((s) => s.bodyPartIds.length === 0)) return false;
    setCycle(cycleSteps);
    setCycleDirty(false);
    return true;
  };

  return {
    parts,
    cycle,
    cycleSteps,
    addCycleStep,
    removeCycleStep,
    toggleCycleStepPart,
    moveCycleStep,
    saveCycle,
    invalidCycleAlertVisible,
    setInvalidCycleAlertVisible,
  };
}
