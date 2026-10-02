import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  contents: string;
  okLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onOk: () => void;
  onCancel?: () => void;
}

export function AlertModal({ visible, title, contents, okLabel, cancelLabel, danger, onOk, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable className="flex-1 items-center justify-center bg-black/80" onPress={onCancel}>
        <Pressable className="w-[280px] rounded-[16px] bg-cardBackground p-[20px]" onPress={(e) => e.stopPropagation()}>
          <Text className="text-[16px] font-medium text-mainText">{title}</Text>
          <Text className="mt-[6px] text-[13px] leading-[19px] text-subText1">{contents}</Text>
          <View className="mt-[18px] flex-row justify-end gap-[16px]">
            {cancelLabel && (
              <TouchableOpacity onPress={onCancel} hitSlop={8}>
                <Text className="text-[15px] text-subText1">{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onOk} hitSlop={8}>
              <Text className={`text-[15px] font-medium ${danger ? 'text-danger' : 'text-mainText'}`}>{okLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
