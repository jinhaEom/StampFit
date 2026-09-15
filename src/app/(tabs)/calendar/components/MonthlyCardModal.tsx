import { Colors } from '@/constants/colors';
import { CONDITION_EMOJI } from '@/constants/recovery';
import { MonthlyAnalytics } from '@/lib/analytics';
import { formatDuration } from '@/lib/date';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { captureRef } from 'react-native-view-shot';

interface Props {
  visible: boolean;
  onClose: () => void;
  analytics: MonthlyAnalytics;
}

export function MonthlyCardModal({ visible, onClose, analytics }: Props) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const conditionIndex = Math.max(0, Math.min(4, Math.round(analytics.avgCondition) - 1));

  // 1. 사진첩에 저장\
  const onSaveToGallery = async () => {
    if (!cardRef.current || saving) return;
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        await MediaLibrary.Asset.create(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show('사진첩에 저장되었어요!', Toast.SHORT);
      } else {
        Toast.show('사진첩 접근 권한이 필요합니다.', Toast.SHORT);
      }
    } catch (e) {
      console.warn('사진첩 저장 실패', e);
      Toast.show('저장에 실패했어요. 앱 재빌드 여부를 확인해주세요.', Toast.SHORT);
    } finally {
      setSaving(false);
    }
  };

  // 2. SNS 공유하기
  const onShareSNS = async () => {
    if (!cardRef.current || sharing) return;
    try {
      setSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${analytics.year}년 ${analytics.month}월 운동 리포트`,
          UTI: 'public.png',
        });
      } else {
        Toast.show('공유 기능을 사용할 수 없는 기기입니다.', Toast.SHORT);
      }
    } catch (e) {
      console.warn('SNS 공유 실패', e);
      Toast.show('공유에 실패했어요. 앱 재빌드 여부를 확인해주세요.', Toast.SHORT);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center bg-black/80 px-[20px]"
        style={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="items-center justify-center py-[20px]"
          className="w-full"
        >
          <View
            ref={cardRef}
            collapsable={false}
            className="w-full max-w-[340px] overflow-hidden rounded-[28px] border border-white/10 bg-[#121316] p-[24px]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View className="flex-row items-center justify-between pb-[16px]">

              <View className="flex-row items-center gap-[8px] ">
                <View className="h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-accent">
                  <Text className="text-[14px] font-black text-on-accent">H</Text>
                </View>
                <Text className="text-[13px] font-bold tracking-widest text-fg">
                  MYHEALTH
                </Text>
              </View>

              <View className='h-[24px] w-[24px]'>
                <Ionicons name='close' size={24} color={Colors.whiteColor} onPress={onClose} />
              </View>
            </View>

            <View className="mt-[20px]">
              <Text className="text-[12px] font-medium tracking-wider text-accent uppercase">
                Monthly Workout Report
              </Text>
              <Text className="mt-[4px] text-[24px] font-bold text-fg">
                {analytics.month}월의 운동 기록
              </Text>
            </View>

            <View className="mt-[18px] rounded-[18px] bg-card p-[16px]">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[11px] text-sub">총 운동 시간</Text>
                  <Text className="mt-[4px] text-[22px] font-bold text-fg">
                    {formatDuration(analytics.totalMinutes)}
                  </Text>
                </View>
                <View className="h-[36px] w-[1px] bg-white/10" />
                <View className='items-start'>
                  <Text className="text-[11px] text-sub">총 출석 일수</Text>
                  <Text className="mt-[4px] text-[22px] font-bold text-accent ">
                    {analytics.totalCount}일
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-[12px] flex-row gap-[10px]">
              {analytics.maxStreak > 0 && (
                <View className="flex-1 flex-row items-center gap-[6px] rounded-[12px] bg-card px-[12px] py-[10px]">
                  <Text className="text-[16px]">🔥</Text>
                  <View>
                    <Text className="text-[10px] text-sub">최대 연속</Text>
                    <Text className="text-[13px] font-bold text-fg">
                      {analytics.maxStreak}일 달성
                    </Text>
                  </View>
                </View>
              )}
              <View className="flex-1 flex-row items-center gap-[6px] rounded-[12px] bg-card px-[12px] py-[10px]">
                <Text className="text-[16px]">
                  {CONDITION_EMOJI[conditionIndex]}
                </Text>
                <View>
                  <Text className="text-[10px] text-sub">평균 강도</Text>
                  <Text className="text-[13px] font-bold text-fg">
                    {analytics.avgIntensity} / 5.0
                  </Text>
                </View>
              </View>
            </View>

            {analytics.topParts.length > 0 && (
              <View className="mt-[20px]">
                <Text className="text-[11px] font-medium tracking-wider text-sub uppercase">
                  Top Focus Parts
                </Text>
                <View className="mt-[10px] gap-[8px]">
                  {analytics.topParts.map((part, idx) => (
                    <View key={part.id} className="gap-[4px]">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-[6px]">
                          <View
                            className="h-[8px] w-[8px] rounded-full"
                            style={{ backgroundColor: part.color }}
                          />
                          <Text className="text-[13px] font-medium text-fg">
                            {idx + 1}위 {part.name}
                          </Text>
                        </View>
                        <Text className="text-[12px] font-semibold text-sub">
                          {part.percentage}% ({formatDuration(part.minutes)})
                        </Text>
                      </View>
                      <View className="h-[5px] w-full overflow-hidden rounded-full bg-white/5">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(8, part.percentage))}%`,
                            backgroundColor: part.color,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="mt-[24px] items-center border-t border-white/5 pt-[14px]">
              <Text className="text-[10px] italic tracking-wide text-dim">
                “Slow and steady wins the race.”
              </Text>
            </View>
          </View>

          <View className="mt-[20px] w-full max-w-[340px] gap-[10px]">
            <View className="flex-row gap-[10px]">
              <TouchableOpacity
                onPress={onSaveToGallery}
                disabled={saving || sharing}
                className="flex-1 flex-row items-center justify-center gap-[6px] rounded-[16px] bg-accent py-[15px]"
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.onAccent} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color={Colors.onAccent} />
                    <Text className="text-[15px] font-bold text-on-accent">
                      사진첩 저장
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onShareSNS}
                disabled={saving || sharing}
                className="flex-1 flex-row items-center justify-center gap-[6px] rounded-[16px] bg-card border border-white/10 py-[15px]"
                activeOpacity={0.8}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={Colors.whiteColor} />
                ) : (
                  <>
                    <Ionicons name="share-social-outline" size={18} color={Colors.whiteColor} />
                    <Text className="text-[15px] font-bold text-fg">
                      SNS 공유
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Pressable
              onPress={onClose}
              className="items-center py-[10px]"
            >
              <Text className="text-[14px] font-medium text-sub">닫기</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default MonthlyCardModal;
