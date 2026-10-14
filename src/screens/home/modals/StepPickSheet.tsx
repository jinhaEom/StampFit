import { BottomSheet } from '@/components/BottomSheet';
import { Colors } from '@/constants/colors';
import { todayStr } from '@/lib/date';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEditCycle: () => void;
}

export function StepPickSheet({ visible, onClose, onEditCycle }: Props) {
  const cycle = useWorkoutStore((s) => s.cycle);
  const setCycleCurrent = useWorkoutStore((s) => s.setCycleCurrent);
  const doneToday = useWorkoutStore((s) => s.logs.some((l) => l.logDate === todayStr()));
  if (!cycle) return null;
  const currentId = cycle.steps[cycle.currentIndex].id;

  const pick = (id: string) => {
    if (id !== currentId) {
      Haptics.selectionAsync();
      setCycleCurrent(id);
    }
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={doneToday ? '다음엔 어떤 운동을 할까요?' : '오늘은 어떤 운동을 할까요?'}
      description="고른 운동부터 싸이클이 이어져요"
    >
      <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
        {cycle.steps.map((step, index) => {
          const isCurrent = step.id === currentId;
          return (
            <Pressable
              key={step.id}
              className={`flex-row items-center gap-[12px] rounded-[14px] px-[12px] py-[14px] ${isCurrent ? 'bg-main/10' : ''}`}
              onPress={() => pick(step.id)}
            >
              <View
                className={`h-[26px] w-[26px] items-center justify-center rounded-full ${isCurrent ? 'bg-main' : 'bg-cardSelected'}`}
              >
                <Text className={`text-[13px] font-semibold ${isCurrent ? 'text-textOnMain' : 'text-subText1'}`}>
                  {index + 1}
                </Text>
              </View>
              <Text
                className={`flex-1 text-[16px] ${isCurrent ? 'font-semibold text-main' : 'text-mainText'}`}
                numberOfLines={1}
              >
                {step.label}
              </Text>
              {isCurrent && <Ionicons name="checkmark" size={20} color={Colors.main} />}
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable className="mt-[16px] items-center rounded-[14px] bg-cardSelected py-[15px]" onPress={onEditCycle}>
        <Text className="text-[15px] font-semibold text-mainText">싸이클 편집하기</Text>
      </Pressable>
    </BottomSheet>
  );
}
