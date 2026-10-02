import { Colors } from '@/constants/colors';
import { CONDITION_EMOJI } from '@/constants/recovery';
import { formatDiffText, getMonthlyAnalytics } from '@/lib/analytics';
import { formatDuration, todayStr } from '@/lib/date';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MonthlyCardModal } from '../modals/MonthlyCardModal';

const EMPTY_GRID = [12, 36, 60]; // 빈 도장판 점 좌표 (3x3)
const SCROLL_BOTTOM = 'pb-[24px] ios:pb-[74px] android:pb-[104px]';

/* 캘린더 탭 -> 통계 View*/
export default function StatisticsView() {
  const router = useRouter();
  const today = todayStr();
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [cardModalVisible, setCardModalVisible] = useState(false);

  const logs = useWorkoutStore((s) => s.logs);
  const partNamesById = useWorkoutStore((s) => s.partNamesById);

  const analytics = useMemo(() => {
    return getMonthlyAnalytics(logs, partNamesById, year, month);
  }, [logs, partNamesById, year, month]);

  const diff = useMemo(() => {
    return formatDiffText(
      analytics.prevMonthDiff.diffMinutes,
      analytics.prevMonthDiff.diffCount,
    );
  }, [analytics]);

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

  const conditionIndex = Math.max(0, Math.min(4, Math.round(analytics.avgCondition) - 1));

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
          {/* 전월 대비 성장 */}
          <View className="mt-[12px] rounded-[16px] bg-cardBackground p-[16px]">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-[6px]">
                <View className="flex-row items-center">
                  {diff.isSame ? (
                    <Ionicons name="remove-outline" size={16} color={Colors.subText1} />
                  ) : diff.isIncrease ? (
                    <Ionicons name="trending-up-outline" size={16} color={Colors.main} />
                  ) : (
                    <Ionicons name="trending-down-outline" size={16} color={Colors.subText1} />
                  )}
                </View>
                <Text className="text-[13px] font-medium text-subText1">전월 대비 성장</Text>
              </View>
              <View className="rounded-full bg-white/5 px-[8px] py-[2px]">
                <Text className="text-[12px] text-subText2">지난달 비교</Text>
              </View>
            </View>

            <View className="mt-[10px] flex-row items-baseline gap-[8px]">
              <Text
                className={`text-[20px] font-bold ${diff.isSame ? 'text-mainText' : diff.isIncrease ? 'text-main' : 'text-subText1'
                  }`}
              >
                {diff.timeText}
              </Text>
              <Text className="text-[14px] text-subText1">
                (횟수 {diff.countText})
              </Text>
            </View>
          </View>

          {/* 핵심 요약 */}
          <View className="mt-[12px] flex-row gap-[10px]">
            <View className="flex-1 rounded-[16px] bg-cardBackground p-[16px]">
              <Text className="text-[12px] text-subText1">총 운동 시간</Text>
              <Text className="mt-[6px] text-[20px] font-bold text-mainText">
                {formatDuration(analytics.totalMinutes)}
              </Text>
              <Text className="mt-[4px] text-[12px] text-subText2">
                회당 평균 {analytics.avgMinutesPerWorkout}분
              </Text>
            </View>

            <View className="flex-1 rounded-[16px] bg-cardBackground p-[16px]">
              <Text className="text-[12px] text-subText1">총 출석 일수</Text>
              <Text className="mt-[6px] text-[20px] font-bold text-main">
                {analytics.totalCount}일
              </Text>
              <Text className="mt-[4px] text-[12px] text-subText2">
                주 평균 {analytics.weeklyAvg}회
              </Text>
            </View>
          </View>

          <View className="mt-[10px] flex-row gap-[10px]">
            <View className="flex-1 flex-row items-center justify-between rounded-[16px] bg-cardBackground p-[14px]">
              <View>
                <Text className="text-[12px] text-subText1">평균 강도</Text>
                <Text className="mt-[2px] text-[16px] font-bold text-mainText">
                  {analytics.avgIntensity} / 5.0
                </Text>
              </View>
              <Text className="text-[20px]">💪</Text>
            </View>

            <View className="flex-1 flex-row items-center justify-between rounded-[16px] bg-cardBackground p-[14px]">
              <View>
                <Text className="text-[12px] text-subText1">평균 컨디션</Text>
                <Text className="mt-[2px] text-[16px] font-bold text-mainText">
                  {analytics.avgCondition} / 5.0
                </Text>
              </View>
              <Text className="text-[20px]">
                {CONDITION_EMOJI[conditionIndex]}
              </Text>
            </View>
          </View>

          {/* 부위별 비중 */}
          <View className="mt-[18px] rounded-[16px] bg-cardBackground p-[16px]">
            <Text className="text-[14px] font-medium text-mainText">부위별 비중</Text>

            {analytics.partStats.length > 0 && (
              <View className="mt-[12px] h-[8px] w-full flex-row overflow-hidden rounded-full bg-white/5">
                {analytics.partStats.map((part) => (
                  <View
                    key={part.id}
                    style={{
                      width: `${part.percentage}%`,
                      backgroundColor: part.color,
                    }}
                  />
                ))}
              </View>
            )}

            {/* 부위별 목록 */}
            <View className="mt-[16px] gap-[12px]">
              {analytics.partStats.map((part) => (
                <View key={part.id} className="gap-[6px]">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-[8px]">
                      <View
                        className="h-[10px] w-[10px] rounded-full"
                        style={{ backgroundColor: part.color }}
                      />
                      <Text className="text-[14px] font-medium text-mainText">{part.name}</Text>
                    </View>
                    <View className="flex-row items-center gap-[8px]">
                      <Text className="text-[13px] text-subText1">
                        {part.count}회 · {formatDuration(part.minutes)}
                      </Text>
                      <Text className="w-[36px] text-right text-[13px] font-bold text-mainText">
                        {part.percentage}%
                      </Text>
                    </View>
                  </View>
                  {/* 부위 게이지 */}
                  <View className="h-[4px] w-full overflow-hidden rounded-full bg-white/5">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${part.percentage}%`,
                        backgroundColor: part.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 이달의 카드 만들기 (SNS 공유) */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setCardModalVisible(true);
            }}
            className="mt-[18px] flex-row items-center justify-between rounded-[18px] p-[18px]"
            activeOpacity={0.8}
          >
            <View className="flex-1 pr-[12px]">
              <View className="flex-row items-center gap-[6px]">
                <Text className="text-[15px] font-bold text-main">
                  이달의 운동 카드 만들기
                </Text>
              </View>
              <Text className="mt-[4px] text-[12px] text-subText1 leading-4">
                인스타그램 스토리에 공유하기 좋은 요약 카드를 생성해요
              </Text>
            </View>
            <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-main">
              <Ionicons name="arrow-forward" size={18} color={Colors.textOnMain} />
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* 이달의 카드 모달 */}
      <MonthlyCardModal
        visible={cardModalVisible}
        onClose={() => setCardModalVisible(false)}
        analytics={analytics}
      />
    </ScrollView>
  );
}
