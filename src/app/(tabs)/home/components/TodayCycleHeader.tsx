import { Colors } from '@/constants/colors';
import type { WorkoutCycleStep } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface Props {
  /** 싸이클의 현재 단계 — 오늘 기록하면 다음 단계로 넘어간다 */
  currentStep: WorkoutCycleStep | null;
  nextStep: WorkoutCycleStep | null;
  doneToday: boolean;
  onEditCycle: () => void;
}

/** 오늘 할 운동과 그다음. 싸이클이 없으면 정하기 버튼 */
export function TodayCycleHeader({ currentStep, nextStep, doneToday, onEditCycle }: Props) {
  if (!currentStep) {
    return (
      <Pressable className="flex-row items-center gap-[12px] rounded-[20px] bg-card p-[16px]" onPress={onEditCycle}>
        <View
          className="h-[44px] w-[44px] items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(79, 209, 179, 0.14)' }}
        >
          <Ionicons name="repeat" size={20} color={Colors.mainColor} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-fg">운동 싸이클 정하기</Text>
          <Text className="mt-[2px] text-[12px] text-sub">정해두면 오늘 할 운동을 알려드려요</Text>
        </View>
        <View className="h-[36px] items-center justify-center rounded-full bg-accent px-[14px]">
          <Text className="text-[13px] font-bold text-on-accent">정하기</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View className="rounded-[20px] bg-card p-[16px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] text-sub">{doneToday ? '다음 차례' : '오늘 할 운동'}</Text>
        <Pressable className="flex-row items-center gap-[2px]" onPress={onEditCycle} hitSlop={10}>
          <Text className="text-[12px] text-sub">싸이클 편집</Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.gray2Color} />
        </Pressable>
      </View>
      <View className="mt-[6px] flex-row items-baseline gap-[8px]">
        <Text className="shrink text-[24px] font-extrabold text-fg" numberOfLines={1}>
          {currentStep.label}
        </Text>
        {nextStep && (
          <Text className="shrink text-[13px] text-dim" numberOfLines={1}>
            {'Next: ' + nextStep.label}
          </Text>
        )}
      </View>
    </View>
  );
}
