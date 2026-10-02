import { AlertModal } from '@/components/AlertModal';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingRow } from './components/SettingRow';
import { useDeleteAccount } from './hooks/useDeleteAccount';
import { useLogout } from './hooks/useLogout';

/* 로그인 방식별 표시 (이메일 가입은 주소 표시) */
const PROVIDER_LABEL: Record<string, string> = { google: '구글 로그인', apple: 'Apple 로그인' };
const PROVIDER_ICON: Record<string, keyof typeof Ionicons.glyphMap> = { google: 'logo-google', apple: 'logo-apple' };
const APP_VERSION = '1.0.0';

export default function SettingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const parts = useWorkoutStore((s) => s.parts);
  const { loggingOut, unsyncedCount, requestLogout, logoutNow, dismissWarning } = useLogout();
  const { confirmVisible, deleting, requestDelete, cancelDelete, confirmDelete } = useDeleteAccount();

  const authUser = useAuthStore((s) => s.user);
  const provider = authUser?.app_metadata?.provider ?? '';
  const accountLabel = PROVIDER_LABEL[provider] ?? authUser?.email ?? '알 수 없음';
  const accountIcon = PROVIDER_ICON[provider] ?? 'mail-outline';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
      <ScrollView
        contentContainerClassName="px-[16px] pb-[24px] ios:pb-[74px] android:pb-[104px]"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mt-[8px] text-[26px] font-medium text-mainText">설정</Text>

        {/* 로그인 계정 */}
        <View className="mt-[20px] flex-row items-center gap-[14px] rounded-[20px] bg-cardBackground p-[16px]">
          <View className="h-[48px] w-[48px] items-center justify-center rounded-full bg-background">
            <Ionicons name={accountIcon} size={22} color={Colors.mainText} />
          </View>
          <View className="flex-1">
            <Text className="text-[16px] font-medium text-mainText" numberOfLines={1}>
              {accountLabel}
            </Text>
            <Text className="mt-[2px] text-[13px] text-subText1">운동 기록이 이 계정에 저장돼요</Text>
          </View>
        </View>

        <Text className="mb-[8px] ml-[4px] mt-[28px] text-[13px] font-medium text-subText1">운동</Text>
        <View className="overflow-hidden rounded-[16px] bg-cardBackground">
          <SettingRow
            icon="barbell-outline"
            label="부위 관리"
            value={`${parts.length}개`}
            onPress={() => router.push('/settings/parts')}
            chevron
          />
        </View>

        <Text className="mb-[8px] ml-[4px] mt-[28px] text-[13px] font-medium text-subText1">앱 정보</Text>
        <View className="overflow-hidden rounded-[16px] bg-cardBackground">
          <SettingRow
            icon="shield-checkmark-outline"
            label="개인정보처리방침"
            onPress={() => router.push('/settings/privacy')}
            chevron
          />
          <View className="ml-[60px] h-[1px] bg-border" />
          <SettingRow icon="information-circle-outline" label="버전" value={APP_VERSION} />
        </View>

        <View className="mt-[28px] overflow-hidden rounded-[16px] bg-cardBackground">
          <SettingRow
            icon="log-out-outline"
            label={loggingOut ? '로그아웃 중…' : '로그아웃'}
            onPress={requestLogout}
            disabled={loggingOut}
          />
        </View>

        <TouchableOpacity onPress={requestDelete} disabled={deleting} hitSlop={8} className="mt-[20px] self-end">
          <Text className="text-[13px] text-subText2">{deleting ? '탈퇴 중…' : '회원 탈퇴'}</Text>
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
      <AlertModal
        visible={confirmVisible}
        title="정말 탈퇴할까요?"
        contents="모든 운동 기록이 서버와 이 기기에서 삭제되고, 되돌릴 수 없어요."
        cancelLabel="취소"
        okLabel="탈퇴"
        danger
        onCancel={cancelDelete}
        onOk={confirmDelete}
      />

    </View>
  );
}
