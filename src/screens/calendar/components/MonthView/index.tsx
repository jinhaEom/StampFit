import { GRID_HEIGHT, ROW_HEIGHT } from '../../constants';
import DayDetail from '@/components/DayDetail';
import { Colors } from '@/constants/colors';
import { SCROLL_BOTTOM, WEEKDAY } from '@/constants/constant';
import { todayStr } from '@/lib/date';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { type MonthPage, useMonthPager } from '../../hooks/useMonthPager';
import DayCell from './DayCell';

export default function MonthView() {
  const today = todayStr();
  const logs = useWorkoutStore((s) => s.logs);
  const partNamesById = useWorkoutStore((s) => s.partNamesById);
  const stampingDate = useWorkoutStore((s) => s.stampingDate);
  const clearStamping = useWorkoutStore((s) => s.clearStamping);
  const [selected, setSelected] = useState(today);
  const pager = useMonthPager();

  const logsByDate = useMemo(() => new Map(logs.map((l) => [l.logDate, l])), [logs]);
  const partNames = useMemo(() => new Map(Object.entries(partNamesById)), [partNamesById]);

  const renderMonth = ({ item }: { item: MonthPage }) => (
    <View style={{ width: pager.pageWidth }}>
      {item.weeks.map((week, wi) => (
        <View key={wi} className="flex-row" style={{ height: ROW_HEIGHT }}>
          {week.map((date, di) => {
            if (!date) return <View key={di} className="flex-1 py-[3px]" />;
            return (
              <DayCell
                key={di}
                date={date}
                log={logsByDate.get(date)}
                partNames={partNames}
                isToday={date === today}
                isSelected={date === selected}
                stampAnimate={date === stampingDate}
                onStampPlayed={clearStamping}
                onSelect={setSelected}
              />
            );
          })}
        </View>
      ))}
    </View>
  );

  const isCurrentMonth =
    pager.current.year === Number(today.slice(0, 4)) &&
    pager.current.month === Number(today.slice(5, 7));

  const goToday = () => {
    pager.goToToday();
    setSelected(today);
  };

  return (
    <View className="flex-1">
      <View className="px-[16px]">
        <View className="mb-[10px] mt-[18px] flex-row items-center justify-between px-[4px]">
          <Pressable onPress={() => pager.goToMonth(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={Colors.subText1} />
          </Pressable>
          <View className="flex-row items-center gap-[8px]">
            <Text className="text-[17px] font-medium text-mainText">
              {pager.current.year}년 {pager.current.month}월
            </Text>
            {!isCurrentMonth && (
              <Pressable className="rounded-full bg-cardBackground px-[10px] py-[4px]" onPress={goToday} hitSlop={8}>
                <Text className="text-[12px] text-subText1">오늘</Text>
              </Pressable>
            )}
          </View>
          <Pressable onPress={() => pager.goToMonth(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color={Colors.subText1} />
          </Pressable>
        </View>

        <View className="mb-[4px] flex-row">
          {WEEKDAY.map((w) => (
            <Text key={w} className="flex-1 text-center text-[13px] text-subText1">
              {w}
            </Text>
          ))}
        </View>

        <FlatList
          style={{ height: GRID_HEIGHT }}
          ref={pager.listRef}
          data={pager.months}
          keyExtractor={(m) => `${m.year}-${m.month}`}
          renderItem={renderMonth}
          initialScrollIndex={pager.initialIndex}
          getItemLayout={pager.getItemLayout}
          onMomentumScrollEnd={pager.onMomentumScrollEnd}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialNumToRender={1}
          maxToRenderPerBatch={3}
          windowSize={3}
        />
      </View>

      <ScrollView
        className="mt-[12px] flex-1"
        contentContainerClassName={`px-[16px] ${SCROLL_BOTTOM}`}
        showsVerticalScrollIndicator={false}
      >
        <DayDetail date={selected} log={logsByDate.get(selected)} />
      </ScrollView>
    </View>
  );
}
