import { Colors } from '@/constants/colors';
import type { WorkoutCycleStep } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface Props {
  currentStep: WorkoutCycleStep | null; // 지금 차례 (기록하면 다음으로 넘어감)
  nextStep: WorkoutCycleStep | null;
  doneToday: boolean;
  onPress: () => void; // 싸이클 있으면 차례 고르기, 없으면 정하기
}

/** 오늘 할 운동·그다음 (싸이클 없으면 정하기 버튼) */
export function TodayCycleHeader({ currentStep, nextStep, doneToday, onPress }: Props) {
  if (!currentStep) {
    return (
      <Pressable className="flex-row items-center gap-[12px] rounded-[20px] bg-cardBackground p-[16px]" onPress={onPress}>
        <View
          className="h-[44px] w-[44px] items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(79, 209, 179, 0.14)' }}
        >
          <Ionicons name="repeat" size={20} color={Colors.main} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-mainText">운동 싸이클 정하기</Text>
          <Text className="mt-[2px] text-[12px] text-subText1">정해두면 오늘 할 운동을 알려드려요</Text>
        </View>
        <View className="h-[36px] items-center justify-center rounded-full bg-main px-[14px]">
          <Text className="text-[13px] font-bold text-textOnMain">정하기</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable className="flex-row items-center gap-[12px] rounded-[20px] bg-cardBackground p-[16px]" onPress={onPress}>
      <View className="flex-1">
        <Text className="text-[13px] text-subText1">{doneToday ? '다음 차례' : '오늘 할 운동'}</Text>
        <View className="mt-[6px] flex-row items-baseline gap-[8px]">
          <Text className="shrink text-[24px] font-extrabold text-mainText" numberOfLines={1}>
            {currentStep.label}
          </Text>
          {nextStep && (
            <Text className="shrink text-[13px] text-subText2" numberOfLines={1}>
              {'Next: ' + nextStep.label}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.subText2} />
    </Pressable>
  );
}
