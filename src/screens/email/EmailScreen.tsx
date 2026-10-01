import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Supabase 에러 문구 → 화면 문구 */
function toMessage(message: string) {
  if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요';
  if (message.includes('already registered')) return '이미 가입된 이메일이에요';
  if (message.includes('Email not confirmed')) return '메일로 온 인증 링크를 먼저 눌러 주세요';
  return message;
}


export default function EmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const isSignup = params.mode === 'signup';
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length >= (isSignup ? 6 : 1);

  const goOtherMode = () => {
    if (isSignup) router.back();
    else router.push({ pathname: '/email', params: { mode: 'signup', email: email.trim() } });
  };

  const goHome = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/home');
  };

  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const credentials = { email: email.trim(), password };

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp(credentials);
        if (error) {
          setError(toMessage(error.message));
          return;
        }
        if (!data.session) {
          setNotice('메일로 온 인증 링크를 누른 뒤 로그인해 주세요');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) {
          setError(toMessage(error.message));
          return;
        }
      }

      goHome();
    } finally {
      setSubmitting(false);
    }
  };

  const inputBox = (field: 'email' | 'password') =>
    `h-[56px] flex-row items-center rounded-[14px] border-[1.5px] bg-cardBackground px-[16px] ${
      focused === field ? 'border-main' : 'border-transparent'
    }`;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="flex-1 px-[24px]"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}
      >
        <Pressable className="-ml-[6px] h-[40px] w-[40px] justify-center" onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={Colors.mainText} />
        </Pressable>

        <Text className="mt-[16px] text-[26px] font-bold text-mainText">
          {isSignup ? '이메일로 가입하기' : '이메일로 로그인'}
        </Text>
        <Text className="mt-[8px] text-[14px] text-subText1">
          {isSignup ? '비밀번호는 6자 이상으로 정해 주세요' : '가입할 때 쓴 이메일과 비밀번호를 입력해 주세요'}
        </Text>

        <View className="mt-[28px] gap-[12px]">
          <View className={inputBox('email')}>
            <TextInput
              className="flex-1 p-0 text-[17px] text-mainText"
              placeholder="이메일"
              placeholderTextColor={Colors.disabledText}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <View className={inputBox('password')}>
            <TextInput
              ref={passwordRef}
              className="flex-1 p-0 text-[17px] text-mainText"
              placeholder="비밀번호"
              placeholderTextColor={Colors.disabledText}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry={!showPassword}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              textContentType={isSignup ? 'newPassword' : 'password'}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.subText1}
              />
            </Pressable>
          </View>
        </View>

        {error && <Text className="mt-[12px] text-[13px] text-danger">{error}</Text>}
        {notice && <Text className="mt-[12px] text-[13px] text-main">{notice}</Text>}

        <View className="flex-1" />

        <Pressable className="mb-[14px] items-center py-[6px]" onPress={goOtherMode} hitSlop={8}>
          <Text className="text-[14px] text-subText1">
            {isSignup ? '이미 계정이 있어요 · ' : '처음이신가요? · '}
            <Text className="font-semibold text-mainText">{isSignup ? '로그인' : '가입하기'}</Text>
          </Text>
        </Pressable>

        <Pressable
          className={`h-[56px] items-center justify-center rounded-[14px] ${canSubmit ? 'bg-main' : 'bg-cardBackground'}`}
          onPress={onSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.textOnMain} />
          ) : (
            <Text className={`text-[16px] font-semibold ${canSubmit ? 'text-textOnMain' : 'text-subText2'}`}>
              {isSignup ? '가입하기' : '로그인'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
