import { Colors } from '@/constants/colors';
import type { WeeklyStreak } from '@/lib/streak';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface Props {
  streak: WeeklyStreak;
  onPressGoal: () => void;
}

/** 홈 상단 (연속 달성 숫자 + 이번 주 목표 칸) */
export function StreakHero({ streak, onPressGoal }: Props) {
  const { weeks, target, count } = streak;
  const achieved = target !== null && count >= target;

  return (
    <View className="px-[4px]">
      <View className="flex-row items-start justify-between gap-[12px]">
        {target === null ? (
          <Text className="flex-1 pt-[6px] text-[20px] font-bold leading-[28px] text-fg">
            주간 목표를 정하면{'\n'}연속 기록이 시작돼요
          </Text>
        ) : weeks > 0 ? (
          <View className="flex-1 flex-row items-end gap-[6px]">
            <Text style={{ fontSize: 64, lineHeight: 68, fontWeight: '800', letterSpacing: -2, color: Colors.mainColor }}>
              {weeks}
            </Text>
            <Text className="pb-[9px] text-[18px] font-bold text-fg">주 연속 목표 달성</Text>
          </View>
        ) : (
          <Text className="flex-1 pt-[6px] text-[20px] font-bold text-fg">이번 주부터 연속 기록 시작</Text>
        )}

        <Pressable className="flex-row items-center gap-[2px] pt-[10px]" onPress={onPressGoal} hitSlop={10}>
          <Text className="text-[12px] text-sub">{target === null ? '목표 정하기' : '목표 수정'}</Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.gray2Color} />
        </Pressable>
      </View>

      {/* 이번 주 목표 칸 (목표 횟수만큼) */}
      {target !== null && (
        <View className="mt-[12px] flex-row items-center gap-[10px]">
          <View className="flex-1 flex-row gap-[4px]">
            {Array.from({ length: target }, (_, i) => (
              <View key={i} className={`h-[8px] flex-1 rounded-full ${i < count ? 'bg-accent' : 'bg-line'}`} />
            ))}
          </View>
          <Text className={`text-[13px] font-semibold ${achieved ? 'text-accent' : 'text-fg'}`}>
            {achieved ? '이번 주 달성' : `${count}/${target}`}
          </Text>
        </View>
      )}
    </View>
  );
}
