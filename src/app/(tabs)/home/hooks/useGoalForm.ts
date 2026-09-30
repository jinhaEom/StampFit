import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useEffect, useState } from 'react';

/** 주간 목표 입력 폼 */
export function useGoalForm() {
  const goal = useWorkoutStore((s) => s.goal);
  const setGoal = useWorkoutStore((s) => s.setGoal);
  const [goalCountInput, setGoalCountInput] = useState(String(goal?.targetCount ?? '')); // 목표 횟수 입력값
  const [goalRecurring, setGoalRecurring] = useState(goal?.recurring ?? true); // 매주 반복 여부
  const [invalidGoalAlertVisible, setInvalidGoalAlertVisible] = useState(false);

  /* 저장된 목표가 바뀌면 입력값도 맞춤 */
  useEffect(() => {
    if (!goal) return;
    setGoalCountInput(String(goal.targetCount));
    setGoalRecurring(goal.recurring);
  }, [goal]);

  // 저장 (1 이상 정수만, 성공 여부 반환)
  const saveGoal = () => {
    const count = parseInt(goalCountInput, 10);
    if (!Number.isFinite(count) || count <= 0) return false;
    setGoal(count, goalRecurring);
    return true;
  };

  return {
    goal,
    goalCountInput,
    setGoalCountInput,
    goalRecurring,
    setGoalRecurring,
    saveGoal,
    invalidGoalAlertVisible,
    setInvalidGoalAlertVisible,
  };
}
