import { Colors } from '@/constants/colors';
import { formatDuration } from '@/lib/date';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  label: string;
  minutes: number;
  onConfirm: (hideNext: boolean) => void;
  onCancel: () => void;
}

/** 빠른 기록 안내 (처음 한 번, 다시 보지 않기 가능) */
export function QuickRecordModal({ visible, label, minutes, onConfirm, onCancel }: Props) {
  const [hideNext, setHideNext] = useState(false); // 다시 보지 않기 체크

  // 취소하면 체크 초기화
  const cancel = () => {
    setHideNext(false);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={cancel}>
      <Pressable className="flex-1 items-center justify-center bg-black/80" onPress={cancel}>
        <Pressable className="w-[290px] rounded-[16px] bg-cardBackground p-[20px]" onPress={(e) => e.stopPropagation()}>
          <Text className="text-[16px] font-medium text-mainText">
            {label} · {formatDuration(minutes)}으로 기록할까요?
          </Text>
          <Text className="mt-[6px] text-[13px] text-subText1">강도·컨디션은 보통으로 저장돼요</Text>

          <View className="mt-[18px] flex-row items-center justify-between">
            <Pressable className="flex-row items-center gap-[6px]" onPress={() => setHideNext((v) => !v)} hitSlop={8}>
              <Ionicons
                name={hideNext ? 'checkbox' : 'square-outline'}
                size={18}
                color={hideNext ? Colors.main : Colors.subText2}
              />
              <Text className="text-[13px] text-subText1">다시 보지 않기</Text>
            </Pressable>

            <View className="flex-row gap-[16px]">
              <TouchableOpacity onPress={cancel} hitSlop={8}>
                <Text className="text-[15px] text-subText1">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onConfirm(hideNext)} hitSlop={8}>
                <Text className="text-[15px] font-medium text-main">기록하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
