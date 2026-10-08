import { Colors } from '@/constants/colors';
import { MonthlyAnalytics } from '@/lib/analytics';
import { formatDuration } from '@/lib/date';
import { toast } from '@/lib/toast';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

interface Props {
  visible: boolean;
  onClose: () => void;
  analytics: MonthlyAnalytics;
}

/* 이달의 운동 카드 모달 */
export function MonthlyCardModal({ visible, onClose, analytics }: Props) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);


  // 1. 사진첩에 저장
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
        toast.done('사진첩에 저장했어요');
      } else {
        toast.error('사진첩 접근 권한이 필요해요', '설정에서 사진 접근을 허용해 주세요');
      }
    } catch (e) {
      console.warn('사진첩 저장 실패', e);
      toast.error('저장하지 못했어요');
    } finally {
      setSaving(false);
    }
  };

  // 2. SNS 공유
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
        toast.error('공유할 수 없는 기기예요');
      }
    } catch (e) {
      console.warn('SNS 공유 실패', e);
      toast.error('공유하지 못했어요');
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
                <Image source={require('@/assets/images/stampfit-wordmark.png')} style={{ width: 100, height: 27.5 }} resizeMode='contain' />
              </View>

              <View className='h-[24px] w-[24px]'>
                <Ionicons name='close' size={24} color={Colors.mainText} onPress={onClose} />
              </View>
            </View>

            <View className="mt-[12px]">
              <Text className="text-[12px] font-medium tracking-wider text-main uppercase">
                Monthly Workout Report
              </Text>
              <Text className="mt-[4px] text-[24px] font-bold text-mainText">
                {analytics.month}월의 운동 기록
              </Text>
            </View>

            <View className="mt-[18px] rounded-[18px] bg-cardBackground p-[16px]">
              <View className="flex-row items-center ">
                <View>
                  <Text className="text-[11px] text-subText1">총 운동 시간</Text>
                  <Text className="mt-[4px] text-[22px] font-bold text-mainText">
                    {formatDuration(analytics.totalMinutes)}
                  </Text>
                </View>
                <View className="h-[36px] w-[1px] bg-white/10 ml-[30px]" />
                <View className='items-start px-[20px]'>
                  <Text className="text-[11px] text-subText1">총 운동 일수</Text>
                  <Text className="mt-[4px] text-[22px] font-bold text-main ">
                    {analytics.totalCount}일
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-[12px] flex-row gap-[10px]">
              <View className="flex-1 flex-row items-center gap-[8px] rounded-[12px] bg-cardBackground px-[12px] py-[10px]">
                <Ionicons name="calendar-outline" size={16} color={Colors.main} />
                <View>
                  <Text className="text-[10px] text-subText1">주 평균</Text>
                  <Text className="text-[13px] font-bold text-mainText">{analytics.weeklyAvg}회</Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-[8px] rounded-[12px] bg-cardBackground px-[12px] py-[10px]">
                <Ionicons name="barbell-outline" size={16} color={Colors.main} />
                <View>
                  <Text className="text-[10px] text-subText1">평균 강도</Text>
                  <Text className="text-[13px] font-bold text-mainText">{analytics.avgIntensity} / 5.0</Text>
                </View>
              </View>
            </View>

            {analytics.topParts.length > 0 && (
              <View className="mt-[20px]">
                <Text className="text-[11px] font-medium tracking-wider text-subText1 uppercase">
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
                          <Text className="text-[13px] font-medium text-mainText">
                            {idx + 1}위 {part.name}
                          </Text>
                        </View>
                        <Text className="text-[12px] font-semibold text-subText1">
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
              <Text className="text-[10px] italic tracking-wide text-subText2">
                “Slow and steady wins the race.”
              </Text>
            </View>
          </View>

          <View className="mt-[20px] w-full max-w-[340px] gap-[10px]">
            <View className="flex-row gap-[10px]">
              <TouchableOpacity
                onPress={onSaveToGallery}
                disabled={saving || sharing}
                className="flex-1 flex-row items-center justify-center gap-[6px] rounded-[16px] bg-cardBackground border border-main/30 py-[15px]"
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.main} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color={Colors.main} />
                    <Text className="text-[15px] font-bold text-main">
                      사진첩 저장
                    </Text>
                  </>
                )}
              </TouchableOpacity>


              <TouchableOpacity
                onPress={onShareSNS}
                disabled={saving || sharing}
                className="flex-1 flex-row items-center justify-center gap-[6px] rounded-[16px] bg-cardBackground border border-white/10 py-[15px]"
                activeOpacity={0.8}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={Colors.mainText} />
                ) : (
                  <>
                    <Ionicons name="share-social-outline" size={18} color={Colors.mainText} />
                    <Text className="text-[15px] font-bold text-mainText">
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
              <Text className="text-[14px] font-medium text-subText1">닫기</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default MonthlyCardModal;
