import { WeekGrass, type WeekDay } from '@/components/WeekGrass';
import { formatDuration } from '@/lib/date';
import { Text, View } from 'react-native';

interface Props {
  days: WeekDay[];
  weekMin: number;
  onPressDay: (date: string) => void;
  onStampPlayed: () => void;
}

/** 이번 주 — 요일별 7칸 도장 */
export function WeekCard({ days, weekMin, onPressDay, onStampPlayed }: Props) {
  return (
    <View className="rounded-[20px] bg-card p-[16px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] text-sub">이번 주</Text>
        <Text className="text-[13px] text-sub">{weekMin > 0 ? `총 ${formatDuration(weekMin)}` : '아직 기록이 없어요'}</Text>
      </View>
      <View className="mt-[12px]">
        <WeekGrass days={days} onPressDay={onPressDay} onStampPlayed={onStampPlayed} />
      </View>
    </View>
  );
}
