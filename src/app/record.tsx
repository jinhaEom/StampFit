import { AlertModal } from '@/components/AlertModal';
import { Chip } from '@/components/Chip';
import { PartDurationCard } from '@/components/PartDurationCard';
import { ScaleSelector } from '@/components/ScaleSelector';
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

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const logDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayStr();

  const parts = useWorkoutStore((s) => s.parts);
  const saveLog = useWorkoutStore((s) => s.saveLog);
  const addPart = useWorkoutStore((s) => s.addPart);
  const existing = useWorkoutStore((s) => s.logs.find((l) => l.logDate === logDate));

  const existingPartIds = React.useMemo(() => existing?.parts.map((p) => p.id) ?? [], [existing]);

  // 비활성 부위여도 기존 기록에 포함돼 있으면 보여준다 (과거 기록 유지 원칙)
  const visibleParts = parts.filter((p) => p.isActive || existingPartIds.includes(p.id));

  const [entries, setEntries] = React.useState<WorkoutLogPart[]>(existing?.parts ?? []);
  const [intensity, setIntensity] = React.useState(existing?.intensity ?? 3);
  const [condition, setCondition] = React.useState(existing?.condition ?? 3);
  const [memo, setMemo] = React.useState(existing?.memo ?? '');
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [dupAlertVisible, setDupAlertVisible] = React.useState(false);

  const selectedIds = entries.map((e) => e.id);

  const togglePart = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEntries((prev) =>
      prev.some((e) => e.id === id)
        ? prev.filter((e) => e.id !== id)
        : [...prev, { id, durationMin: DURATION_DEFAULT }],
    );
  };

  // 카드의 삭제 버튼 전용 — 사라지는 애니메이션이 끝난 뒤 호출되므로 햅틱은 카드 쪽에서 즉시 준다
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="flex-1 bg-bg"
        style={{ paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 8 }}
      >
        {/* 헤더 */}
        <View className="flex-row items-center justify-between px-[16px] pb-[8px]">
          <Text className="text-[17px] font-medium text-fg">
            {formatKorean(logDate)} {existing ? '수정' : '기록'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.gray2Color} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="px-[16px] pb-[24px]"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. 부위 */}
          <Text className="mb-[10px] mt-[22px] text-[13px] text-sub">부위</Text>
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
                className="flex-1 rounded-[10px] bg-card px-[12px] py-[9px] text-[15px] text-fg"
                value={newName}
                onChangeText={setNewName}
                placeholder="새 부위 이름"
                placeholderTextColor={Colors.disabledColor}
                autoFocus
                onSubmitEditing={onAddPart}
                returnKeyType="done"
              />
              <Pressable onPress={onAddPart} hitSlop={8}>
                <Text className="text-[15px] font-medium text-fg">추가</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setNewName('');
                }}
                hitSlop={8}
              >
                <Text className="text-[15px] text-sub">취소</Text>
              </Pressable>
            </View>
          )}

          {/* 2. 부위별 시간 */}
          {selectedParts.length > 0 && (
            <>
              <View className="mb-[10px] mt-[22px] flex-row items-center justify-between">
                <Text className="text-[13px] text-sub">부위별 시간</Text>
                <Text className="text-[13px] font-medium text-fg">
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

          {/* 강도 */}
          <Text className="mb-[10px] mt-[22px] text-[13px] text-sub">강도</Text>
          <ScaleSelector value={intensity} onChange={setIntensity} labels={INTENSITY_LABELS} />

          {/* 컨디션 */}
          <Text className="mb-[10px] mt-[22px] text-[13px] text-sub">컨디션</Text>
          <ScaleSelector
            value={condition}
            onChange={setCondition}
            display={CONDITION_EMOJI}
            labels={CONDITION_LABELS}
          />

          {/* 5. 메모 (선택) */}
          <Text className="mb-[10px] mt-[22px] text-[13px] text-sub">메모</Text>
          <TextInput
            className="rounded-[12px] bg-card px-[14px] py-[12px] text-[15px] text-fg"
            value={memo}
            onChangeText={setMemo}
            placeholder="한 줄 메모 (선택)"
            placeholderTextColor={Colors.disabledColor}
            returnKeyType="done"
          />
        </ScrollView>

        {/* 저장 */}
        <View className="px-[16px] pt-[8px]" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Pressable
            className={`items-center rounded-[14px] py-[15px] ${canSave ? 'bg-accent' : 'bg-card'}`}
            disabled={!canSave}
            onPress={onSave}
          >
            <Text
              className={`text-[16px] font-medium ${canSave ? 'text-on-accent' : 'text-dim'}`}
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
