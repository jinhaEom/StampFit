import { AlertModal } from '@/components/AlertModal';
import { Colors, PART_PALETTE } from '@/constants/colors';
import { useAdsStore } from '@/store/useAdsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-simple-toast';
import { useSettings } from './hooks/useSettings';

export default function SettingScreen() {
  const router = useRouter();
  const {
    insets,
    parts,
    resetAll,
    logout,
    resetConfirmVisible,
    setResetConfirmVisible,
  } = useSettings();

  const adsRemoved = useAdsStore((s) => s.adsRemoved);
  const purchasing = useAdsStore((s) => s.purchasing);
  const purchaseRemoveAds = useAdsStore((s) => s.purchaseRemoveAds);
  const restorePurchases = useAdsStore((s) => s.restorePurchases);

  const authUser = useAuthStore((s) => s.user);
  const PROVIDER_LABEL: Record<string, string> = { google: '구글', apple: 'Apple', email: '이메일' };
  const provider = authUser?.app_metadata?.provider;
  const accountLabel =
    authUser?.email ?? (provider ? (PROVIDER_LABEL[provider] ?? provider) : '알 수 없음');

  const MAX_DOTS = 5;
  const partDots = parts.slice(0, MAX_DOTS).map((p, i) => ({
    id: p.id,
    isActive: p.isActive,
    color: PART_PALETTE[i % PART_PALETTE.length],
  }));
  const overflowCount = Math.max(0, parts.length - MAX_DOTS);

  const onLogout = async () => {
    await logout();
    Toast.show('로그아웃됐어요', Toast.SHORT);
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
      <ScrollView
        contentContainerClassName="px-[16px] pb-[24px] ios:pb-[74px] android:pb-[104px]"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mt-[8px] text-[26px] font-medium text-fg">설정</Text>

        <Text className="mb-[8px] mt-[24px] text-[13px] text-sub">부위 관리</Text>
        <TouchableOpacity
          className="flex-row items-center justify-between rounded-[16px] bg-card p-[16px]"
          activeOpacity={0.8}
          onPress={() => router.push('/settings/parts')}
        >
          <Text className="text-[15px] text-fg">부위 설정</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.gray2Color} />
        </TouchableOpacity>

        <Text className="mb-[8px] mt-[24px] text-[13px] text-sub">계정</Text>
        <View className="rounded-[16px] bg-card p-[16px]">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] text-dim">로그인 계정</Text>
            <Text className="ml-[12px] flex-1 text-right text-[13px] text-sub" numberOfLines={1}>
              {accountLabel}
            </Text>
          </View>
        </View>


        <Text className="mb-[8px] mt-[24px] text-[13px] text-sub">광고</Text>
        <View className="rounded-[16px] bg-card p-[16px]">
          {adsRemoved ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] text-fg">광고가 제거됐어요</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.mainColor} />
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={purchaseRemoveAds}
                disabled={purchasing}
                className="flex-row items-center justify-between"
              >
                <Text className="text-[15px] text-fg">광고 제거</Text>
                {purchasing ? (
                  <ActivityIndicator size="small" color={Colors.gray2Color} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray2Color} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={restorePurchases} className="mt-[12px]">
                <Text className="text-[13px] text-sub">구매 복원</Text>
              </TouchableOpacity>
            </>
          )}
        </View>


        <Text className="mb-[8px] mt-[24px] text-[13px] text-sub">데이터 관리</Text>
        <TouchableOpacity
          className="rounded-[16px] bg-card p-[16px]"
          activeOpacity={0.8}
          onPress={() => setResetConfirmVisible(true)}
        >
          <Text className="text-[15px] text-danger">모든 기록 초기화</Text>
        </TouchableOpacity>


        <Text className="mb-[8px] mt-[24px] text-[13px] text-sub">앱 정보</Text>
        <View className="rounded-[16px] bg-card p-[16px]">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] text-fg">버전</Text>
            <Text className="text-[13px] text-sub">{'1.0.0'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onLogout} className="items-end  mt-[24px]">
          <Text className="text-[15px] text-dim">로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>

      <AlertModal
        visible={resetConfirmVisible}
        title="데이터 초기화"
        contents="모든 기록과 부위 설정이 삭제돼요. 되돌릴 수 없어요."
        okLabel="초기화"
        cancelLabel="취소"
        danger
        onOk={() => {
          setResetConfirmVisible(false);
          resetAll();
        }}
        onCancel={() => setResetConfirmVisible(false)}
      />
    </View>
  );
}
