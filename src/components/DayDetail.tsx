import { AlertModal } from '@/components/AlertModal';
import { Colors } from '@/constants/colors';
import { CONDITION_EMOJI, CONDITION_LABELS, INTENSITY_LABELS } from '@/constants/recovery';
import { formatDuration, formatKorean, todayStr } from '@/lib/date';
import type { WorkoutLog } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

/** 날짜 탭 시 상세 */
export default function DayDetail({
  date,
  log,
  onBeforeNavigate,
  onAfterDelete,
  onClose,
}: {
  date: string;
  log: WorkoutLog | undefined;
  onBeforeNavigate?: () => void;
  onAfterDelete?: () => void;
  onClose?: () => void; // 있으면 헤더에 닫기 버튼 (모달용)
}) {
  const router = useRouter();
  const today = todayStr();
  const partNamesById = useWorkoutStore((s) => s.partNamesById);
  const removeLog = useWorkoutStore((s) => s.removeLog);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const maxMin = Math.max(1, ...(log?.parts.map((p) => p.durationMin) ?? []));

  const goRecord = () => {
    onBeforeNavigate?.();
    router.push({ pathname: '/record', params: { date } });
  };

  return (
    <View className="rounded-[16px] bg-cardBackground p-[16px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] text-subText1">{formatKorean(date)}</Text>
        <View className="flex-row items-center gap-[16px]">
          {log ? (
            <>
              <Pressable onPress={goRecord} hitSlop={8}>
                <Ionicons name="pencil" size={18} color={Colors.subText1} />
              </Pressable>
              <Pressable onPress={() => setConfirmVisible(true)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={Colors.subText1} />
              </Pressable>
            </>
          ) : null}
          {onClose ? (
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.subText1} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!log ? (
        date > today ? (
          <Text className="mt-[8px] text-[13px] text-subText1">미래 날짜예요</Text>
        ) : (

          <TouchableOpacity
            className="mt-[12px] flex-row items-center justify-center gap-[6px] rounded-[14px] bg-main/10 py-[13px] "
            onPress={goRecord}
          >
            <Ionicons name="add" size={20} color={Colors.main} />
            <Text className="text-[15px] font-medium text-main">운동 기록하기</Text>
          </TouchableOpacity>
        )
      ) : (
        <>
          {/* 총 시간 */}
          <Text className="mt-[6px] text-[26px] font-semibold text-mainText">{formatDuration(log.durationMin)}</Text>

          {/* 부위별 시간 막대 */}
          <View className="mt-[14px] gap-[10px]">
            {log.parts.map((p) => {
              const name = partNamesById[p.id];
              if (!name) return null;
              return (
                <View key={p.id} className="flex-row items-center gap-[10px]">
                  <Text className="w-[72px] text-[14px] text-mainText" numberOfLines={1}>
                    {name}
                  </Text>
                  <View className="h-[6px] flex-1 rounded-full bg-border">
                    <View
                      className="h-[6px] rounded-full bg-main"
                      style={{ width: `${(p.durationMin / maxMin) * 100}%` }}
                    />
                  </View>
                  <Text className="w-[44px] text-right text-[13px] text-subText1">{p.durationMin}분</Text>
                </View>
              );
            })}
          </View>

          {/* 강도 · 컨디션 */}
          <View className="mt-[16px] flex-row gap-[8px]">
            <View className="flex-1 rounded-[12px] bg-background px-[12px] py-[10px]">
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] text-subText1">강도</Text>
                <View className="flex-row gap-[3px]">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <View
                      key={n}
                      className={`h-[6px] w-[6px] rounded-full ${n <= log.intensity ? 'bg-main' : 'bg-border'}`}
                    />
                  ))}
                </View>
              </View>
              <Text className="mt-[4px] text-[15px] text-mainText">{INTENSITY_LABELS[log.intensity - 1]}</Text>
            </View>
            <View className="flex-1 rounded-[12px] bg-background px-[12px] py-[10px]">
              <Text className="text-[12px] text-subText1">컨디션</Text>
              <Text className="mt-[4px] text-[15px] text-mainText">
                {CONDITION_EMOJI[log.condition - 1]} {CONDITION_LABELS[log.condition - 1]}
              </Text>
            </View>
          </View>

          {log.memo ? (
            <View className="mt-[8px] rounded-[12px] bg-background px-[12px] py-[10px]">
              <Text className="text-[13px] text-subText1">{log.memo}</Text>
            </View>
          ) : null}
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
          onAfterDelete?.();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}
