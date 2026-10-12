import { Colors } from '@/constants/colors';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  label: string;
  filled: boolean;
  loading: boolean;
  onPress: () => void;
}

export function BottomButton({ label, filled, loading, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const [keyboardOn, setKeyboardOn] = useState(false);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOn(true));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOn(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View className="px-[24px]" style={{ paddingBottom: keyboardOn ? 12 : insets.bottom + 16 }}>
      <Pressable
        className={`h-[46px] items-center justify-center rounded-[14px] border ${
          filled ? 'border-main/50 bg-main/10' : 'border-cardSelected bg-cardBackground'
        }`}
        onPress={onPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.main} />
        ) : (
          <Text className={`text-[15px] font-semibold ${filled ? 'text-main' : 'text-subText2'}`}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}
