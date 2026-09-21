import { AdBanner } from '@/components/AdBanner';
import { Segmented } from '@/components/Segmented';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeatmapView from './components/HeatmapView';
import MonthView from './components/MonthView';
import StatisticsView from './components/StatisticsView';

const TAB_OPTIONS = ['캘린더', '히트맵', '통계'];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initialMode = tab === 'stats' ? TAB_OPTIONS.length - 1 : 0;
  const [mode, setMode] = useState(initialMode);


  const translateX = useRef(new Animated.Value(-screenWidth * initialMode)).current;

  useEffect(() => {
    if (tab !== 'stats') return;
    const statsIndex = TAB_OPTIONS.length - 1;
    setMode(statsIndex);
    translateX.setValue(-screenWidth * statsIndex);
  }, [tab, screenWidth, translateX]);

  const onTabChange = (newMode: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(newMode);

    Animated.timing(translateX, {
      toValue: -screenWidth * newMode,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-[16px] pb-[6px]">
        <Segmented
          options={TAB_OPTIONS}
          value={mode}
          onChange={onTabChange}
        />
      </View>

      <View className="flex-1" style={{ overflow: 'hidden' }}>
        <Animated.View
          style={{
            flex: 1,
            flexDirection: 'row',
            width: screenWidth * TAB_OPTIONS.length,
            transform: [{ translateX }],
          }}
        >
          <View style={{ width: screenWidth, flex: 1 }}>
            <MonthView />
          </View>
          <View style={{ width: screenWidth, flex: 1 }}>
            <HeatmapView />
          </View>
          <View style={{ width: screenWidth, flex: 1 }}>
            <StatisticsView />
          </View>
        </Animated.View>
      </View>

      <View style={{ paddingBottom: insets.bottom }}>
        <AdBanner />
      </View>
    </View>
  );
}
