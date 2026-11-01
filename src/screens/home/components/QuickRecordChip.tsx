import { Colors } from '@/constants/colors';
import { formatDuration } from '@/lib/date';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface Props {
  label: string; // 오늘 차례 (예: 가슴)
  minutes: number;
  onPress: () => void;
}

/** 하단 바 위 빠른 기록 칩 */
export function QuickRecordChip({ label, minutes, onPress }: Props) {
  return (
    <View className="items-center pb-[10px]">
      <Pressable
        className="flex-row items-center gap-[6px] rounded-full border border-main/30 bg-main/10 px-[14px] py-[8px]"
        onPress={onPress}
        hitSlop={6}
      >
        <Ionicons name="flash" size={13} color={Colors.main} />
        <Text className="text-[13px] font-semibold text-main" numberOfLines={1}>
          {label} · {formatDuration(minutes)}으로 바로 기록
        </Text>
      </Pressable>
    </View>
  );
}
