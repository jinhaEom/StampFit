import { Colors } from '@/constants/colors';
import type { WeeklyStreak } from '@/lib/streak';
import { Pressable, Text, View } from 'react-native';

interface Props {
  streak: WeeklyStreak;
  onPressSetGoal: () => void;
}

export function StreakHero({ streak, onPressSetGoal }: Props) {
  const { weeks, target, count } = streak;

  // 목표를 정하기 전엔 연속을 세지 않는다
  if (target === null) {
    return (
      <Pressable className="mt-[8px]" onPress={onPressSetGoal}>
        <Text className="mt-[6px] text-[20px] font-semibold text-fg">
          주간 목표를 정하면 연속 기록이 시작돼요
        </Text>
        <Text className="mt-[6px] text-[13px] text-sub">주간 목표 정하기 ›</Text>
      </Pressable>
    );
  }

  const remaining = target - count;

  return (
    <View className="mt-[8px]">
      {weeks > 0 ? (
        <View className="mt-[6px] flex-row items-end gap-[6px]">
          <Text style={{ fontSize: 64, lineHeight: 64, fontWeight: '700', color: Colors.mainColor }}>
            {weeks}
          </Text>
          <Text className="pb-[8px] text-[20px] font-semibold text-fg">주 연속 목표 달성</Text>
        </View>
      ) : (
        <Text className="mt-[6px] text-[20px] font-semibold text-fg">연속 도전을 시작해보세요!</Text>
      )}
      <Text className="mt-[6px] text-[13px] text-sub">
        {remaining > 0
          ? `이번 주 도장 ${remaining}개 더 찍으면 목표 달성이에요`
          : '이번 주 목표 달성! 다음 주도 이어가봐요'}
      </Text>
    </View>
  );
}
