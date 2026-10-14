import { Colors } from '@/constants/colors';
import { SCROLL_BOTTOM } from '@/constants/constant';
import type { WorkoutCycleStep } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepPartsSheet } from './modals/StepPartsSheet';

export default function CycleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cycle = useWorkoutStore((s) => s.cycle);
  const setCycle = useWorkoutStore((s) => s.setCycle);
  const steps = cycle?.steps ?? [];

  const [editMode, setEditMode] = useState(false);
  const [sheet, setSheet] = useState({ key: 0, open: false, stepId: null as string | null });
  const openSheet = (stepId: string | null) => setSheet((s) => ({ key: s.key + 1, open: true, stepId }));
  const closeSheet = () => setSheet((s) => ({ ...s, open: false }));

  const canReorder = steps.length > 1;

  const renderStep = ({ item, drag, isActive, getIndex }: RenderItemParams<WorkoutCycleStep>) => {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <Pressable
          className={`min-h-[60px] flex-row items-center gap-[12px] bg-cardBackground px-[16px] ${
            index < steps.length - 1 || !editMode ? 'border-b border-border' : ''
          } ${isActive ? 'opacity-70' : ''}`}
          onPress={() => openSheet(item.id)}
          disabled={editMode}
        >
          <View className="h-[26px] w-[26px] items-center justify-center rounded-full bg-cardSelected">
            <Text className="text-[13px] font-semibold text-subText1">{index + 1}</Text>
          </View>
          <Text className="flex-1 text-[16px] text-mainText" numberOfLines={1}>
            {item.label}
          </Text>
          {editMode ? (
            <TouchableOpacity onPressIn={drag} disabled={isActive} hitSlop={8}>
              <Ionicons name="reorder-three" size={22} color={Colors.subText1} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={18} color={Colors.subText2} />
          )}
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <View className="h-[40px] flex-row items-center justify-between px-[16px]">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.subText1} />
        </Pressable>
        {canReorder && (
          <Pressable onPress={() => setEditMode((v) => !v)} hitSlop={8}>
            <Text className={`text-[15px] ${editMode ? 'font-semibold text-main' : 'text-mainText'}`}>
              {editMode ? '완료' : '순서 변경'}
            </Text>
          </Pressable>
        )}
      </View>

      <NestableScrollContainer contentContainerClassName={`px-[16px] ${SCROLL_BOTTOM}`} showsVerticalScrollIndicator={false}>
        <View className="mb-[24px] mt-[12px] px-[4px]">
          <Text className="text-[26px] font-bold text-mainText">운동 싸이클</Text>
          <Text className="mt-[8px] text-[15px] leading-[22px] text-subText1">
            {editMode
              ? '끌어서 순서를 바꿔요'
              : steps.length === 0
                ? '하체 → 가슴 → 등처럼 순서를 정해두면\n오늘 할 운동을 알려드려요'
                : '기록할 때마다 다음 단계로 넘어가요'}
          </Text>
        </View>

        <View className="overflow-hidden rounded-[16px] bg-cardBackground">
          <NestableDraggableFlatList
            data={steps}
            onDragEnd={({ data }) => setCycle(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderStep}
          />
          {!editMode && (
            <Pressable className="min-h-[60px] flex-row items-center gap-[12px] px-[16px]" onPress={() => openSheet(null)}>
              <Ionicons name="add-circle" size={26} color={Colors.main} />
              <Text className="text-[16px] font-medium text-main">단계 추가</Text>
            </Pressable>
          )}
        </View>
      </NestableScrollContainer>

      <StepPartsSheet key={sheet.key} visible={sheet.open} stepId={sheet.stepId} onClose={closeSheet} />
    </View>
  );
}
