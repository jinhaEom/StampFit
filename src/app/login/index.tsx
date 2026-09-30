import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SocialAuthButtons } from './components/SocialAuthButtons';
import { StampGridHero } from './components/StampGridHero';

/** 시작 화면 (로그인·가입 구분 없이 계속하기) */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-bg px-[24px]"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
    >
      <Image
        source={require('@/assets/images/stampfit-wordmark.png')}
        style={{ width: 116, height: 32 }}
        resizeMode="contain"
      />

      <View className="flex-1 items-center justify-center">
        <StampGridHero />
      </View>

      <Text className="text-[30px] font-bold leading-[39px] text-fg">
        매일 한 칸씩,{'\n'}운동 도장을 찍어요
      </Text>
      <Text className="mt-[10px] text-[15px] text-sub">세트·무게 없이, 부위랑 시간만 3초 기록</Text>

      <View className="mt-[36px]">
        <SocialAuthButtons onSuccess={() => router.replace('/home')} />
      </View>

      <Pressable className="mt-[18px] items-center py-[6px]" onPress={() => router.push('/email')} hitSlop={8}>
        <Text className="text-[15px] font-medium text-fg">이메일로 계속하기</Text>
      </Pressable>
    </View>
  );
}
