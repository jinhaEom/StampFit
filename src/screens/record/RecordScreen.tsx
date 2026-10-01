import { AlertModal } from '@/components/AlertModal';
import { Chip } from '@/components/Chip';
import { Colors } from '@/constants/colors';
import {
  CONDITION_EMOJI,
  CONDITION_LABELS,
  DURATION_DEFAULT,
  INTENSITY_LABELS,
} from '@/constants/recovery';
import { formatDuration, formatKorean, todayStr } from '@/lib/date';
import type { WorkoutLogPart } from '@/lib/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DoneStamp } from './components/DoneStamp';
import { PartDurationCard } from './components/PartDurationCard';
import { ScaleSelector } from './components/ScaleSelector';

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const logDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayStr();

  const parts = useWorkoutStore((s) => s.parts);
  const saveLog = useWorkoutStore((s) => s.saveLog);
  const stampDate = useWorkoutStore((s) => s.stampDate);
  const addPart = useWorkoutStore((s) => s.addPart);
  const existing = useWorkoutStore((s) => s.logs.find((l) => l.logDate === logDate));

  const existingPartIds = React.useMemo(() => existing?.parts.map((p) => p.id) ?? [], [existing]);

  // 보여줄 부위 (꺼둔 부위도 이 기록에 있으면 포함)
  const visibleParts = parts.filter((p) => p.isActive || existingPartIds.includes(p.id));

  const [entries, setEntries] = React.useState<WorkoutLogPart[]>(existing?.parts ?? []);
  const [intensity, setIntensity] = React.useState(existing?.intensity ?? 3);
  const [condition, setCondition] = React.useState(existing?.condition ?? 3);
  const [memo, setMemo] = React.useState(existing?.memo ?? '');
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [dupAlertVisible, setDupAlertVisible] = React.useState(false);
  const [stamping, setStamping] = React.useState(false);

  const selectedIds = entries.map((e) => e.id);

  const togglePart = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEntries((prev) =>
      prev.some((e) => e.id === id)
        ? prev.filter((e) => e.id !== id)
        : [...prev, { id, durationMin: DURATION_DEFAULT }],
    );
  };

  // 카드 삭제 버튼용 (사라진 뒤 호출, 햅틱은 카드에서)
  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateDuration = (id: string, durationMin: number) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, durationMin } : e)));
  };

  const onAddPart = () => {
    const name = newName.trim();
    if (!name) return;
    const id = addPart(name);
    if (!id) {
      setDupAlertVisible(true);
      return;
    }
    setEntries((prev) => [...prev, { id, durationMin: DURATION_DEFAULT }]);
    setNewName('');
    setAdding(false);
  };

  const selectedParts = visibleParts.filter((p) => selectedIds.includes(p.id));
  const totalMin = entries.reduce((sum, e) => sum + e.durationMin, 0);
  const canSave = entries.length > 0 && entries.every((e) => e.durationMin > 0);

  const onSave = () => {
    saveLog({
      logDate,
      intensity,
      condition,
      memo: memo.trim() || null,
      parts: entries,
    });

    /* 수정은 바로 닫기 */
    if (existing) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return;
    }
    /* 새 기록은 CLEAR 도장 후 닫기 */
    setStamping(true);
  };

  /* 도장 잠깐 보여주고 닫은 뒤 날짜 칸에 점 찍기 */
  React.useEffect(() => {
    if (!stamping) return;
    const timer = setTimeout(() => {
      stampDate(logDate);
      router.back();
    }, 900);
    return () => clearTimeout(timer);
  }, [stamping, logDate, stampDate, router]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 8 }}
      >
        {/* 헤더 */}
        <View className="flex-row items-center justify-between px-[16px] pb-[8px]">
          <Text className="text-[17px] font-medium text-mainText">
            {formatKorean(logDate)} {existing ? '수정' : '기록'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.subText1} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="px-[16px] pb-[24px]"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. 부위 */}
          <Text className="mb-[10px] mt-[22px] text-[13px] text-subText1">부위</Text>
          <View className="flex-row flex-wrap gap-[8px]">
            {visibleParts.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                selected={selectedIds.includes(p.id)}
                onPress={() => togglePart(p.id)}
              />
            ))}
            {!adding && <Chip label="＋" dashed onPress={() => setAdding(true)} />}
          </View>
          {adding && (
            <View className="mt-[12px] flex-row items-center gap-[14px]">
              <TextInput
                className="flex-1 rounded-[10px] bg-cardBackground px-[12px] py-[9px] text-[15px] text-mainText"
                value={newName}
                onChangeText={setNewName}
                placeholder="새 부위 이름"
                placeholderTextColor={Colors.disabledText}
                autoFocus
                onSubmitEditing={onAddPart}
                returnKeyType="done"
              />
              <Pressable onPress={onAddPart} hitSlop={8}>
                <Text className="text-[15px] font-medium text-mainText">추가</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setNewName('');
                }}
                hitSlop={8}
              >
                <Text className="text-[15px] text-subText1">취소</Text>
              </Pressable>
            </View>
          )}

          {/* 2. 부위별 시간 */}
          {selectedParts.length > 0 && (
            <>
              <View className="mb-[10px] mt-[22px] flex-row items-center justify-between">
                <Text className="text-[13px] text-subText1">부위별 시간</Text>
                <Text className="text-[13px] font-medium text-mainText">
                  총 {formatDuration(totalMin)}
                </Text>
              </View>
              <View className="gap-[10px]">
                {selectedParts.map((p) => {
                  const entry = entries.find((e) => e.id === p.id)!;
                  return (
                    <PartDurationCard
                      key={p.id}
                      name={p.name}
                      durationMin={entry.durationMin}
                      onChange={(min) => updateDuration(p.id, min)}
                      onRemove={() => removeEntry(p.id)}
                    />
                  );
                })}
              </View>
            </>
          )}

          {/* 3. 강도 */}
          <Text className="mb-[10px] mt-[22px] text-[13px] text-subText1">강도</Text>
          <ScaleSelector value={intensity} onChange={setIntensity} labels={INTENSITY_LABELS} />

          {/* 4. 컨디션 */}
          <Text className="mb-[10px] mt-[22px] text-[13px] text-subText1">컨디션</Text>
          <ScaleSelector
            value={condition}
            onChange={setCondition}
            display={CONDITION_EMOJI}
            labels={CONDITION_LABELS}
          />

          {/* 5. 메모 (선택) */}
          <Text className="mb-[10px] mt-[22px] text-[13px] text-subText1">메모</Text>
          <TextInput
            className="rounded-[12px] bg-cardBackground px-[14px] py-[12px] text-[15px] text-mainText"
            value={memo}
            onChangeText={setMemo}
            placeholder="한 줄 메모 (선택)"
            placeholderTextColor={Colors.disabledText}
            returnKeyType="done"
          />
        </ScrollView>

        {/* 저장 */}
        <View className="px-[16px] pt-[8px]" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Pressable
            className={`items-center rounded-[14px] py-[15px] ${canSave ? 'bg-main' : 'bg-cardBackground'}`}
            disabled={!canSave}
            onPress={onSave}
          >
            <Text
              className={`text-[16px] font-medium ${canSave ? 'text-textOnMain' : 'text-subText2'}`}
            >
              {entries.length === 0
                ? '부위를 선택하세요'
                : canSave
                  ? '저장'
                  : '부위별 시간을 입력하세요'}
            </Text>
          </Pressable>
        </View>
      </View>

      {stamping && <DoneStamp />}

      <AlertModal
        visible={dupAlertVisible}
        title="이미 있는 부위예요"
        contents="이미 있는 부위예요"
        okLabel="확인"
        onOk={() => setDupAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
