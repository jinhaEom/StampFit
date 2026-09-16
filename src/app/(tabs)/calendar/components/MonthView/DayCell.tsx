import { CONDITION_EMOJI, INTENSITY_LABELS } from '@/constants/recovery';
import type { WorkoutLog } from '@/lib/types';
import { Image } from 'expo-image';
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
  expanded: boolean;
  onSelect: (date: string) => void;
  pillStyle: AnimatedViewStyle;
};


function DayCell({
  date,
  log,
  partNames,
  isToday,
  isSelected,
  expanded,
  onSelect,
  pillStyle,
}: Props) {
  const parts = log?.partIds.flatMap((id) => partNames.get(id) ?? []) ?? [];

  return (
    <Pressable className="flex-1 items-center py-[3px]" onPress={() => onSelect(date)}>
      <View className="h-[46px] w-[40px] items-center justify-start gap-[4px] pt-[6px]">
        {isSelected && (
          <Animated.View
            className="absolute left-0 right-0 top-0 rounded-[24px] bg-card-sel"
            style={pillStyle}
          />
        )}

        <Text className={`text-[15px] text-fg ${isToday ? 'font-bold' : ''}`}>
          {Number(date.slice(8, 10))}
        </Text>

        <Text className="h-[12px] text-[12px] leading-[12px] text-sub" numberOfLines={1}>
          {parts.length ? `${parts[0]}${parts.length > 1 ? ` +${parts.length - 1}` : ''}` : ''}
        </Text>

        {log && (
          <View
            pointerEvents="none"
            className="absolute top-[49px] items-center"
          >
            <Text className="mb-[1px] text-[10px] leading-[11px] text-sub" numberOfLines={1}>
              {INTENSITY_LABELS[log.intensity - 1]}
            </Text>
            <Text className="text-[12px] leading-[14px] mt-[2px]">
              {CONDITION_EMOJI[log.condition - 1]}
            </Text>
          </View>
        )}

        {log && !expanded && (
          <View pointerEvents="none" className="absolute top-[42px] h-[5px] w-[5px]">
            <Image
              source={require('@/assets/images/ic_mint_dot.png')}
              style={{ width: 5, height: 5 }}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default memo(DayCell);
