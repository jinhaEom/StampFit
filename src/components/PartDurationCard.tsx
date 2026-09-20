import { Colors } from '@/constants/colors';
import { DURATION_MAX, DURATION_QUICK_PICKS, DURATION_STEP } from '@/constants/recovery';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { Animated, Pressable, Text, TextInput, View } from 'react-native';

interface Props {
  name: string;
  durationMin: number;
  onChange: (min: number) => void;
  onRemove: () => void;
}

/** 부위 하나의 시간을 정하는 카드 — 스텝퍼 + 빠른 선택 칩 + 직접입력 */
export function PartDurationCard({ name, durationMin, onChange, onRemove }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(String(durationMin));
  const [removing, setRemoving] = React.useState(false);

  // 홈 화면 잔디 칸이 채워질 때와 같은 등장 애니메이션 (WeekGrass 참고)
  const scale = React.useRef(new Animated.Value(0.4)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scale]);

  // 삭제할 때는 반대로 줄어들면서 사라진 뒤에 실제로 목록에서 제거한다
  const handleRemove = () => {
    if (removing) return;
    setRemoving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.8, duration: 160, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onRemove();
    });
  };

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
    <Animated.View
      className="rounded-[14px] bg-card p-[14px]"
      style={{ opacity, transform: [{ scale }] }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] font-medium text-fg">{name}</Text>
        <Pressable onPress={handleRemove} disabled={removing} hitSlop={8}>
          <Ionicons name="close" size={18} color={Colors.gray2Color} />
        </Pressable>
      </View>

      <View className="mt-[14px] flex-row items-center justify-center gap-[20px]">
        <Pressable
          onPress={() => step(-DURATION_STEP)}
          hitSlop={10}
          className="h-[34px] w-[34px] items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="remove" size={18} color={Colors.whiteColor} />
        </Pressable>

        {editing ? (
          <TextInput
            className="min-w-[80px] text-center text-[22px] font-bold text-fg"
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
            <Text className="min-w-[80px] text-center text-[22px] font-bold text-fg">
              {durationMin}
              <Text className="text-[14px] font-normal text-sub"> 분</Text>
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => step(DURATION_STEP)}
          hitSlop={10}
          className="h-[34px] w-[34px] items-center justify-center rounded-full bg-white/5"
        >
          <Ionicons name="add" size={18} color={Colors.whiteColor} />
        </Pressable>
      </View>

      <View className="mt-[14px] flex-row flex-wrap justify-center gap-[8px]">
        {DURATION_QUICK_PICKS.map((m) => {
          const selected = m === durationMin;
          return (
            <Pressable
              key={m}
              onPress={() => setQuick(m)}
              className={`rounded-full border px-[12px] py-[6px] ${
                selected ? 'border-accent bg-accent' : 'border-line bg-transparent'
              }`}
            >
              <Text
                className={`text-[13px] ${selected ? 'font-medium text-on-accent' : 'text-sub'}`}
              >
                {m}분
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
