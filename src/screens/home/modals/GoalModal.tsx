import { AlertModal } from "@/components/AlertModal";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { toast } from '@/lib/toast';
import { useGoalForm } from "../hooks/useGoalForm";

interface GoalModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GoalModal = ({ visible, onClose }: GoalModalProps) => {
  const {
    goal,
    goalCountInput,
    setGoalCountInput,
    goalRecurring,
    setGoalRecurring,
    saveGoal,
    invalidGoalAlertVisible,
    setInvalidGoalAlertVisible,
  } = useGoalForm();

  const handleSave = () => {
    if (!saveGoal()) {
      setInvalidGoalAlertVisible(true);
      return;
    }
    toast.done('저장했어요');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/60 px-[16px]">
        <View className="rounded-[20px] bg-cardBackground p-[20px]">
          <View className="flex-row items-center justify-between mb-[16px]">
            <Text className="text-[17px] font-semibold text-mainText">주간 목표 설정</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.subText1} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-[10px]">
            <TextInput
              className="w-[64px] rounded-[8px] bg-background px-[10px] py-[8px] text-center text-[15px] text-mainText"
              value={goalCountInput}
              onChangeText={setGoalCountInput}
              placeholder="1"
              placeholderTextColor={Colors.disabledText}
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <Text className="text-[15px] text-mainText">회 / 주</Text>
            <View className="flex-1" />
            <Text className="text-[13px] text-subText1">매주 반복</Text>
            <Switch
              value={goalRecurring}
              onValueChange={setGoalRecurring}
              trackColor={{ false: Colors.border, true: Colors.main }}
              thumbColor={Colors.mainText}
            />
          </View>
          <Pressable
            className="mt-[20px] items-center bg-main/10 rounded-[12px] bg-main py-[12px]"
            onPress={handleSave}
          >
            <Text className="text-[15px] font-semibold text-main">저장</Text>
          </Pressable>
        </View>
      </View>

      <AlertModal
        visible={invalidGoalAlertVisible}
        title="목표 설정 오류"
        contents="목표 횟수는 1회 이상 입력해주세요."
        okLabel="확인"
        onOk={() => setInvalidGoalAlertVisible(false)}
      />
    </Modal>
  );
};
