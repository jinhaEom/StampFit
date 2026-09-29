import { Colors } from '@/constants/colors';
import { formatDuration } from '@/lib/date';
import type { WorkoutLog } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface Props {
  todayLog: WorkoutLog | undefined;
  todayPartNames: string[];
  cycleLabel: string | undefined;
  onPress: () => void;
}

export function TodayRecordBar({ todayLog, todayPartNames, cycleLabel, onPress }: Props) {
  const done = !!todayLog;

  const caption = done
    ? ['오늘', ...todayPartNames].join(' · ')
    : cycleLabel
      ? `오늘 · ${cycleLabel}`
      : '오늘';
  const title = done ? `${formatDuration(todayLog.durationMin)} 완료` : '아직 기록 전이에요';

  return (
    <Pressable
      className="h-[60px] flex-row items-center justify-between rounded-full border border-card-sel bg-card pl-[14px] pr-[8px]"
      onPress={onPress}
    >
      <View className="flex-1 flex-row items-center gap-[10px]">
        {done ? (
          <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-accent">
            <Ionicons name="checkmark" size={18} color={Colors.onAccent} />
          </View>
        ) : (
          <View className="h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-dashed border-dim">
            <Ionicons name="barbell" size={16} color="#6E7075" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-[11px] text-sub" numberOfLines={1}>
            {caption}
          </Text>
          <Text className="mt-[1px] text-[15px] font-semibold text-fg">{title}</Text>
        </View>
      </View>

      {done ? (
        <View className="h-[44px] items-center justify-center rounded-full bg-card-sel px-[18px]">
          <Text className="text-[14px] font-semibold text-fg">수정</Text>
        </View>
      ) : (
        <View className="h-[44px] flex-row items-center gap-[4px] rounded-full bg-accent px-[18px]">
          <Ionicons name="add" size={16} color={Colors.onAccent} />
          <Text className="text-[15px] font-semibold text-on-accent">기록</Text>
        </View>
      )}
    </Pressable>
  );
}
