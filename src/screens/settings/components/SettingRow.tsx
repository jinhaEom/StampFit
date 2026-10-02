import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

/** 설정 한 줄 */
export function SettingRow({ icon, label, value, onPress, chevron, danger, disabled }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress || disabled}
      activeOpacity={0.6}
      className="min-h-[56px] flex-row items-center gap-[12px] px-[16px]"
    >
      <View
        className={`h-[32px] w-[32px] items-center justify-center rounded-[10px] ${danger ? 'bg-danger/15' : 'bg-main/15'}`}
      >
        <Ionicons name={icon} size={18} color={danger ? Colors.danger : Colors.main} />
      </View>
      <Text className={`flex-1 text-[15px] ${danger ? 'text-danger' : 'text-mainText'}`}>{label}</Text>
      {value ? <Text className="text-[14px] text-subText1">{value}</Text> : null}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={Colors.subText2} /> : null}
    </TouchableOpacity>
  );
}
