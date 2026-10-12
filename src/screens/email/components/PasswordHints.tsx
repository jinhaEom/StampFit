import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

/** 비밀번호 칸 아래 "✓ 6자 이상" */
export function LengthHint({ password }: { password: string }) {
  const ok = password.length >= 6;
  return (
    <View className="mt-[8px] flex-row items-center gap-[4px]">
      <Ionicons name="checkmark" size={14} color={ok ? Colors.main : Colors.subText2} />
      <Text className={`text-[13px] ${ok ? 'text-main' : 'text-subText2'}`}>6자 이상</Text>
    </View>
  );
}

/** 비밀번호 확인 칸 아래 일치 여부 (다 입력하기 전엔 숨김) */
export function MatchHint({ password, confirm }: { password: string; confirm: string }) {
  const match = password === confirm;
  if (confirm.length === 0 || (!match && confirm.length < password.length)) return null;
  return (
    <Text className={`mt-[8px] text-[13px] ${match ? 'text-main' : 'text-danger'}`}>
      {match ? '비밀번호가 같아요' : '비밀번호가 달라요'}
    </Text>
  );
}
