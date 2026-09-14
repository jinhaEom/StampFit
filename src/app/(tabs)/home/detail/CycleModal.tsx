import { useSettings } from '@/app/(tabs)/settings/hooks/useSettings';
import { AlertModal } from '@/components/AlertModal';
import { Chip } from '@/components/Chip';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-simple-toast';

interface CycleModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CycleModal = ({ visible, onClose }: CycleModalProps) => {
  const {
    cycle,
    cycleSteps,
    addCycleStep,
    removeCycleStep,
    toggleCycleStepPart,
    moveCycleStep,
    saveCycle,
    invalidCycleAlertVisible,
    setInvalidCycleAlertVisible,
    parts,
  } = useSettings();

  const handleSaveCycle = () => {
    if (!saveCycle()) {
      setInvalidCycleAlertVisible(true);
      return;
    }
    Toast.show('저장되었어요.', Toast.SHORT);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center bg-black/60 px-[16px]">
        <View className="rounded-[20px] bg-card p-[20px] max-h-[85%]">
          <View className="flex-row items-center justify-between mb-[12px]">
            <Text className="text-[17px] font-semibold text-fg">운동 싸이클 설정</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.disabledColor} />
            </TouchableOpacity>
          </View>

          {cycleSteps.length === 0 && (
            <Text className="text-[13px] text-dim mb-[12px]">
              분할 순서를 등록하면 홈 화면에서 오늘 할 차례를 알려드려요.
            </Text>
          )}

          <ScrollView showsVerticalScrollIndicator={false} className="mb-[12px]">
            {cycleSteps.map((step, index) => (
              <View
                key={step.id}
                className={index > 0 ? 'mt-[16px] border-t border-line pt-[16px]' : ''}
              >
                <View className="flex-row items-center gap-[8px]">
                  <Text className="w-[16px] text-[13px] text-dim">{index + 1}</Text>
                  <View className="flex-1 rounded-[8px] bg-bg px-[10px] py-[8px]">
                    <Text className={`text-[15px] ${step.label ? 'text-fg' : 'text-dim'}`}>
                      {step.label || '아래에서 부위를 선택하세요'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => moveCycleStep(step.id, -1)}
                    disabled={index === 0}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={18}
                      color={index === 0 ? Colors.gray1Color : Colors.gray2Color}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveCycleStep(step.id, 1)}
                    disabled={index === cycleSteps.length - 1}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={index === cycleSteps.length - 1 ? Colors.gray1Color : Colors.gray2Color}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeCycleStep(step.id)} hitSlop={8}>
                    <Ionicons name="close" size={18} color={Colors.disabledColor} />
                  </TouchableOpacity>
                </View>

                <View className="mt-[10px] flex-row flex-wrap gap-[8px]">
                  {parts
                    .filter((p) => p.isActive)
                    .map((part) => (
                      <Chip
                        key={part.id}
                        label={part.name}
                        small
                        selected={step.bodyPartIds.includes(part.id)}
                        onPress={() => toggleCycleStepPart(step.id, part.id)}
                      />
                    ))}
                </View>
              </View>
            ))}

            <Pressable
              className="mt-[14px] items-center rounded-[10px] border border-dashed border-line py-[10px]"
              onPress={addCycleStep}
            >
              <Text className="text-[14px] font-medium text-sub">+ 단계 추가</Text>
            </Pressable>
          </ScrollView>

          <Pressable
            className="items-center rounded-[10px] bg-accent py-[12px]"
            onPress={handleSaveCycle}
          >
            <Text className="text-[15px] text-[#000000]">저장</Text>
          </Pressable>


        </View>
      </View>

      <AlertModal
        visible={invalidCycleAlertVisible}
        title="싸이클 설정 오류"
        contents="모든 단계에 부위를 1개 이상 선택해주세요."
        okLabel="확인"
        onOk={() => setInvalidCycleAlertVisible(false)}
      />
    </Modal>
  );
};
