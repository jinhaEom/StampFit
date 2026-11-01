import { todayStr } from '@/lib/date';
import type { WorkoutCycleStep, WorkoutLogPart } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import * as Haptics from 'expo-haptics';
import Storage from 'expo-sqlite/kv-store';
import { useState } from 'react';

const NOTICE_KEY = 'quickRecordNoticeHidden'; // 안내 다시 보지 않기
const DEFAULT_MIN = 60; // 처음 하는 단계 기본 시간
const NORMAL = 3; // 강도 '적당히' · 컨디션 '보통'

/** 오늘 싸이클 빠른 기록 (지난번 시간 그대로, 강도·컨디션은 보통) */
export function useQuickRecord(step: WorkoutCycleStep | null) {
  const logs = useWorkoutStore((s) => s.logs);
  const parts = useWorkoutStore((s) => s.parts);
  const saveLog = useWorkoutStore((s) => s.saveLog);
  const stampDate = useWorkoutStore((s) => s.stampDate);
  const [noticeVisible, setNoticeVisible] = useState(false);

  // 기록할 부위 (삭제된 부위 제외)
  const partIds = step?.bodyPartIds.filter((id) => parts.some((p) => p.id === id)) ?? [];
  // 이 부위들을 마지막으로 한 기록
  const lastLog = [...logs]
    .reverse()
    .find((l) => partIds.length > 0 && partIds.every((id) => l.parts.some((p) => p.id === id)));

  /* 지난번 부위별 시간 그대로, 처음이면 1시간 나눠 넣기 */
  const entries: WorkoutLogPart[] = partIds.map((id, i) => {
    const last = lastLog?.parts.find((p) => p.id === id);
    if (last) return { id, durationMin: last.durationMin };
    const share = Math.floor(DEFAULT_MIN / partIds.length);
    return { id, durationMin: share + (i === 0 ? DEFAULT_MIN - share * partIds.length : 0) };
  });
  const minutes = entries.reduce((sum, e) => sum + e.durationMin, 0);

  const save = () => {
    const today = todayStr();
    saveLog({ logDate: today, intensity: NORMAL, condition: NORMAL, memo: null, parts: entries });
    stampDate(today); // 이번 주 칸 도장 연출
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  /* 처음엔 안내 팝업, 다시 보지 않기 했으면 바로 저장 */
  const request = () => {
    if (Storage.getItemSync(NOTICE_KEY) === '1') save();
    else setNoticeVisible(true);
  };

  const confirm = (hideNext: boolean) => {
    if (hideNext) Storage.setItemSync(NOTICE_KEY, '1');
    setNoticeVisible(false);
    save();
  };

  return {
    available: partIds.length > 0,
    label: step?.label ?? '',
    minutes,
    noticeVisible,
    request,
    confirm,
    cancel: () => setNoticeVisible(false),
  };
}
