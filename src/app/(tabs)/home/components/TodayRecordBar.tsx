import { Colors } from '@/constants/colors';
import { formatDuration, formatKorean, todayStr } from '@/lib/date';
import type { WorkoutLog } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface Props {
  todayLog: WorkoutLog | undefined;
  onPress: () => void;
}

/** 홈 하단 바 (오늘 기록 상태 + 기록·수정 버튼) */
export function TodayRecordBar({ todayLog, onPress }: Props) {
  const done = !!todayLog;
  const title = done ? `오늘 ${formatDuration(todayLog.durationMin)} 완료` : '아직 기록 전이에요';

  return (
    <Pressable
      className="h-[60px] flex-row items-center justify-between rounded-full border border-cardSelected bg-cardBackground pl-[14px] pr-[8px]"
      onPress={onPress}
    >
      <View className="flex-1 flex-row items-center gap-[10px]">
        {done ? (
          <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-main">
            <Ionicons name="checkmark" size={18} color={Colors.textOnMain} />
          </View>
        ) : (
          <View className="h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-dashed border-subText2">
            <Ionicons name="barbell" size={16} color="#6E7075" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-[12px] text-subText1">{formatKorean(todayStr())}</Text>
          <Text className="mt-[1px] text-[15px] font-semibold text-mainText">{title}</Text>
        </View>
      </View>

      {done ? (
        <View className="h-[44px] items-center justify-center rounded-full bg-cardSelected px-[18px]">
          <Text className="text-[14px] font-semibold text-mainText">수정</Text>
        </View>
      ) : (
        <View className="h-[44px] flex-row items-center gap-[4px] rounded-full bg-main px-[18px]">
          <Ionicons name="add" size={16} color={Colors.textOnMain} />
          <Text className="text-[15px] font-semibold text-textOnMain">기록</Text>
        </View>
      )}
    </Pressable>
  );
}
