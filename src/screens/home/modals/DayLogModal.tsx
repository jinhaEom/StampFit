import DayDetail from '@/components/DayDetail';
import type { WorkoutLog } from '@/lib/types';
import { Modal, Pressable, View } from 'react-native';

interface Props {
  visible: boolean;
  date: string | null;
  log: WorkoutLog | undefined;
  onClose: () => void;
}

/** 이번 주 칸 탭 시 그날 기록 모달 */
export function DayLogModal({ visible, date, log, onClose }: Props) {
  if (!date) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center px-[16px]">
        {/* 바깥 탭 시 닫기 */}
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <DayDetail date={date} log={log} onBeforeNavigate={onClose} onAfterDelete={onClose} onClose={onClose} />
      </View>
    </Modal>
  );
}
