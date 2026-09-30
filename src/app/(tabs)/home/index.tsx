import { AdBanner } from '@/components/AdBanner';
import { BottomTabInset } from '@/constants/constant';
import { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-simple-toast';
import { StreakHero } from './components/StreakHero';
import { TodayCycleHeader } from './components/TodayCycleHeader';
import { TodayRecordBar } from './components/TodayRecordBar';
import { WeekCard } from './components/WeekCard';
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
    weekMin,
    weeklyStreak,
    quoteOfDay,
    currentCycleStep,
    nextCycleStep,
    todayLog,
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
        <View className="mt-[12px]">
          <StreakHero streak={weeklyStreak} onPressGoal={() => setIsGoalModalOpen(true)} />
        </View>

        <View className="mt-[20px]">
          <WeekCard days={weekDays} weekMin={weekMin} onPressDay={handlePressDay} onStampPlayed={clearStamping} />
        </View>

        <View className="mt-[12px]">
          <TodayCycleHeader
            currentStep={currentCycleStep}
            nextStep={nextCycleStep}
            doneToday={!!todayLog}
            onEditCycle={() => setIsCycleModalOpen(true)}
          />
        </View>

        {/* <View className="mt-[20px]">
          <AdBanner />
        </View> */}
      </ScrollView>

      <CycleModal visible={isCycleModalOpen} onClose={() => setIsCycleModalOpen(false)} />
      <DayLogModal
        visible={selectedDate !== null}
        date={selectedDate}
        log={selectedDate ? logsByDate.get(selectedDate) : undefined}
        onClose={() => setSelectedDate(null)}
      />
      <GoalModal visible={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} />

      {!todayLog && quoteOfDay && (
        <View className="px-[24px] pb-[8px] pt-[4px]">
          <Text className="text-[13px] leading-[19px] text-sub" numberOfLines={2}>
            {quoteOfDay.quote}
          </Text>
          <Text className="mt-[2px] text-[11px] text-dim">{quoteOfDay.author}</Text>
        </View>
      )}

      <View
        className="px-[16px] pt-[8px]"
        style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom + BottomTabInset : 16 }}
      >
        <TodayRecordBar
          todayLog={todayLog}
          onPress={() => router.push('/record')}
        />
      </View>
    </View>
  );
}
