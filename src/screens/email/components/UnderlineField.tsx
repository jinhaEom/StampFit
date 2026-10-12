import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, type Ref, useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

type Props = Omit<TextInputProps, 'onFocus' | 'onBlur' | 'secureTextEntry'> & {
  ref?: Ref<TextInput>;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  hint?: ReactNode;
};

/** 라벨 + 밑줄 입력칸 */
export function UnderlineField({ ref, label, value, onChangeText, secure, hint, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false); // 비밀번호 보기

  return (
    <View>
      <Text className={`text-[13px] ${focused ? 'text-main' : 'text-subText2'}`}>{label}</Text>
      <View
        className={`h-[52px] flex-row items-center gap-[8px] border-b-[2px] ${focused ? 'border-main' : 'border-border'
          }`}
      >
        <TextInput
          ref={ref}
          className="flex-1 p-0 text-[19px] text-mainText"
          placeholderTextColor={Colors.disabledText}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure && !visible}
          {...rest}
        />
        {focused && value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} hitSlop={8} className="p-[4px]">
            <Ionicons name="close-circle" size={18} color={Colors.subText2} />
          </Pressable>
        )}
        {secure && (
          <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8} className="p-[4px]">
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.subText1} />
          </Pressable>
        )}
      </View>
      {hint}
    </View>
  );
}
