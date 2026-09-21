import { Colors } from '@/constants/colors';
import type { GoalProgress } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface Props {
  goalProgress: GoalProgress | null;
  onPress: () => void;
}

/** 벤토 그리드용 절반 폭 타일 — 주간 목표 */
export function GoalTile({ goalProgress, onPress }: Props) {
  return (
    <Pressable className="flex-1 rounded-[16px] bg-card p-[14px]" onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] text-sub">주간 목표</Text>
        <Ionicons
          name={goalProgress ? 'pencil' : 'add-circle-outline'}
          size={14}
          color={Colors.gray2Color}
        />
      </View>

      {goalProgress ? (
        <>
          <Text className="mt-[8px] text-[24px] font-bold text-fg">{goalProgress.percent}%</Text>
          <Text className="mt-[2px] text-[11px] text-sub">
            {goalProgress.achievedCount}/{goalProgress.targetCount}회
          </Text>
          <View className="mt-[8px] h-[5px] overflow-hidden rounded-full bg-line">
            <View
              className="h-full rounded-full bg-accent"
              style={{ width: `${goalProgress.percent}%` }}
            />
          </View>
        </>
      ) : (
        <Text className="mt-[10px] text-[13px] text-sub">설정하기</Text>
      )}
    </Pressable>
  );
}
