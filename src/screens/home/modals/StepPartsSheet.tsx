import { BottomSheet } from '@/components/BottomSheet';
import { Chip } from '@/components/Chip';
import { Pressable, Text, View } from 'react-native';
import { useStepForm } from '../hooks/useStepForm';

interface Props {
  visible: boolean;
  stepId: string | null;
  onClose: () => void;
}

export function StepPartsSheet({ visible, stepId, onClose }: Props) {
  const { parts, number, isNew, partIds, toggle, canSave, save, remove } = useStepForm(stepId);

  const handleSave = () => {
    save();
    onClose();
  };

  const handleRemove = () => {
    remove();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="어떤 부위를 운동하나요?"
      description={`${number}단계 · 여러 부위를 골라도 돼요`}
    >
      <View className="flex-row flex-wrap gap-[8px]">
        {parts.map((part) => (
          <Chip key={part.id} label={part.name} selected={partIds.includes(part.id)} onPress={() => toggle(part.id)} />
        ))}
      </View>

      <View className="mt-[28px] flex-row gap-[8px]">
        {!isNew && (
          <Pressable className="items-center justify-center rounded-[14px] bg-cardSelected px-[22px]" onPress={handleRemove}>
            <Text className="text-[15px] font-semibold text-danger">삭제</Text>
          </Pressable>
        )}
        <Pressable
          className={`flex-1 items-center rounded-[14px] py-[15px] ${canSave ? 'bg-main' : 'bg-cardSelected'}`}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Text className={`text-[15px] font-semibold ${canSave ? 'text-textOnMain' : 'text-subText2'}`}>
            {isNew ? '추가' : '저장'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
