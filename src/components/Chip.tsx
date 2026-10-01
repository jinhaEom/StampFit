import { Pressable, Text } from 'react-native';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dashed?: boolean; // 점선 테두리 ([+] 추가 칩)
  small?: boolean;
}

/** 부위 선택 칩 (선택 시 무채색 반전) */
export function Chip({ label, selected, onPress, dashed, small }: Props) {
  const box = selected
    ? 'border-mainText bg-mainText'
    : dashed
      ? 'border-border border-dashed bg-transparent'
      : 'border-border bg-cardBackground';
  const pad = small ? 'px-[10px] py-[5px]' : 'px-[14px] py-[9px]';
  const text = selected ? 'font-medium text-textOnMain' : 'font-normal text-mainText';
  const size = small ? 'text-[13px]' : 'text-[15px]';

  return (
    <Pressable onPress={onPress} disabled={!onPress} className={`rounded-full border ${box} ${pad}`}>
      <Text className={`${text} ${size}`}>{label}</Text>
    </Pressable>
  );
}
