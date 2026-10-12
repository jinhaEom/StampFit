import { Colors } from '@/constants/colors';
import { supabase, tempAuthClient } from '@/lib/supabase';
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

/** Supabase 에러 문구 → 화면 문구 */
function toMessage(message: string) {
  if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요';
  if (message.includes('already registered')) return '이미 가입된 이메일이에요';
  return message;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 이메일 형식

/* 가입 단계별 제목 */
const SIGNUP_TITLES = ['가입할 이메일을\n입력해 주세요', '비밀번호를\n정해 주세요', '비밀번호를\n한 번 더 입력해 주세요'];

/** 이메일 로그인 (한 화면) · 가입 (한 단계씩) */
export default function EmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const isSignup = params.mode === 'signup';
  const passwordRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState(''); // 가입 시 비밀번호 확인
  /* 0 이메일, 1 비밀번호, 2 비밀번호 확인 (로그인은 1 고정 = 두 칸 다 보임) */
  const [step, setStep] = useState(isSignup ? 0 : 1);
  const lastStep = isSignup ? 2 : 1;
  const [submitting, setSubmitting] = useState(false);

  /* 버튼 색 (지금 입력이 다 됐는지) */
  const filled = isSignup
    ? [email.trim().length > 0, password.length >= 6, passwordConfirm.length > 0][step]
    : email.trim().length > 0 && password.length > 0;

  /* 지금 단계까지 입력값 검사 (문제 있으면 토스트 문구 반환) */
  const validate = () => {
    if (email.trim().length === 0) return '이메일을 입력해 주세요';
    if (!EMAIL_REGEX.test(email.trim())) return '이메일 형식이 맞지 않아요';
    if (step < 1) return null;
    if (password.length === 0) return '비밀번호를 입력해 주세요';
    if (isSignup && password.length < 6) return '비밀번호는 6자 이상이어야 해요';
    if (step < 2) return null;
    if (password !== passwordConfirm) return '비밀번호가 서로 달라요';
    return null;
  };

  const goOtherMode = () => {
    if (isSignup) router.back();
    else router.push({ pathname: '/email', params: { mode: 'signup', email: email.trim() } });
  };

  const onNext = () => {
    if (submitting) return;
    const invalid = validate();
    if (invalid) {
      toast.error(invalid);
      return;
    }
    if (step < lastStep) setStep(step + 1);
    else submit();
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const credentials = { email: email.trim(), password };

      if (isSignup) {
        const { error } = await tempAuthClient.auth.signUp(credentials);
        if (error) {
          toast.error(toMessage(error.message));
          return;
        }
        /* 가입 완료 → 이메일 채운 로그인 화면으로 */
        toast.done('가입 완료', '로그인해 주세요');
        if (router.canDismiss()) router.dismissAll();
        router.push({ pathname: '/email', params: { email: credentials.email } });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        toast.error(toMessage(error.message));
        return;
      }
      if (router.canDismiss()) router.dismissAll();
      router.replace('/home');
    } finally {
      setSubmitting(false);
    }
  };

  const emailField = (
    <UnderlineField
      key="email"
      label="이메일"
      placeholder="example@email.com"
      value={email}
      onChangeText={setEmail}
      autoFocus={isSignup ? step === 0 : !params.email}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      textContentType="emailAddress"
      keyboardType="email-address"
      returnKeyType="next"
      onSubmitEditing={() => (isSignup ? onNext() : passwordRef.current?.focus())}
      submitBehavior="submit"
    />
  );

  const passwordField = (
    <UnderlineField
      key="password"
      ref={passwordRef}
      label="비밀번호"
      value={password}
      onChangeText={setPassword}
      secure
      hint={isSignup && <LengthHint password={password} />}
      autoFocus={isSignup || !!params.email}
      autoComplete={isSignup ? 'new-password' : 'current-password'}
      textContentType={isSignup ? 'newPassword' : 'password'}
      returnKeyType={step < lastStep ? 'next' : 'done'}
      onSubmitEditing={onNext}
      submitBehavior="submit"
    />
  );

  const confirmField = (
    <UnderlineField
      key="confirm"
      label="비밀번호 확인"
      value={passwordConfirm}
      onChangeText={setPasswordConfirm}
      secure
      hint={<MatchHint password={password} confirm={passwordConfirm} />}
      autoFocus
      autoComplete="new-password"
      textContentType="newPassword"
      returnKeyType="done"
      onSubmitEditing={onNext}
      submitBehavior="submit"
    />
  );

  /* 가입은 단계마다 아래에 한 칸씩 추가 */
  const fields = isSignup
    ? [emailField, passwordField, confirmField].slice(0, step + 1).map((field, i) =>
        i === 0 ? (
          field
        ) : (
          <Animated.View key={field.key} entering={FadeInDown.duration(250)}>
            {field}
          </Animated.View>
        ),
      )
    : [emailField, passwordField];

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

      {/* 칸이 늘어나면 스크롤 (새 칸 생기면 맨 아래로) */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="px-[24px] pb-[24px]"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => isSignup && scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <Text className="mt-[16px] text-[26px] leading-[35px] text-mainText">
          {isSignup ? SIGNUP_TITLES[step] : '이메일로 로그인'}
        </Text>

        <View className="mt-[36px] gap-[28px]">{fields}</View>

        {step === (isSignup ? 0 : 1) && (
          <View className="mt-[24px] flex-row items-center justify-between">
            <Pressable className="py-[6px]" onPress={goOtherMode} hitSlop={8}>
              <Text className="text-[14px] text-subText1">
                {isSignup ? '이미 계정이 있어요 · ' : '처음이신가요? · '}
                <Text className="text-mainText">{isSignup ? '로그인' : '가입하기'}</Text>
              </Text>
            </Pressable>
            {!isSignup && (
              <Pressable
                className="py-[6px]"
                onPress={() => router.push({ pathname: '/reset-password', params: { email: email.trim() } })}
                hitSlop={8}
              >
                <Text className="text-[14px] text-subText1">비밀번호 찾기</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <BottomButton
        label={step < lastStep ? '다음' : isSignup ? '가입하기' : '로그인'}
        filled={filled}
        loading={submitting}
        onPress={onNext}
      />
    </KeyboardAvoidingView>
  );
}
