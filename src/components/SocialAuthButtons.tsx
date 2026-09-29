import { signInWithApple, signInWithGoogle } from '@/lib/socialAuth';
import { AntDesign } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';

// 구글 브랜딩 가이드의 다크 테마 버튼 색
const GOOGLE_DARK = { fill: '#131314', stroke: '#8E918F', text: '#E3E3E3' };

interface Props {
  onSuccess: () => void;
}

export function SocialAuthButtons({ onSuccess }: Props) {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const onGooglePress = async () => {
    setLoading('google');
    try {
      const session = await signInWithGoogle();
      if (session) onSuccess();
    } catch (e) {
      Alert.alert('Google 로그인 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요');
    } finally {
      setLoading(null);
    }
  };

  const onApplePress = async () => {
    setLoading('apple');
    try {
      const session = await signInWithApple();
      if (session) onSuccess();
    } catch (e) {
      const error = e as { code?: string; message?: string };
      // 사용자가 직접 닫은 경우는 조용히 넘어간다
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple 로그인 실패', error.message ?? '잠시 후 다시 시도해 주세요');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View className="gap-[10px]">
      {Platform.OS === 'ios' && (
        <View pointerEvents={loading ? 'none' : 'auto'} style={{ opacity: loading === 'apple' ? 0.6 : 1 }}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={14}
            style={{ height: 50 }}
            onPress={onApplePress}
          />
        </View>
      )}

      <Pressable
        className="h-[54px] flex-row items-center justify-center gap-[10px] rounded-[14px] border"
        style={{ backgroundColor: GOOGLE_DARK.fill, borderColor: GOOGLE_DARK.stroke }}
        onPress={onGooglePress}
        disabled={loading !== null}
      >
        {loading === 'google' ? (
          <ActivityIndicator color={GOOGLE_DARK.text} />
        ) : (
          <>
            {/* TODO: 출시 전 구글 공식 컬러 G 이미지로 교체 (브랜딩 가이드상 흑백 G는 금지) */}
            <AntDesign name="google" size={18} color={GOOGLE_DARK.text} />
            <Text className="text-[16px] font-semibold" style={{ color: GOOGLE_DARK.text }}>
              Google로 계속하기
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
