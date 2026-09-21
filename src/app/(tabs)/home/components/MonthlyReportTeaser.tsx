import { Colors } from '@/constants/colors';
import type { MonthlyAnalytics } from '@/lib/analytics';
import { formatDuration } from '@/lib/date';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  analytics: MonthlyAnalytics;
  onPress: () => void;
}

export function MonthlyReportTeaser({ analytics, onPress }: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      className="flex-row items-center justify-between rounded-[16px] bg-card p-[16px]"
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <Text className="text-[13px] text-sub">
        {analytics.hasData
          ? `${analytics.totalCount}일 · 총 ${formatDuration(analytics.totalMinutes)}`
          : '아직 기록이 없어요'}
      </Text>
      <View className="flex-row items-center gap-[2px]">
        <Text className="text-[12px] text-sub">자세히</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.gray2Color} />
      </View>
    </TouchableOpacity>
  );
}
