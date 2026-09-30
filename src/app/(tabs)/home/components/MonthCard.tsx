import { Colors } from '@/constants/colors';
import type { MonthlyAnalytics } from '@/lib/analytics';
import { formatDuration } from '@/lib/date';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

interface Props {
  analytics: MonthlyAnalytics;
  onPress: () => void;
}

/** 이번 달 — 운동 일수·시간과 부위 비중. 누르면 통계 탭으로 */
export function MonthCard({ analytics, onPress }: Props) {
  const { hasData, month, totalCount, totalMinutes, partStats, topParts } = analytics;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable className="rounded-[20px] bg-card p-[16px] active:opacity-80" onPress={handlePress}>
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] text-sub">{month}월</Text>
        <View className="flex-row items-center gap-[2px]">
          <Text className="text-[12px] text-sub">통계</Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.gray2Color} />
        </View>
      </View>

      {hasData ? (
        <>
          <Text className="mt-[6px] text-[20px] font-bold text-fg">
            {totalCount}일 · 총 {formatDuration(totalMinutes)}
          </Text>

          {/* 부위 비중 막대 */}
          <View className="mt-[14px] h-[6px] flex-row overflow-hidden rounded-full bg-line">
            {partStats.map((p) => (
              <View key={p.id} style={{ width: `${p.percentage}%`, backgroundColor: p.color }} />
            ))}
          </View>
          <View className="mt-[10px] flex-row flex-wrap gap-x-[14px] gap-y-[4px]">
            {topParts.map((p) => (
              <View key={p.id} className="flex-row items-center gap-[6px]">
                <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: p.color }} />
                <Text className="text-[12px] text-sub">
                  {p.name} {p.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text className="mt-[6px] text-[15px] text-sub">이번 달 첫 도장을 찍어보세요</Text>
      )}
    </Pressable>
  );
}
