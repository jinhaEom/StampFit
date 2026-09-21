import DayDetail from '@/app/(tabs)/calendar/components/DayDetail';
import { Colors } from '@/constants/colors';
import type { WorkoutLog } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Modal, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  date: string | null;
  log: WorkoutLog | undefined;
  onClose: () => void;
}

/** 이번 주 잔디 칸을 탭했을 때, 해당 날짜 기록을 추가/수정할 수 있는 모달 */
export function DayLogModal({ visible, date, log, onClose }: Props) {
  if (!date) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/60 px-[16px]">
        <View className="mb-[8px] flex-row justify-end">
          <TouchableOpacity
            className="h-[32px] w-[32px] items-center justify-center rounded-full bg-card"
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={Colors.gray2Color} />
          </TouchableOpacity>
        </View>
        <DayDetail date={date} log={log} onBeforeNavigate={onClose} onAfterDelete={onClose} />
      </View>
    </Modal>
  );
}
