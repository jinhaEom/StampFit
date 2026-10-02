import { Chip } from '@/components/Chip';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { toast } from '@/lib/toast';
import { useCycleEditor } from '../hooks/useCycleEditor';

interface CycleModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CycleModal = ({ visible, onClose }: CycleModalProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    {/* 모달 안쪽은 열 때마다 새로 그려져서 저장된 싸이클로 시작 */}
    <CycleEditor onClose={onClose} />
  </Modal>
);

function CycleEditor({ onClose }: { onClose: () => void }) {
  const { parts, steps, openStepId, setOpenStepId, addStep, removeStep, togglePart } = useCycleEditor();
  const activeParts = parts.filter((p) => p.isActive);

  const finishStep = () => {
    setOpenStepId(null);
    toast.done('저장했어요');
  };

  return (
    <View className="flex-1 justify-center bg-black/60 px-[16px]">
      <View className="max-h-[85%] rounded-[20px] bg-cardBackground p-[20px]">
        <View className="flex-row items-center justify-between">
          <Text className="text-[17px] font-semibold text-mainText">운동 싸이클</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={Colors.subText1} />
          </TouchableOpacity>
        </View>
        <Text className="mb-[14px] mt-[4px] text-[13px] text-subText1">운동을 기록할 때마다 다음 단계로 넘어가요</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {steps.map((step, index) => {
            const isOpen = step.id === openStepId;
            const canFinish = step.bodyPartIds.length > 0;
            return (
              <View
                key={step.id}
                className={`mb-[8px] rounded-[14px] border bg-background ${isOpen ? 'border-main' : 'border-transparent'}`}
              >
                {/* 단계 한 줄 (누르면 펼침·접힘) */}
                <Pressable
                  className="flex-row items-center gap-[10px] px-[14px] py-[12px]"
                  onPress={() => setOpenStepId(isOpen ? null : step.id)}
                >
                  <View
                    className={`h-[22px] w-[22px] items-center justify-center rounded-full ${isOpen ? 'bg-main' : 'bg-border'}`}
                  >
                    <Text className={`text-[12px] font-medium ${isOpen ? 'text-textOnMain' : 'text-subText1'}`}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-[15px] ${step.label ? 'text-mainText' : 'text-subText2'}`}
                    numberOfLines={1}
                  >
                    {step.label || '부위를 선택하세요'}
                  </Text>
                  {!isOpen && <Ionicons name="chevron-down" size={18} color={Colors.subText2} />}
                </Pressable>

                {/* 펼친 단계: 부위 선택 + 삭제·완료 */}
                {isOpen && (
                  <View className="px-[14px] pb-[14px]">
                    <View className="flex-row flex-wrap gap-[8px]">
                      {activeParts.map((part) => (
                        <Chip
                          key={part.id}
                          label={part.name}
                          small
                          selected={step.bodyPartIds.includes(part.id)}
                          onPress={() => togglePart(step.id, part.id)}
                        />
                      ))}
                    </View>
                    <View className="mt-[14px] flex-row items-center justify-between">
                      <TouchableOpacity onPress={() => removeStep(step.id)} hitSlop={8}>
                        <Text className="text-[13px] text-subText2">삭제</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={finishStep}
                        disabled={!canFinish}
                        className={`rounded-full px-[16px] py-[7px] ${canFinish ? 'bg-main' : 'bg-border'}`}
                      >
                        <Text className={`text-[13px] font-medium ${canFinish ? 'text-textOnMain' : 'text-subText2'}`}>
                          완료
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          <Pressable
            className="items-center rounded-[14px] border border-dashed border-border py-[12px]"
            onPress={addStep}
          >
            <Text className="text-[14px] font-medium text-subText1">+ 단계 추가</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
