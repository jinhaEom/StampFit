import { Colors } from '@/constants/colors';
import { CONDITION_LABELS, CONDITION_EMOJI, INTENSITY_LABELS } from '@/constants/recovery';
import { formatCompareText, getMonthlyAnalytics } from '@/lib/analytics';
import { addDays, formatDuration, monthMatrix, todayStr, weekStart } from '@/lib/date';
import { goalTargetForWeek } from '@/lib/streak';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const EMPTY_GRID = [12, 36, 60]; // 빈 도장판 점 좌표 (3x3)
const SCROLL_BOTTOM = 'pb-[24px] ios:pb-[74px] android:pb-[104px]';
const CHART_HEIGHT = 90; // 주별 막대 영역 높이

/* 라벨 위치 */
const toLabelIndex = (avg: number) => Math.max(0, Math.min(4, Math.round(avg) - 1));

/* 캘린더 탭 -> 통계 View*/
export default function StatisticsView() {
  const router = useRouter();
  const today = todayStr();
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const logs = useWorkoutStore((s) => s.logs);
  const partNamesById = useWorkoutStore((s) => s.partNamesById);
  const goalHistory = useWorkoutStore((s) => s.goalHistory);

  const analytics = useMemo(() => {
    return getMonthlyAnalytics(logs, partNamesById, year, month);
  }, [logs, partNamesById, year, month]);

  const compareText = formatCompareText(analytics.totalCount, analytics.prevMonthDiff.diffCount); // 지난달 비교 문구
  const topParts = analytics.partStats.slice(0, 5); // 많이 한 부위 (최대 5개)
  const maxPartMin = Math.max(1, ...topParts.map((p) => p.minutes)); // 부위 막대 기준 (가장 긴 부위)

  /* 주별 운동 횟수*/
  const weekBars = useMemo(() => {
    const logDates = new Set(logs.map((l) => l.logDate));
    return monthMatrix(year, month).map((week) => {
      const first = week.find((d) => d !== null) as string; // 이 줄의 이 달 첫날
      const monday = weekStart(first);
      const count = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => logDates.has(d)).length;
      return {
        count: first > today ? null : count,
        target: goalTargetForWeek(goalHistory, monday),
      };
    });
  }, [logs, goalHistory, year, month, today]);

  const pastBars = weekBars.filter((w) => w.count !== null); // 지난·이번 주
  const goalLine = pastBars.length > 0 ? pastBars[pastBars.length - 1].target : null; // 점선 목표 (가장 최근 주 기준)
  const achievedWeeks = pastBars.filter((w) => w.target !== null && (w.count ?? 0) >= w.target).length;
  const chartMax = Math.max(1, goalLine ?? 0, ...pastBars.map((w) => w.count ?? 0)) + 1; // 막대 높이 기준

  const isCurrentMonth = year === currentYear && month === currentMonth;

  const goToPrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setYear(currentYear);
    setMonth(currentMonth);
  };

  return (
    <ScrollView
      contentContainerClassName={`px-[16px] ${SCROLL_BOTTOM}`}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-[10px] mt-[18px] flex-row items-center justify-between px-[4px]">
        <Pressable onPress={goToPrevMonth} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={Colors.subText1} />
        </Pressable>
        <View className="flex-row items-center gap-[8px]">
          <Text className="text-[17px] font-medium text-mainText">
            {year}년 {month}월
          </Text>
          {!isCurrentMonth && (
            <Pressable
              className="rounded-full bg-cardBackground px-[10px] py-[4px]"
              onPress={goToToday}
              hitSlop={8}
            >
              <Text className="text-[12px] text-subText1">이번 달</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={goToNextMonth} hitSlop={10}>
          <Ionicons name="chevron-forward" size={20} color={Colors.subText1} />
        </Pressable>
      </View>

      {!analytics.hasData ? (
        /* 기록 없음 (빈 도장판) */
        <View className="mt-[24px] items-center rounded-[20px] bg-cardBackground px-[20px] py-[28px]">
          <Svg width={72} height={72} viewBox="0 0 72 72">
            {EMPTY_GRID.map((cy) =>
              EMPTY_GRID.map((cx) =>
                cx === 36 && cy === 36 ? (
                  <Circle
                    key="center"
                    cx={36}
                    cy={36}
                    r={9.5}
                    fill="none"
                    stroke={Colors.main}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                ) : (
                  <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={8} fill={Colors.main} opacity={0.18} />
                ),
              ),
            )}
          </Svg>
          <Text className="mt-[16px] text-[16px] font-medium text-mainText">이 달은 아직 비어 있어요</Text>
          <Text className="mt-[4px] text-[13px] text-subText1">첫 도장을 찍으면 통계가 채워져요</Text>
          {isCurrentMonth ? (
            <Pressable
              onPress={() => router.push('/record')}
              className="mt-[18px] rounded-[12px] bg-main px-[18px] py-[10px]"
            >
              <Text className="text-[14px] font-medium text-textOnMain">오늘 기록하기</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          {/* 한 줄 결론 + 지난달 비교 */}
          <View className="mt-[6px] px-[4px]">
            <Text className="text-[24px] font-bold leading-[32px] text-mainText">
              <Text className="text-main">{analytics.totalCount}번</Text> 운동했어요
            </Text>
            <Text className="mt-[4px] text-[14px] text-subText1">
              {compareText ? `${compareText} · ` : ''}총 {formatDuration(analytics.totalMinutes)}
            </Text>
          </View>

          {/* 주별 운동 */}
          <View className="mt-[20px] rounded-[16px] bg-cardBackground px-[16px] pb-[14px] pt-[16px]">
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-mainText">주별 운동</Text>
              {goalLine !== null ? <Text className="text-[12px] text-subText2">{achievedWeeks}주 목표 달성</Text> : null}
            </View>

            <View className="mt-[26px] flex-row items-end justify-around" style={{ height: CHART_HEIGHT }}>
              {/* 목표 점선 */}
              {goalLine !== null ? (
                <View className="absolute left-0 right-0" style={{ bottom: (goalLine / chartMax) * CHART_HEIGHT }}>
                  <Text className="absolute bottom-[4px] right-0 text-[11px] text-subText2">목표 {goalLine}회</Text>
                  <Svg height={2} width="100%">
                    <Line x1="0" y1="1" x2="100%" y2="1" stroke={Colors.subText2} strokeWidth={1} strokeDasharray="4 4" />
                  </Svg>
                </View>
              ) : null}
              {weekBars.map((w, i) => {
                const achieved = w.target === null || (w.count ?? 0) >= w.target; // 목표 없으면 민트
                return (
                  <View key={i} className="w-[44px] items-center">
                    <View
                      className={`w-[28px] rounded-b-[4px] rounded-t-[8px] ${w.count ? (achieved ? 'bg-main' : 'bg-subText2/40') : 'bg-border'}`}
                      style={{ height: w.count ? (w.count / chartMax) * CHART_HEIGHT : 4 }}
                    />
                  </View>
                );
              })}
            </View>

            <View className="mt-[8px] flex-row justify-around">
              {weekBars.map((w, i) => (
                <View key={i} className={`w-[44px] items-center gap-[2px] ${w.count === null ? 'opacity-50' : ''}`}>
                  <Text className={`text-[13px] font-semibold ${w.count === null ? 'text-subText2' : 'text-mainText'}`}>
                    {w.count === null ? '–' : `${w.count}회`}
                  </Text>
                  <Text className="text-[12px] text-subText2">{i + 1}주</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 많이 한 부위 */}
          {topParts.length > 0 && (
            <View className="mt-[12px] rounded-[16px] bg-cardBackground p-[16px]">
              <Text className="text-[15px] font-semibold text-mainText">많이 한 부위</Text>
              <View className="mt-[14px] gap-[12px]">
                {topParts.map((part, i) => (
                  <View key={part.id} className="flex-row items-center gap-[10px]">
                    <Text className="w-[14px] text-[13px] text-subText2">{i + 1}</Text>
                    <Text className="w-[64px] text-[14px] text-mainText" numberOfLines={1}>
                      {part.name}
                    </Text>
                    <View className="h-[6px] flex-1 rounded-full bg-border">
                      <View
                        className={`h-[6px] rounded-full ${i === 0 ? 'bg-main' : 'bg-subText2/40'}`}
                        style={{ width: `${(part.minutes / maxPartMin) * 100}%` }}
                      />
                    </View>
                    <Text className="w-[72px] text-right text-[13px] text-subText1">{formatDuration(part.minutes)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 평균은 문장으로 */}
          <Text className="mx-[4px] mt-[16px] text-[13px] leading-[20px] text-subText1" lineBreakStrategyIOS="hangul-word">
            한 번에 평균 <Text className="font-medium text-mainText">{formatDuration(analytics.avgMinutesPerWorkout)}</Text>,
            대체로 <Text className="font-medium text-mainText">{INTENSITY_LABELS[toLabelIndex(analytics.avgIntensity)]}</Text> 운동했고
            컨디션은{' '}
            <Text className="font-medium text-mainText">
              {CONDITION_EMOJI[toLabelIndex(analytics.avgCondition)]} {CONDITION_LABELS[toLabelIndex(analytics.avgCondition)]}
            </Text>
            이었어요.
          </Text>
        </>
      )}
    </ScrollView>
  );
}
