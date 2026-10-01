import { Colors } from '@/constants/colors';
import { DURATION_MAX, DURATION_QUICK_PICKS, DURATION_STEP } from '@/constants/recovery';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface Props {
  name: string;
  durationMin: number;
  onChange: (min: number) => void;
  onRemove: () => void;
}

/** 부위별 시간 입력 카드 */
export function PartDurationCard({ name, durationMin, onChange, onRemove }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(String(durationMin));

  const clamp = (v: number) => Math.max(0, Math.min(DURATION_MAX, Math.round(v)));

  const startEditing = () => {
    setText(String(durationMin));
    setEditing(true);
  };

  const step = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(clamp(durationMin + delta));
  };

  const setQuick = (v: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(v);
  };

  const commitText = () => {
    const n = parseInt(text, 10);
    onChange(clamp(Number.isNaN(n) ? durationMin : n));
    setEditing(false);
  };

  return (
    <View className="rounded-[14px] bg-cardBackground p-[14px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] font-medium text-mainText">{name}</Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={18} color={Colors.subText1} />
        </Pressable>
      </View>

      <View className="mt-[14px] flex-row items-center justify-center gap-[20px]">
        <Pressable
          onPress={() => step(-DURATION_STEP)}
          hitSlop={10}
          className="h-[34px] w-[34px] items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="remove" size={18} color={Colors.mainText} />
        </Pressable>

        {editing ? (
          <TextInput
            className="min-w-[80px] text-center text-[22px] font-bold text-mainText"
            value={text}
            onChangeText={(t) => setText(t.replace(/[^0-9]/g, ''))}
            onEndEditing={commitText}
            onBlur={commitText}
            keyboardType="number-pad"
            autoFocus
            maxLength={3}
          />
        ) : (
          <Pressable onPress={startEditing} hitSlop={6}>
            <Text className="min-w-[80px] text-center text-[22px] font-bold text-mainText">
              {durationMin}
              <Text className="text-[14px] font-normal text-subText1"> 분</Text>
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => step(DURATION_STEP)}
          hitSlop={10}
          className="h-[34px] w-[34px] items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="add" size={18} color={Colors.mainText} />
        </Pressable>
      </View>

      <View className="mt-[14px] flex-row flex-wrap justify-center gap-[8px]">
        {DURATION_QUICK_PICKS.map((m) => {
          const selected = m === durationMin;
          return (
            <Pressable
              key={m}
              onPress={() => setQuick(m)}
              className={`rounded-full border px-[12px] py-[6px] ${selected ? 'border-main bg-main' : 'border-border bg-transparent'
                }`}
            >
              <Text
                className={`text-[13px] ${selected ? 'font-medium text-textOnMain' : 'text-subText1'}`}
              >
                {m}분
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
