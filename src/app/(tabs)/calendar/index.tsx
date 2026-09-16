import { AdBanner } from '@/components/AdBanner';
import { Segmented } from '@/components/Segmented';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeatmapView from './components/HeatmapView';
import MonthView from './components/MonthView';
import StatisticsView from './components/StatisticsView';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [mode, setMode] = useState(0);

  const scrollRef = useRef<ScrollView>(null);

  const onTabChange = (newMode: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(newMode);

    scrollRef.current?.scrollTo({
      x: screenWidth * newMode,
      y: 0,
      animated: true
    });
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-[16px] pb-[6px]">
        <Segmented
          options={['캘린더', '히트맵', '통계']}
          value={mode}
          onChange={onTabChange}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        className="flex-1"
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
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom }}>
        <AdBanner />
      </View>
    </View>
  );
}