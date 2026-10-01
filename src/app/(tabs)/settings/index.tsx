import { AlertModal } from '@/components/AlertModal';
import { Colors, PART_PALETTE } from '@/constants/colors';
import { useAdsStore } from '@/store/useAdsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogout } from './hooks/useLogout';

export default function SettingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const parts = useWorkoutStore((s) => s.parts);
  const { loggingOut, unsyncedCount, requestLogout, logoutNow, dismissWarning } = useLogout();

  const adsRemoved = useAdsStore((s) => s.adsRemoved);
  const purchasing = useAdsStore((s) => s.purchasing);
  const purchaseRemoveAds = useAdsStore((s) => s.purchaseRemoveAds);
  const restorePurchases = useAdsStore((s) => s.restorePurchases);

  const authUser = useAuthStore((s) => s.user);
  const PROVIDER_LABEL: Record<string, string> = { google: '구글', apple: 'Apple', email: '이메일' };
  const provider = authUser?.app_metadata?.provider;
  const accountLabel =
    authUser?.email ?? (provider ? (PROVIDER_LABEL[provider] ?? provider) : '알 수 없음');

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
      <ScrollView
        contentContainerClassName="px-[16px] pb-[24px] ios:pb-[74px] android:pb-[104px]"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mt-[8px] text-[26px] font-medium text-mainText">설정</Text>

        <Text className="mb-[8px] mt-[24px] text-[13px] text-subText1">부위 관리</Text>
        <TouchableOpacity
          className="flex-row items-center justify-between rounded-[16px] bg-cardBackground p-[16px]"
          onPress={() => router.push('/settings/parts')}
        >
          <Text className="text-[15px] text-mainText">부위 설정</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.subText1} />
        </TouchableOpacity>

        <Text className="mb-[8px] mt-[24px] text-[13px] text-subText1">계정</Text>
        <View className="rounded-[16px] bg-cardBackground p-[16px]">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] text-subText2">로그인 계정</Text>
            <Text className="ml-[12px] flex-1 text-right text-[13px] text-subText1" numberOfLines={1}>
              {accountLabel}
            </Text>
          </View>
        </View>


        <Text className="mb-[8px] mt-[24px] text-[13px] text-subText1">광고</Text>
        <View className="rounded-[16px] bg-cardBackground p-[16px]">
          {adsRemoved ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] text-mainText">광고가 제거됐어요</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.main} />
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={purchaseRemoveAds}
                disabled={purchasing}
                className="flex-row items-center justify-between"
              >
                <Text className="text-[15px] text-mainText">광고 제거</Text>
                {purchasing ? (
                  <ActivityIndicator size="small" color={Colors.subText1} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.subText1} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={restorePurchases} className="mt-[12px]">
                <Text className="text-[13px] text-subText1">구매 복원</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text className="mb-[8px] mt-[24px] text-[13px] text-subText1">앱 정보</Text>
        <View className="rounded-[16px] bg-cardBackground p-[16px]">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] text-mainText">버전</Text>
            <Text className="text-[13px] text-subText1">{'1.0.0'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={requestLogout} disabled={loggingOut} className="items-end  mt-[24px]">
          <Text className="text-[13px] text-subText2">{loggingOut ? '로그아웃 중…' : '로그아웃'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <AlertModal
        visible={unsyncedCount > 0}
        title="아직 서버에 저장되지 않은 기록이 있어요"
        contents={`기록 ${unsyncedCount}개가 이 기기에만 있어서, 지금 로그아웃하면 사라져요. 인터넷 연결을 확인하고 다시 시도해 주세요.`}
        cancelLabel="취소"
        okLabel="그래도 로그아웃"
        danger
        onCancel={dismissWarning}
        onOk={logoutNow}
      />

    </View>
  );
}
