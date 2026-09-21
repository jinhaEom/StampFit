import { Colors } from '@/constants/colors';
import type { WorkoutCycleStep } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  currentCycleStep: WorkoutCycleStep | null;
  nextCycleStep: WorkoutCycleStep | null;
  onEditCycle: () => void;
}

/**
 * 오늘 할 운동 카드
 */
export function TodayCycleHeader({ currentCycleStep, nextCycleStep, onEditCycle }: Props) {
  return (
    <TouchableOpacity
      className="mt-[20px] flex-row items-center gap-[12px] rounded-[20px] bg-card p-[14px]"
      activeOpacity={0.8}
      onPress={onEditCycle}
    >
      <View
        className="h-[44px] w-[44px] items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(79, 209, 179, 0.14)' }}
      >
        <Ionicons name="barbell" size={20} color={Colors.mainColor} />
      </View>

      <View className="flex-1">
        <Text className="text-[11px] text-sub">오늘 할 운동</Text>
        {currentCycleStep ? (
          <>
            <Text className="mt-[2px] text-[18px] font-bold text-fg">{currentCycleStep.label}</Text>
            {nextCycleStep && (
              <Text className="mt-[1px] text-[11px] text-sub">다음 차례: {nextCycleStep.label}</Text>
            )}
          </>
        ) : (
          <Text className="mt-[2px] text-[15px] font-semibold leading-5 text-fg">
            운동 싸이클을 등록해보세요
          </Text>
        )}
      </View>

      <Ionicons
        name={currentCycleStep ? 'pencil' : 'chevron-forward'}
        size={16}
        color={Colors.gray2Color}
      />
    </TouchableOpacity>
  );
}
