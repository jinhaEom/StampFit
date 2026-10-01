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
              className={`h-[52px] flex-1 items-center justify-center rounded-[12px] border ${
                selected ? 'border-main bg-main/15' : 'border-transparent bg-cardBackground'
              }`}
            >
              {/* 이모지는 색을 못 바꿔서 크기·투명도로 구분 */}
              <Text
                className={
                  display
                    ? selected ? 'text-[28px]' : 'text-[20px] opacity-35'
                    : selected ? 'text-[18px] font-semibold text-main' : 'text-[16px] text-subText1'
                }
              >
                {display ? display[i] : v}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-[8px] text-center text-[12px] text-main">{labels[value - 1]}</Text>
    </View>
  );
}
