import type { WorkoutCycleStep } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

export function useStepForm(stepId: string | null) {
  const parts = useWorkoutStore((s) => s.parts);
  const cycle = useWorkoutStore((s) => s.cycle);
  const setCycle = useWorkoutStore((s) => s.setCycle);
  const steps = cycle?.steps ?? [];

  const [initial] = useState(() => {
    const index = steps.findIndex((s) => s.id === stepId);
    return { step: index >= 0 ? steps[index] : null, number: (index >= 0 ? index : steps.length) + 1 };
  });
  const [partIds, setPartIds] = useState<string[]>(() => initial.step?.bodyPartIds ?? []);

  const visibleParts = parts.filter((p) => p.isActive || initial.step?.bodyPartIds.includes(p.id));

  const toggle = (partId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPartIds((prev) => (prev.includes(partId) ? prev.filter((p) => p !== partId) : [...prev, partId]));
  };

  const save = () => {
    const next: WorkoutCycleStep = {
      id: initial.step?.id ?? Crypto.randomUUID(),
      label: partIds.map((pid) => parts.find((p) => p.id === pid)?.name).filter(Boolean).join(' · '), // 예: "가슴 · 삼두"
      bodyPartIds: partIds,
    };
    setCycle(initial.step ? steps.map((s) => (s.id === next.id ? next : s)) : [...steps, next]);
  };

  const remove = () => setCycle(steps.filter((s) => s.id !== initial.step?.id));

  return {
    parts: visibleParts,
    number: initial.number,
    isNew: !initial.step,
    partIds,
    toggle,
    canSave: partIds.length > 0,
    save,
    remove,
  };
}
