import { AdBanner } from '@/components/AdBanner';
import { WeekGrass } from '@/components/WeekGrass';
import { BottomTabInset } from '@/constants/constant';
import { formatDuration } from '@/lib/date';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-simple-toast';
import { GoalTile } from './components/GoalTile';
import { MonthlyReportTeaser } from './components/MonthlyReportTeaser';
import { PartBalanceCard } from './components/PartBalanceCard';
import { StreakHero } from './components/StreakHero';
import { TodayCycleHeader } from './components/TodayCycleHeader';
import { CycleModal } from './detail/CycleModal';
import { DayLogModal } from './detail/DayLogModal';
import { GoalModal } from './detail/GoalModal';
import { useHome } from './hooks/useHome';

export default function HomeScreen() {
  const {
    insets,
    router,
    today,
    logsByDate,
    weekDays,
    clearStamping,
    weekLogs,
    weekMin,
    weekPartStats,
    monthAnalytics,
    goalProgress,
    weeklyStreak,
    quoteOfDay,
    currentCycleStep,
    nextCycleStep,
    isCycleModalOpen,
    setIsCycleModalOpen,
    isGoalModalOpen,
    setIsGoalModalOpen,
  } = useHome();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handlePressDay = (date: string) => {
    if (date > today) {
      Toast.show('미래 날짜예요', Toast.SHORT);
      return;
    }
    setSelectedDate(date);
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerClassName="px-[16px] pb-[24px]" showsVerticalScrollIndicator={false}>

        <StreakHero streak={weeklyStreak} onPressSetGoal={() => setIsGoalModalOpen(true)} />

        <TodayCycleHeader
          currentCycleStep={currentCycleStep}
          nextCycleStep={nextCycleStep}
          onEditCycle={() => setIsCycleModalOpen(true)}
        />

        {quoteOfDay && (
          <View className="mt-[22px]">
            <Text className="text-[13px] italic leading-6" style={{ color: '#C7C9CC' }}>
              "{quoteOfDay.quote}"
            </Text>
            <Text className="mt-[3px] text-[11px] text-dim">— {quoteOfDay.author}</Text>
          </View>
        )}

        <View className="mt-[16px] flex-row gap-[12px]">
          <GoalTile goalProgress={goalProgress} onPress={() => setIsGoalModalOpen(true)} />
          <PartBalanceCard partStats={weekPartStats} />
        </View>

        <Text className="mb-[8px] mt-[20px] text-[13px] text-sub">이번 주</Text>
        <View className="rounded-[16px] bg-card p-[16px]">
          <WeekGrass days={weekDays} onPressDay={handlePressDay} onStampPlayed={clearStamping} />
          <Text className="mt-[12px] text-[13px] text-sub">
            {weekLogs.length > 0
              ? `${weekLogs.length}회 · 총 ${formatDuration(weekMin)}`
              : '아직 기록이 없어요'}
          </Text>
        </View>

        {/* 탭하면 캘린더 통계로 이동 */}
        <Text className="mb-[8px] mt-[20px] text-[13px] text-sub">이번 달</Text>
        <MonthlyReportTeaser
          analytics={monthAnalytics}
          onPress={() => router.push({ pathname: '/calendar', params: { tab: 'stats' } })}
        />
      </ScrollView>
      <CycleModal
        visible={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
      />
      <DayLogModal
        visible={selectedDate !== null}
        date={selectedDate}
        log={selectedDate ? logsByDate.get(selectedDate) : undefined}
        onClose={() => setSelectedDate(null)}
      />
      <GoalModal
        visible={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
      <AdBanner />
      <View
        className="px-[16px] pt-[8px]"
        style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom + BottomTabInset : 16 }}
      >
        <Pressable
          className="items-center rounded-[14px] bg-accent py-[15px]"
          onPress={() => router.push('/record')}
        >
          <Text className="text-[16px] font-medium text-black">운동 기록하기</Text>
        </Pressable>
      </View>
    </View>
  );
}
