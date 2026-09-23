import { Colors } from '@/constants/colors';
import { Pressable, Text, View } from 'react-native';
import { StampRing } from './StampRing';

export interface WeekDay {
  date: string;
  stamped: boolean;
  isToday: boolean;
  stampAnimate: boolean;
}

const WEEKDAY = ['월', '화', '수', '목', '금', '토', '일'];

/** 이번 주 도장판 7칸 */
export function WeekGrass({
  days,
  onPressDay,
  onStampPlayed,
}: {
  days: WeekDay[];
  onPressDay?: (date: string) => void;
  onStampPlayed?: () => void;
}) {
  return (
    <View className="flex-row gap-[8px]">
      {days.map((d, i) => (
        <Pressable
          key={d.date}
          className="flex-1 items-center gap-[6px]"
          disabled={!onPressDay}
          onPress={() => onPressDay?.(d.date)}
          hitSlop={4}
        >
          <Cell day={d} onStampPlayed={onStampPlayed} />
          <Text className={`text-[12px] ${d.isToday ? 'font-medium text-fg' : 'text-sub'}`}>
            {WEEKDAY[i]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Cell({ day, onStampPlayed }: { day: WeekDay; onStampPlayed?: () => void }) {
  const highlight = day.stamped || day.isToday;
  return (
    <View className="w-full items-center justify-center" style={{ aspectRatio: 1 }}>
      <View
        className="rounded-full bg-line"
        style={[
          { position: 'absolute', top: 2, right: 2, bottom: 2, left: 2 },
          day.isToday && !day.stamped && { borderWidth: 1, borderColor: Colors.gray2Color },
        ]}
      />
      {day.stamped && <StampRing animate={day.stampAnimate} inset={3} onPlayed={onStampPlayed} />}
      <Text
        className={`text-[14px] ${highlight ? 'text-fg' : 'text-sub'} ${day.isToday ? 'font-semibold' : ''}`}
      >
        {Number(day.date.slice(8, 10))}
      </Text>
    </View>
  );
}
