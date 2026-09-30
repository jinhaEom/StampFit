import { AlertModal } from "@/components/AlertModal";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-simple-toast";
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
    Toast.show("저장되었어요.", Toast.SHORT);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/60 px-[16px]">
        <View className="rounded-[20px] bg-card p-[20px]">
          <View className="flex-row items-center justify-between mb-[16px]">
            <Text className="text-[17px] font-semibold text-fg">주간 목표 설정</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.disabledColor} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-[10px]">
            <TextInput
              className="w-[64px] rounded-[8px] bg-bg px-[10px] py-[8px] text-center text-[15px] text-fg"
              value={goalCountInput}
              onChangeText={setGoalCountInput}
              placeholder="1"
              placeholderTextColor={Colors.disabledColor}
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <Text className="text-[15px] text-fg">회 / 주</Text>
            <View className="flex-1" />
            <Text className="text-[13px] text-sub">매주 반복</Text>
            <Switch
              value={goalRecurring}
              onValueChange={setGoalRecurring}
              trackColor={{ false: Colors.gray1Color, true: Colors.mainColor }}
              thumbColor={Colors.whiteColor}
            />
          </View>
          <Pressable
            className="mt-[20px] items-center rounded-[12px] bg-accent py-[12px]"
            onPress={handleSave}
          >
            <Text className="text-[15px] font-semibold text-on-accent">저장</Text>
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
