import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  options: string[];
  value: number;
  onChange: (index: number) => void;
}

/** 상단 세그먼트 탭 (선택 표시 미끄러짐) */
export function Segmented({ options, value, onChange }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);

  const padding = 3;
  const itemCount = options.length;
  const itemWidth = containerWidth > 0 ? (containerWidth - padding * 2) / itemCount : 0;

  useEffect(() => {
    if (itemWidth > 0) {
      translateX.value = withTiming(value * itemWidth, {
        duration: 220,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [value, itemWidth]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    const initialItemW = (w - padding * 2) / itemCount;
    translateX.value = value * initialItemW;
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={onLayout}
      className="relative flex-row rounded-[12px] bg-cardBackground p-[3px] overflow-hidden"
    >
      {/* 선택 표시 배경 */}
      {itemWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: padding,
              bottom: padding,
              left: padding,
              width: itemWidth,
            },
            indicatorStyle,
          ]}
          className="rounded-[9px] bg-cardSelected"
        />
      )}

      {options.map((opt, i) => (
        <Pressable
          key={opt}
          onPress={() => onChange(i)}
          className="flex-1 items-center justify-center rounded-[9px] py-[7px]"
        >
          <Text
            className={`text-[13px] ${i === value ? 'font-semibold text-mainText' : 'font-normal text-subText1'
              }`}
          >
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default Segmented;
