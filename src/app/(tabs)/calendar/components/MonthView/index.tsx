import { Colors } from '@/constants/colors';
import { SCROLL_BOTTOM, WEEKDAY } from '@/constants/constant';
import { todayStr } from '@/lib/date';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import {
  GRID_MAX_HEIGHT,
  MonthPage,
  PAGE_WIDTH,
  ROW_HEIGHT,
  useCalendar,
} from '../../hooks/useCalendar';
import DayDetail from '../DayDetail';
import DayCell from './DayCell';

export default function MonthView() {
  const today = todayStr();
  const logs = useWorkoutStore((s) => s.logs);
  const partNamesById = useWorkoutStore((s) => s.partNamesById);
  const [selected, setSelected] = useState(today);
  const { pager, expandGesture, gridHeightStyle, rowStyles, pillStyle, expanded } = useCalendar();

  const logsByDate = useMemo(() => new Map(logs.map((l) => [l.logDate, l])), [logs]);
  const partNames = useMemo(() => new Map(Object.entries(partNamesById)), [partNamesById]);

  const renderMonth = ({ item }: { item: MonthPage }) => (
    <View style={{ width: PAGE_WIDTH }}>
      {item.weeks.map((week, wi) => (
        <Animated.View
          key={wi}
          className="flex-row bg-bg"
          style={[{ height: ROW_HEIGHT }, rowStyles[wi]]}
        >
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
                expanded={expanded}
                onSelect={setSelected}
                pillStyle={pillStyle}
              />
            );
          })}
        </Animated.View>
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
            <Ionicons name="chevron-back" size={20} color={Colors.gray2Color} />
          </Pressable>
          <View className="flex-row items-center gap-[8px]">
            <Text className="text-[17px] font-medium text-fg">
              {pager.current.year}년 {pager.current.month}월
            </Text>

          </View>
          <Pressable onPress={() => pager.goToMonth(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray2Color} />
          </Pressable>
        </View>

        <View className="mb-[4px] flex-row">
          {WEEKDAY.map((w) => (
            <Text key={w} className="flex-1 text-center text-[13px] text-sub">
              {w}
            </Text>
          ))}
        </View>

        <GestureDetector gesture={expandGesture}>
          <Animated.View style={[gridHeightStyle, { overflow: 'hidden' }]}>
            <FlatList
              style={{ height: GRID_MAX_HEIGHT }}
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
          </Animated.View>
        </GestureDetector>
        {!isCurrentMonth && (
          <Pressable
            className="rounded-full bg-card px-[12px] py-[4px]  items-center justify-center self-end"
            onPress={goToday}
            hitSlop={8}
          >
            <View className='flex-row items-center gap-[4px]'>

              <Ionicons name="caret-back-circle" size={20} color={'white'} />
              <Text className="text-[12px] text-white">오늘로 돌아가기</Text>
            </View>
          </Pressable>
        )}
      </View>

      <ScrollView
        className="flex-1 mt-[12px]"
        contentContainerClassName={`px-[16px] ${SCROLL_BOTTOM}`}
        showsVerticalScrollIndicator={false}
      >
         <DayDetail date={selected} log={logsByDate.get(selected)} />
      </ScrollView>
    </View>
  );
}
