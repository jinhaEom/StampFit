import { StampDot } from '@/components/StampDot';
import { CONDITION_EMOJI, INTENSITY_LABELS } from '@/constants/recovery';
import { heatLevel } from '@/lib/heatmap';
import type { WorkoutLog } from '@/lib/types';
import type { ComponentProps } from 'react';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

type AnimatedViewStyle = ComponentProps<typeof Animated.View>['style'];

type Props = {
  date: string;
  log: WorkoutLog | undefined;
  partNames: Map<string, string>;
  isToday: boolean;
  isSelected: boolean;
  stampAnimate: boolean;
  onStampPlayed: () => void;
  onSelect: (date: string) => void;
  pillStyle: AnimatedViewStyle;
};


function DayCell({
  date,
  log,
  partNames,
  isToday,
  isSelected,
  stampAnimate,
  onStampPlayed,
  onSelect,
  pillStyle,
}: Props) {
  const parts = log?.parts.flatMap((p) => partNames.get(p.id) ?? []) ?? [];
  const level = heatLevel(log);
  const darkText = level >= 3 && !stampAnimate;

  return (
    <Pressable className="flex-1 items-center py-[3px]" onPress={() => onSelect(date)}>
      <View className="h-[46px] w-[40px] items-center justify-start gap-[2px]">
        {isSelected && (
          <Animated.View
            className="absolute left-0 right-0 top-0 rounded-[24px] bg-cardSelected"
            style={pillStyle}
          />
        )}

        <View className="h-[30px] w-[30px] items-center justify-center">
          {log && <StampDot level={level} animate={stampAnimate} onPlayed={onStampPlayed} />}
          <Text
            className={`text-[15px] ${darkText ? 'text-textOnMain' : 'text-mainText'} ${isToday ? 'font-bold' : ''}`}
          >
            {Number(date.slice(8, 10))}
          </Text>
        </View>

        <Text className="h-[12px] text-[12px] leading-[12px] text-subText1" numberOfLines={1}>
          {parts.length ? `${parts[0]}${parts.length > 1 ? ` +${parts.length - 1}` : ''}` : ''}
        </Text>

        {log && (
          <View
            pointerEvents="none"
            className="absolute top-[49px] items-center"
          >
            <Text className="mb-[1px] text-[10px] leading-[11px] text-subText1" numberOfLines={1}>
              {INTENSITY_LABELS[log.intensity - 1]}
            </Text>
            <Text className="text-[12px] leading-[14px] mt-[2px]">
              {CONDITION_EMOJI[log.condition - 1]}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default memo(DayCell);
