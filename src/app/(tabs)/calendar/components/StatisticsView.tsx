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
import { MonthlyCardModal } from './MonthlyCardModal';

const SCROLL_BOTTOM = 'pb-[24px] ios:pb-[74px] android:pb-[104px]';

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
          <Ionicons name="chevron-back" size={20} color={Colors.gray2Color} />
        </Pressable>
        <View className="flex-row items-center gap-[8px]">
          <Text className="text-[17px] font-medium text-fg">
            {year}년 {month}월
          </Text>
          {!isCurrentMonth && (
            <Pressable
              className="rounded-full bg-card px-[10px] py-[4px]"
              onPress={goToToday}
              hitSlop={8}
            >
              <Text className="text-[12px] text-sub">이번 달</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={goToNextMonth} hitSlop={10}>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray2Color} />
        </Pressable>
      </View>

      {!analytics.hasData ? (
        /* 기록 없음*/
        <View className="mt-[24px] items-center rounded-[20px] bg-card p-[28px]">
          <Text className="text-[32px]">🏃‍♂️</Text>
          <Text className="mt-[12px] text-[16px] font-medium text-fg">
            이 달에는 아직 기록이 없어요
          </Text>
          <Text className="mt-[4px] text-[13px] text-sub">
            운동을 기록하면 통계와 리포트가 생성돼요.
          </Text>
        </View>
      ) : (
        <>
          {/* 전월 대비 성장 */}
          <View className="mt-[12px] rounded-[16px] bg-card p-[16px]">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-[6px]">
                <View className="flex-row items-center">
                  {diff.isSame ? (
                    <Ionicons name="remove-outline" size={16} color="#8E8E93" />
                  ) : diff.isIncrease ? (
                    <Ionicons name="trending-up-outline" size={16} color="#FF3B30" />
                  ) : (
                    <Ionicons name="trending-down-outline" size={16} color="#007AFF" />
                  )}
                </View>
                <Text className="text-[13px] font-medium text-sub">전월 대비 성장</Text>
              </View>
              <View className="rounded-full bg-white/5 px-[8px] py-[2px]">
                <Text className="text-[11px] text-dim">지난달 비교</Text>
              </View>
            </View>

            <View className="mt-[10px] flex-row items-baseline gap-[8px]">
              <Text
                className={`text-[20px] font-bold ${diff.isSame ? 'text-fg' : diff.isIncrease ? 'text-accent' : 'text-sub'
                  }`}
              >
                {diff.timeText}
              </Text>
              <Text className="text-[14px] text-sub">
                (횟수 {diff.countText})
              </Text>
            </View>
          </View>

          {/* 핵심 요약 View */}
          <View className="mt-[12px] flex-row gap-[10px]">
            <View className="flex-1 rounded-[16px] bg-card p-[16px]">
              <Text className="text-[12px] text-sub">총 운동 시간</Text>
              <Text className="mt-[6px] text-[20px] font-bold text-fg">
                {formatDuration(analytics.totalMinutes)}
              </Text>
              <Text className="mt-[4px] text-[11px] text-dim">
                회당 평균 {analytics.avgMinutesPerWorkout}분
              </Text>
            </View>

            <View className="flex-1 rounded-[16px] bg-card p-[16px]">
              <Text className="text-[12px] text-sub">총 출석 일수</Text>
              <Text className="mt-[6px] text-[20px] font-bold text-accent">
                {analytics.totalCount}일
              </Text>
              <Text className="mt-[4px] text-[11px] text-dim">
                {analytics.maxStreak > 0
                  ? `최대 연속 ${analytics.maxStreak}일`
                  : '꾸준히 진행 중'}
              </Text>
            </View>
          </View>

          <View className="mt-[10px] flex-row gap-[10px]">
            <View className="flex-1 flex-row items-center justify-between rounded-[16px] bg-card p-[14px]">
              <View>
                <Text className="text-[11px] text-sub">평균 강도</Text>
                <Text className="mt-[2px] text-[16px] font-bold text-fg">
                  {analytics.avgIntensity} / 5.0
                </Text>
              </View>
              <Text className="text-[20px]">💪</Text>
            </View>

            <View className="flex-1 flex-row items-center justify-between rounded-[16px] bg-card p-[14px]">
              <View>
                <Text className="text-[11px] text-sub">평균 컨디션</Text>
                <Text className="mt-[2px] text-[16px] font-bold text-fg">
                  {analytics.avgCondition} / 5.0
                </Text>
              </View>
              <Text className="text-[20px]">
                {CONDITION_EMOJI[conditionIndex]}
              </Text>
            </View>
          </View>

          {/* 부위별 비중 */}
          <View className="mt-[18px] rounded-[16px] bg-card p-[16px]">
            <Text className="text-[14px] font-medium text-fg">부위별 비중</Text>

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

            {/* 부위별 리스트 */}
            <View className="mt-[16px] gap-[12px]">
              {analytics.partStats.map((part) => (
                <View key={part.id} className="gap-[6px]">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-[8px]">
                      <View
                        className="h-[10px] w-[10px] rounded-full"
                        style={{ backgroundColor: part.color }}
                      />
                      <Text className="text-[14px] font-medium text-fg">{part.name}</Text>
                    </View>
                    <View className="flex-row items-center gap-[8px]">
                      <Text className="text-[13px] text-sub">
                        {part.count}회 · {formatDuration(part.minutes)}
                      </Text>
                      <Text className="w-[36px] text-right text-[13px] font-bold text-fg">
                        {part.percentage}%
                      </Text>
                    </View>
                  </View>
                  {/* 개별 게이지 바 */}
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

          {/* 이달의 운동 카드 만들기 SNS 공유 */}
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
                <Text className="text-[15px] font-bold text-accent">
                  이달의 운동 카드 만들기
                </Text>
              </View>
              <Text className="mt-[4px] text-[12px] text-sub leading-4">
                인스타그램 스토리에 공유하기 좋은 요약 카드를 생성해요
              </Text>
            </View>
            <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-accent">
              <Ionicons name="arrow-forward" size={18} color={Colors.onAccent} />
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* 이달의 운동 카드 모달 */}
      <MonthlyCardModal
        visible={cardModalVisible}
        onClose={() => setCardModalVisible(false)}
        analytics={analytics}
      />
    </ScrollView>
  );
}
