import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface PartTileProps {
  label: string;
  subLabel: string;
  selected: boolean;
  highlightSub?: boolean; // 오래 쉰 부위일 때 보조 텍스트 명도 강조
  width: number;
  onPress: () => void;
}

/** 기록 화면 3열 부위 선택 타일 (부위명 + 마지막 운동 경과일) */
export function PartTile({
  label,
  subLabel,
  selected,
  highlightSub,
  width,
  onPress,
}: PartTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width }}
      className={`h-[68px] justify-between rounded-[14px] border px-[13px] py-[11px] ${
        selected ? 'border-main bg-main/15' : 'border-transparent bg-cardBackground'
      }`}
    >
      <View className="flex-row items-center justify-between gap-[4px]">
        <Text
          className={`flex-1 text-[15px] ${
            selected ? 'font-bold text-main' : 'font-semibold text-mainText'
          }`}
          numberOfLines={1}
        >
          {label}
        </Text>
        {selected && <View className="h-[6px] w-[6px] rounded-full bg-main" />}
      </View>

      <Text
        className={`text-[12px] ${
          selected
            ? 'font-medium text-main'
            : highlightSub
              ? 'font-medium text-subText1'
              : 'text-subText2'
        }`}
        numberOfLines={1}
      >
        {subLabel}
      </Text>
    </Pressable>
  );
}

/** 부위 추가 점선 타일 */
export function AddPartTile({ width, onPress }: { width: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width }}
      className="h-[68px] items-center justify-center gap-[2px] rounded-[14px] border border-dashed border-border bg-transparent"
    >
      <Ionicons name="add" size={20} color={Colors.subText2} />
      <Text className="text-[12px] text-subText2">부위 추가</Text>
    </Pressable>
  );
}
