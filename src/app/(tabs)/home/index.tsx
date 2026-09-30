import { AdBanner } from '@/components/AdBanner';
import { BottomTabInset } from '@/constants/constant';
import { todayStr } from '@/lib/date';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { StreakHero } from './components/StreakHero';
import { TodayCycleHeader } from './components/TodayCycleHeader';
import { TodayRecordBar } from './components/TodayRecordBar';
import { WeekCard } from './components/WeekCard';
import { useTodayPlan } from './hooks/useTodayPlan';
import { useWeekSummary } from './hooks/useWeekSummary';
import { CycleModal } from './modals/CycleModal';
import { DayLogModal } from './modals/DayLogModal';
import { GoalModal } from './modals/GoalModal';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { weekDays, weekMin, weeklyStreak, onStampPlayed } = useWeekSummary();
  const { todayLog, currentStep, nextStep, quoteOfDay } = useTodayPlan();

  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 7칸에서 누른 날짜
  const selectedLog = useWorkoutStore((s) => s.logs.find((l) => l.logDate === selectedDate));

  // 미래 날짜는 열지 않음
  const handlePressDay = (date: string) => {
    if (date > todayStr()) {
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
          <WeekCard days={weekDays} weekMin={weekMin} onPressDay={handlePressDay} onStampPlayed={onStampPlayed} />
        </View>

        <View className="mt-[12px]">
          <TodayCycleHeader
            currentStep={currentStep}
            nextStep={nextStep}
            doneToday={!!todayLog}
            onEditCycle={() => setIsCycleModalOpen(true)}
          />
        </View>

      
      </ScrollView>

      <CycleModal visible={isCycleModalOpen} onClose={() => setIsCycleModalOpen(false)} />
      <DayLogModal
        visible={selectedDate !== null}
        date={selectedDate}
        log={selectedLog}
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
          <AdBanner />
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
