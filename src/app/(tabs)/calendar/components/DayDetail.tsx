import { AlertModal } from '@/components/AlertModal';
import { Chip } from '@/components/Chip';
import { CONDITION_EMOJI, INTENSITY_LABELS } from '@/constants/recovery';
import { formatDuration, formatKorean, todayStr } from '@/lib/date';
import type { WorkoutLog } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
/** 날짜 탭 시 상세  */


export default function DayDetail({ date, log }: { date: string; log: WorkoutLog | undefined }) {
  const router = useRouter();
  const today = todayStr();
  const partNamesById = useWorkoutStore((s) => s.partNamesById);
  const removeLog = useWorkoutStore((s) => s.removeLog);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const goRecord = () => router.push({ pathname: '/record', params: { date } });

  return (
    <View className="rounded-[16px] bg-card p-[16px]">
      <Text className="text-[15px] font-medium text-fg">{formatKorean(date)}</Text>
      {!log ? (
        date > today ? (
          <Text className="mt-[8px] text-[13px] text-sub">미래 날짜예요</Text>
        ) : (
          <Pressable
            className="mt-[12px] items-center rounded-[14px] border border-line py-[12px]"
            onPress={goRecord}
          >
            <Text className="text-[15px] font-medium text-fg">이 날짜에 기록하기</Text>
          </Pressable>
        )
      ) : (
        <>
          <View className="mt-[10px] flex-row flex-wrap gap-[6px]">
            {log.parts.map((p) => {
              const name = partNamesById[p.id];
              return name ? (
                <Chip key={p.id} label={`${name} ${p.durationMin}분`} small />
              ) : null;
            })}
          </View>
          <Text className="mt-[10px] text-[14px] text-fg">
            {formatDuration(log.durationMin)} · 강도 {log.intensity} (
            {INTENSITY_LABELS[log.intensity - 1]}) · 컨디션 {CONDITION_EMOJI[log.condition - 1]}
          </Text>
          {log.memo ? <Text className="mt-[6px] text-[13px] text-sub">{log.memo}</Text> : null}
          <View className="mt-[14px] flex-row gap-[20px]">
            <Pressable onPress={goRecord} hitSlop={8}>
              <Text className="text-[14px] font-medium text-fg">수정</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmVisible(true)} hitSlop={8}>
              <Text className="text-[14px] text-danger">삭제</Text>
            </Pressable>
          </View>
        </>
      )}
      <AlertModal
        visible={confirmVisible}
        title="기록 삭제"
        contents="기록을 삭제하시겠습니까?"
        okLabel="삭제"
        cancelLabel="취소"
        danger
        onOk={() => {
          setConfirmVisible(false);
          removeLog(date);
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}