
import { Colors } from '@/constants/colors';
import { formatDuration, todayStr } from '@/lib/date';
import { heatColor, heatLevel, yearGrid } from '@/lib/heatmap';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

const COL_WIDTH = 14;

/* 히트맵  */
export default function HeatmapView() {
  const today = todayStr();
  const logs = useWorkoutStore((s) => s.logs);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const { width: screenWidth } = useWindowDimensions();
  const hScrollRef = useRef<ScrollView>(null);
  const SCROLL_BOTTOM = 'pb-[24px] ios:pb-[74px] android:pb-[104px]';

  const logsByDate = useMemo(() => new Map(logs.map((l) => [l.logDate, l])), [logs]);
  const { weeks, monthLabels } = useMemo(() => yearGrid(year), [year]);

  // 히트맵을 열면 오늘이 속한 달이 보이도록 
  useEffect(() => {
    const todayIndex = weeks.findIndex((week) => week.includes(today));
    if (todayIndex < 0) return;
    const viewportWidth = screenWidth - 32;
    const targetX = Math.max(0, (todayIndex + 1) * COL_WIDTH - viewportWidth + COL_WIDTH);
    hScrollRef.current?.scrollTo({ x: targetX, y: 0, animated: false });
  }, [weeks, today, screenWidth]);

  const monthly = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const prefix = `${year}-${String(i + 1).padStart(2, '0')}`;
      const monthLogs = logs.filter((l) => l.logDate.startsWith(prefix));
      return {
        month: i + 1,
        count: monthLogs.length,
        min: monthLogs.reduce((s, l) => s + l.durationMin, 0),
      };
    }).filter((m) => m.count > 0);
  }, [logs, year]);

  return (
    <ScrollView
      contentContainerClassName={`px-[16px] ${SCROLL_BOTTOM}`}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-[10px] mt-[18px] flex-row items-center justify-between px-[4px]">
        <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={Colors.gray2Color} />
        </Pressable>
        <Text className="text-[17px] font-medium text-fg">{year}년</Text>
        <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={10}>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray2Color} />
        </Pressable>
      </View>

      <ScrollView ref={hScrollRef} horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View className="mb-[4px] flex-row">
            {monthLabels.map((label, i) => (
              <View key={i} className="w-[14px]">
                {label ? (
                  <Text className="w-[26px] text-[9px] text-sub" numberOfLines={1}>
                    {label}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
          <View className="flex-row">
            {weeks.map((week, wi) => (
              <View key={wi} className="mr-[3px]">
                {week.map((date, di) => {
                  const visible = date !== null && date <= today;
                  return (
                    <View
                      key={di}
                      className="mb-[3px] h-[11px] w-[11px] rounded-[3px]"
                      style={{
                        backgroundColor: visible
                          ? heatColor(heatLevel(logsByDate.get(date)))
                          : 'transparent',
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="mt-[18px] rounded-[16px] bg-card p-[16px]">
        {monthly.length === 0 ? (
          <Text className="text-[13px] text-sub">이 해에는 기록이 없어요</Text>
        ) : (
          monthly.map((m, i) => (
            <View key={m.month} className={`flex-row justify-between ${i > 0 ? 'mt-[12px]' : ''}`}>
              <Text className="text-[14px] text-fg">{m.month}월</Text>
              <Text className="text-[14px] text-sub">
                {m.count}회 · {formatDuration(m.min)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
