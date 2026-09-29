import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSignup = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert('모든 항목을 입력해 주세요');
      return;
    }
    if (password.length < 6) {
      Alert.alert('비밀번호는 6자 이상이어야 해요');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('비밀번호가 일치하지 않아요');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: { full_name: trimmedName } },
      });
      if (error) {
        Alert.alert('회원가입 실패', error.message);
        return;
      }
      if (!data.session) {
        Alert.alert('가입 완료', '이메일로 온 인증 링크를 확인해 주세요', [
          { text: '확인', onPress: () => router.replace('/login') },
        ]);
        return;
      }
      router.replace('/home');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-[24px]"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-[32px] items-center">
          <View className="mb-[16px] h-[64px] w-[64px] items-center justify-center rounded-[20px] bg-accent">
            <Ionicons name="fitness" size={30} color={Colors.onAccent} />
          </View>
          <Text className="text-[26px] font-semibold text-fg">계정을 만들어요</Text>
          <Text className="mt-[6px] text-[14px] text-sub">몇 초면 시작할 수 있어요</Text>
        </View>

        <View className="gap-[12px]">
          <View className="flex-row items-center gap-[10px] rounded-[14px] bg-card px-[14px]">
            <Ionicons name="person-outline" size={18} color={Colors.disabledColor} />
            <TextInput
              className="h-[50px] flex-1 text-[15px] text-fg"
              placeholder="이름"
              placeholderTextColor={Colors.disabledColor}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>
          <View className="flex-row items-center gap-[10px] rounded-[14px] bg-card px-[14px]">
            <Ionicons name="mail-outline" size={18} color={Colors.disabledColor} />
            <TextInput
              className="h-[50px] flex-1 text-[15px] text-fg"
              placeholder="이메일"
              placeholderTextColor={Colors.disabledColor}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>
          <View className="flex-row items-center gap-[10px] rounded-[14px] bg-card px-[14px]">
            <Ionicons name="lock-closed-outline" size={18} color={Colors.disabledColor} />
            <TextInput
              className="h-[50px] flex-1 text-[15px] text-fg"
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor={Colors.disabledColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="next"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.disabledColor}
              />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-[10px] rounded-[14px] bg-card px-[14px]">
            <Ionicons name="lock-closed-outline" size={18} color={Colors.disabledColor} />
            <TextInput
              className="h-[50px] flex-1 text-[15px] text-fg"
              placeholder="비밀번호 확인"
              placeholderTextColor={Colors.disabledColor}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={onSignup}
            />
          </View>
        </View>

        <Pressable
          className="mt-[20px] h-[52px] items-center justify-center rounded-[14px] bg-accent"
          onPress={onSignup}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.onAccent} />
          ) : (
            <Text className="text-[15px] font-semibold text-on-accent">회원가입</Text>
          )}
        </Pressable>

        <View className="mt-[28px] flex-row justify-center gap-[6px]">
          <Text className="text-[13px] text-sub">이미 계정이 있으신가요?</Text>
          <Link href="/login" replace asChild>
            <Pressable hitSlop={8}>
              <Text className="text-[13px] font-medium text-accent">로그인</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
