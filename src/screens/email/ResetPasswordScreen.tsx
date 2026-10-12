import { Colors } from '@/constants/colors';
import { tempAuthClient } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomButton } from './components/BottomButton';
import { LengthHint, MatchHint } from './components/PasswordHints';
import { UnderlineField } from './components/UnderlineField';
import { EMAIL_REGEX } from './EmailScreen';

/** Supabase 에러 문구 → 화면 문구 */
function toMessage(message: string) {
  if (message.includes('expired') || message.includes('invalid')) return '코드가 맞지 않거나 만료됐어요';
  if (message.includes('security purposes') || message.includes('rate limit')) return '잠시 후 다시 받아 주세요';
  if (message.includes('sending')) return '메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요';
  if (message.includes('different from the old')) return '이전과 다른 비밀번호로 정해 주세요';
  return message;
}

/* 단계별 제목 */
const TITLES = ['가입한 이메일을\n입력해 주세요', '메일로 온 코드를\n입력해 주세요', '새 비밀번호를\n정해 주세요'];
const BUTTON_LABELS = ['인증 코드 받기', '확인', '비밀번호 변경'];

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const confirmRef = useRef<TextInput>(null);

  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [step, setStep] = useState(0); // 0 이메일, 1 코드, 2 새 비밀번호
  const [submitting, setSubmitting] = useState(false);

  /* 버튼 색 (지금 입력이 다 됐는지) */
  const filled = [
    email.trim().length > 0,
    code.length >= 6,
    password.length >= 6 && passwordConfirm.length > 0,
  ][step];

  /* 지금 단계 입력값 검사 (문제 있으면 토스트 문구 반환) */
  const validate = () => {
    if (step === 0) {
      if (email.trim().length === 0) return '이메일을 입력해 주세요';
      if (!EMAIL_REGEX.test(email.trim())) return '이메일 형식이 맞지 않아요';
    }
    if (step === 1 && code.length < 6) return '메일로 온 코드를 입력해 주세요';
    if (step === 2) {
      if (password.length < 6) return '비밀번호는 6자 이상이어야 해요';
      if (password !== passwordConfirm) return '비밀번호가 서로 달라요';
    }
    return null;
  };

  /* 메일로 코드 보내기 (없는 이메일이어도 성공으로 옴) */
  const sendCode = async () => {
    const { error } = await tempAuthClient.auth.resetPasswordForEmail(email.trim());
    if (error) {
      toast.error(toMessage(error.message));
      return false;
    }
    toast.done('메일을 보냈어요');
    return true;
  };

  const onNext = async () => {
    if (submitting) return;
    const invalid = validate();
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setSubmitting(true);
    try {
      if (step === 0) {
        if (await sendCode()) setStep(1);
        return;
      }

      if (step === 1) {
        const { error } = await tempAuthClient.auth.verifyOtp({ email: email.trim(), token: code, type: 'recovery' });
        if (error) {
          toast.error(toMessage(error.message));
          return;
        }
        setStep(2);
        return;
      }

      const { error } = await tempAuthClient.auth.updateUser({ password });
      if (error) {
        toast.error(toMessage(error.message));
        return;
      }
      await tempAuthClient.auth.signOut();
      toast.done('비밀번호 변경 완료', '새 비밀번호로 로그인해 주세요');
      if (router.canDismiss()) router.dismissAll();
      router.push({ pathname: '/email', params: { email: email.trim() } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="px-[24px]" style={{ paddingTop: insets.top + 8 }}>
        <Pressable className="-ml-[6px] h-[40px] w-[40px] justify-center" onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={Colors.mainText} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[24px] pb-[24px]"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mt-[16px] text-[26px] leading-[35px] text-mainText">{TITLES[step]}</Text>

        <View className="mt-[36px] gap-[28px]">
          {step < 2 && (
            <UnderlineField
              label="이메일"
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              editable={step === 0}
              autoFocus={step === 0}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={onNext}
              submitBehavior="submit"
            />
          )}

          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(250)}>
              <UnderlineField
                label="인증 코드"
                placeholder="숫자 6자리"
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                autoFocus
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={8}
                hint={
                  <Pressable className="mt-[10px] self-start py-[4px]" onPress={sendCode} hitSlop={8}>
                    <Text className="text-[13px] text-subText1">메일이 안 왔나요? · 다시 받기</Text>
                  </Pressable>
                }
              />
            </Animated.View>
          )}

          {step === 2 && (
            <>
              <UnderlineField
                label="새 비밀번호"
                value={password}
                onChangeText={setPassword}
                secure
                hint={<LengthHint password={password} />}
                autoFocus
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                submitBehavior="submit"
              />
              <UnderlineField
                ref={confirmRef}
                label="새 비밀번호 확인"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secure
                hint={<MatchHint password={password} confirm={passwordConfirm} />}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={onNext}
                submitBehavior="submit"
              />
            </>
          )}
        </View>
      </ScrollView>

      <BottomButton label={BUTTON_LABELS[step]} filled={filled} loading={submitting} onPress={onNext} />
    </KeyboardAvoidingView>
  );
}
