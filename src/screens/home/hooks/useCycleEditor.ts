import type { WorkoutCycleStep } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import * as Crypto from 'expo-crypto';
import { useState } from 'react';

const newStep = (): WorkoutCycleStep => ({ id: Crypto.randomUUID(), label: '', bodyPartIds: [] });

/** 운동 싸이클 편집 (바꿀 때마다 바로 저장, 부위 없는 단계는 저장 안 함) */
export function useCycleEditor() {
  const parts = useWorkoutStore((s) => s.parts);
  const cycle = useWorkoutStore((s) => s.cycle);
  const setCycle = useWorkoutStore((s) => s.setCycle);
  const [steps, setSteps] = useState<WorkoutCycleStep[]>(() => cycle?.steps ?? [newStep()]); // 처음이면 빈 단계 하나
  const [openStepId, setOpenStepId] = useState<string | null>(() => (cycle ? null : steps[0].id)); // 펼친 단계 (하나만)

  // 고른 부위 이름을 이어붙인 단계 이름 (예: "가슴 · 삼두")
  const labelFromPartIds = (partIds: string[]) =>
    partIds
      .map((pid) => parts.find((p) => p.id === pid)?.name)
      .filter(Boolean)
      .join(' · ');

  // 목록 변경 + 바로 저장
  const update = (next: WorkoutCycleStep[]) => {
    setSteps(next);
    setCycle(next.filter((s) => s.bodyPartIds.length > 0));
  };

  /* 새 단계는 부위 고르기 전이라 목록에만 추가 */
  const addStep = () => {
    const step = newStep();
    setSteps([...steps, step]);
    setOpenStepId(step.id);
  };

  const removeStep = (id: string) => update(steps.filter((s) => s.id !== id));

  const togglePart = (id: string, partId: string) =>
    update(
      steps.map((s) => {
        if (s.id !== id) return s;
        const bodyPartIds = s.bodyPartIds.includes(partId)
          ? s.bodyPartIds.filter((p) => p !== partId)
          : [...s.bodyPartIds, partId];
        return { ...s, bodyPartIds, label: labelFromPartIds(bodyPartIds) };
      }),
    );

  return { parts, steps, openStepId, setOpenStepId, addStep, removeStep, togglePart };
}
