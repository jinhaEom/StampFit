import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

interface Props {
  value: number; // 1~5
  onChange: (v: number) => void;
  display?: string[]; // 단계별 표시 문자 (없으면 숫자)
  labels: string[]; // 단계별 설명 (선택 단계 아래 표시)
}

export function ScaleSelector({ value, onChange, display, labels }: Props) {
  return (
    <View>
      <View className="flex-row gap-[8px]">
        {labels.map((_, i) => {
          const v = i + 1;
          const selected = v === value;
          return (
            <Pressable
              key={v}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(v);
              }}
              className={`flex-1 items-center rounded-[12px] border py-[12px] ${
                selected ? 'border-fg bg-fg' : 'border-line bg-card'
              }`}
            >
              <Text
                className={`text-[16px] ${selected ? 'font-medium text-on-accent' : 'font-normal text-sub'}`}
              >
                {display ? display[i] : v}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-[8px] text-center text-[12px] text-sub">{labels[value - 1]}</Text>
    </View>
  );
}
