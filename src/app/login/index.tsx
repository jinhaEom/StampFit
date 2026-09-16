import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';

type FieldName = 'email' | 'password';

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<FieldName | null>(null);

    const onLogin = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            Alert.alert('이메일과 비밀번호를 입력해 주세요');
            return;
        }
        setSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
            });
            if (error) {
                Alert.alert('로그인 실패', error.message);
                return;
            }
            Toast.show("로그인 되었습니다.", Toast.SHORT)
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
                contentContainerClassName="flex-grow px-[24px]"
                contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Image
                    source={require('@/assets/images/stampfit-wordmark.png')}
                    style={{ width: 132, height: 36.6, marginTop: 24 }}
                    resizeMode="contain"
                />
                <Text className="mt-[24px] text-[20px] font-extrabold text-white">
                    매일 한칸씩, 운동습관을 길러봐요
                </Text>



                <View className="mt-[40px]">
                    <View className="mb-[28px]">
                        <Text
                            className={`mb-[8px] text-[13px] font-medium ${focusedField === 'email' ? 'text-accent' : 'text-sub'
                                }`}
                        >
                            이메일
                        </Text>
                        <View
                            className={`border-b pb-[10px] ${focusedField === 'email' ? 'border-accent' : 'border-line'
                                }`}
                        >
                            <TextInput
                                className="p-0 text-[17px] text-fg"
                                placeholder="you@example.com"
                                placeholderTextColor={Colors.disabledColor}
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField((f) => (f === 'email' ? null : f))}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    <View>
                        <Text
                            className={`mb-[8px] text-[13px] font-medium ${focusedField === 'password' ? 'text-accent' : 'text-sub'
                                }`}
                        >
                            비밀번호
                        </Text>
                        <View
                            className={`flex-row items-center border-b pb-[10px] ${focusedField === 'password' ? 'border-accent' : 'border-line'
                                }`}
                        >
                            <TextInput
                                className="flex-1 p-0 text-[17px] text-fg"
                                placeholder="비밀번호 입력"
                                placeholderTextColor={Colors.disabledColor}
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField((f) => (f === 'password' ? null : f))}
                                secureTextEntry={!showPassword}
                                returnKeyType="done"
                                onSubmitEditing={onLogin}
                            />
                            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={18}
                                    color={Colors.disabledColor}
                                />
                            </Pressable>
                        </View>
                    </View>

                    <Pressable className="mt-[14px] self-end" hitSlop={8}>
                        <Text className="text-[13px] text-sub">비밀번호를 잊으셨나요?</Text>
                    </Pressable>
                </View>

                <Pressable
                    className="mt-[32px] h-[56px] items-center justify-center rounded-[16px] bg-accent active:opacity-80"
                    onPress={onLogin}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color={Colors.onAccent} />
                    ) : (
                        <Text className="text-[16px] font-bold text-on-accent">로그인</Text>
                    )}
                </Pressable>

                <View className="my-[28px] flex-row items-center gap-[10px]">
                    <View className="h-[1px] flex-1 bg-line" />
                    <Text className="text-[12px] text-dim">또는</Text>
                    <View className="h-[1px] flex-1 bg-line" />
                </View>

                <SocialAuthButtons mode="login" onSuccess={() => router.replace('/home')} />

                <View className="mt-[32px] flex-row justify-center gap-[6px]">
                    <Text className="text-[13px] text-sub">계정이 없으신가요?</Text>
                    <Link href="/signup" replace asChild>
                        <Pressable hitSlop={8}>
                            <Text className="text-[13px] font-semibold text-accent">회원가입</Text>
                        </Pressable>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
