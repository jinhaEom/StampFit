import { Colors } from '@/constants/colors';
import { signInWithApple, signInWithGoogle } from '@/lib/socialAuth';
import { AntDesign } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

interface Props {
  onSuccess: () => void;
}

export function SocialAuthButtons({ onSuccess }: Props) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const onGooglePress = async () => {
    setGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session) onSuccess();
    } catch (e) {
      Alert.alert('Google 로그인 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onApplePress = async () => {
    setAppleLoading(true);
    try {
      const session = await signInWithApple();
      if (session) onSuccess();
    } catch (e) {
      const error = e as { code?: string; message?: string };
      if (error.code === 'ERR_REQUEST_CANCELED') {
      } else {
        Alert.alert('Apple 로그인 실패', error.message ?? '잠시 후 다시 시도해 주세요');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <View className="gap-[10px]">
      <Pressable
        className="h-[50px] flex-row items-center justify-center gap-[10px] rounded-[12px] bg-card"
        onPress={onGooglePress}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color={Colors.whiteColor} />
        ) : (
          <>
            <AntDesign name="google" size={18} color={Colors.whiteColor} />
            <Text className="text-[15px] font-medium text-fg">
              Google로 계속하기
            </Text>
          </>
        )}
      </Pressable>

      <Pressable
        className="h-[50px] flex-row items-center justify-center gap-[10px] rounded-[12px] bg-card"
        onPress={onApplePress}
        disabled={appleLoading}
      >
        {appleLoading ? (
          <ActivityIndicator color={Colors.whiteColor} />
        ) : (
          <>
            <AntDesign name="apple" size={18} color={Colors.whiteColor} />
            <Text className="text-[15px] font-medium text-fg">
              Apple로 계속하기
            </Text>
          </>
        )}
      </Pressable>

    </View>
  );
}
