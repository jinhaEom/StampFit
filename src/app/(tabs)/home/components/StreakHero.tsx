import { Colors } from '@/constants/colors';
import { Text, View } from 'react-native';

interface Props {
  consecutiveDays: number;
  hasLoggedToday: boolean;
  /** 과거에 기록한 적이 있는지 (연속 기록이 끊긴 건지, 아예 처음인지 구분용) */
  hasAnyLogs: boolean;
}
export function StreakHero({ consecutiveDays, hasLoggedToday, hasAnyLogs }: Props) {
  const hasStreak = consecutiveDays > 0;
  const streakBroken = !hasStreak && hasAnyLogs;

  const emptyHeadline = streakBroken ? '연속 기록이 끊겼어요, 다시 시작해봐요' : '연속 도전을 시작해보세요!';

  const streakSub = hasStreak
    ? hasLoggedToday
      ? '오늘 도장 완료! 내일도 이어가봐요'
      : '오늘 기록하면 도장이 계속 이어져요'
    : streakBroken
      ? '오늘 기록하면 다시 연속 기록이 시작돼요'
      : '오늘 첫 도장을 찍어보세요';

  return (
    <View className="mt-[8px]">
      {hasStreak ? (
        <View className="mt-[6px] flex-row items-end gap-[6px]">
          <Text style={{ fontSize: 64, lineHeight: 64, fontWeight: '700', color: Colors.mainColor }}>
            {consecutiveDays}
          </Text>
          <Text className="pb-[8px] text-[20px] font-semibold text-fg">일째 연속 기록</Text>
        </View>
      ) : (
        <Text className="mt-[6px] text-[20px] font-semibold text-fg">{emptyHeadline}</Text>
      )}
      <Text className="mt-[6px] text-[13px] text-sub">{streakSub}</Text>
    </View>
  );
}
