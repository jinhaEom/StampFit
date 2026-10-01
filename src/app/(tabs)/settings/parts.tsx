import { AlertModal } from '@/components/AlertModal';
import { Colors } from '@/constants/colors';
import { BodyPart } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePartsEditor } from './hooks/usePartsEditor';

export default function PartsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    parts,
    addPart,
    setPartActive,
    reorderParts,
    newName,
    setNewName,
    duplicateAlertVisible,
    setDuplicateAlertVisible,
    deleteTargetId,
    requestDeletePart,
    cancelDeletePart,
    confirmDeletePart,
  } = usePartsEditor();

  const [editMode, setEditMode] = useState(false);

  const onAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (!addPart(name)) setDuplicateAlertVisible(true);
    else setNewName('');
  };

  const canAdd = newName.trim().length > 0; // 입력 있을 때만 추가 버튼 활성

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
      <View className="flex-row items-center justify-between px-[16px] pb-[8px]">
        <View className="flex-row items-center gap-[8px]">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Colors.subText1} />
          </Pressable>
          <Text className="text-[17px] font-medium text-mainText">부위 관리</Text>
        </View>
        <Pressable onPress={() => setEditMode((v) => !v)} hitSlop={8}>
          <Text className={`text-[15px] ${editMode ? 'font-medium text-main' : 'text-white'}`}>
            {editMode ? '완료' : '편집'}
          </Text>
        </Pressable>
      </View>

      <NestableScrollContainer
        contentContainerClassName="px-[16px] pb-[24px]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // 키보드 떠 있어도 추가 버튼 한 번에 눌림
      >
        {/* 입력창은 맨 위 (부위가 많아져도 키보드에 안 가려짐) */}
        <View className="mt-[16px] flex-row items-center gap-[8px] rounded-[14px] bg-cardBackground py-[8px] pl-[14px] pr-[8px]">
          <Ionicons name="add" size={18} color={Colors.subText1} />
          <TextInput
            className="flex-1 py-[4px] text-[15px] text-mainText"
            value={newName}
            onChangeText={setNewName}
            placeholder="새 부위 이름"
            placeholderTextColor={Colors.disabledText}
            onSubmitEditing={onAdd}
            returnKeyType="done"
          />
          <Pressable
            onPress={onAdd}
            disabled={!canAdd}
            className={`rounded-[10px] px-[12px] py-[6px] ${canAdd ? 'bg-main' : 'bg-border'}`}
          >
            <Text className={`text-[14px] ${canAdd ? 'font-medium text-textOnMain' : 'text-subText2'}`}>추가</Text>
          </Pressable>
        </View>

        <View className="mb-[8px] mt-[20px] flex-row justify-between px-[4px]">
          <Text className="text-[14px] text-white">부위 {parts.length}개</Text>
          <Text className="text-[12px] text-subText1">
            {editMode ? '끌어서 순서 변경' : '끄면 기록 화면에서 숨겨져요'}
          </Text>
        </View>

        <View className="rounded-[16px] bg-cardBackground px-[16px]">
          <NestableDraggableFlatList
            data={parts}
            onDragEnd={({ data }) => reorderParts(data)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<BodyPart>) => {
              const isLast = (getIndex?.() ?? 0) === parts.length - 1;
              return (
                <ScaleDecorator>
                  <View
                    className={`min-h-[52px] flex-row items-center gap-[12px] bg-cardBackground ${isLast ? '' : 'border-b border-border'
                      } ${isActive ? 'opacity-70' : ''}`}
                  >
                    {editMode ? (
                      <TouchableOpacity onPress={() => requestDeletePart(item.id)} hitSlop={8}>
                        <Ionicons name="remove-circle" size={22} color={Colors.danger} />
                      </TouchableOpacity>
                    ) : null}

                    <Text className={`flex-1 text-[15px] ${item.isActive ? 'text-mainText' : 'text-subText2'}`}>
                      {item.name}
                    </Text>

                    {editMode ? (
                      <TouchableOpacity
                        onPressIn={drag}
                        disabled={isActive}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="reorder-three" size={22} color={Colors.subText1} />
                      </TouchableOpacity>
                    ) : (
                      <Switch
                        value={item.isActive}
                        style={{ alignSelf: 'center' }} // iOS Switch 기본값 alignSelf: flex-start 덮어쓰기
                        onValueChange={(v) => setPartActive(item.id, v)}
                        trackColor={{ false: Colors.border, true: Colors.main }}
                        thumbColor={Colors.mainText}
                      />
                    )}
                  </View>
                </ScaleDecorator>
              );
            }}
          />
        </View>
      </NestableScrollContainer>

      <AlertModal
        visible={duplicateAlertVisible}
        title="이미 있는 부위예요"
        contents="다른 이름을 입력해 주세요"
        okLabel="확인"
        onOk={() => setDuplicateAlertVisible(false)}
      />
      <AlertModal
        visible={!!deleteTargetId}
        title="부위 삭제"
        contents="목록에서 사라지고 지난 기록은 그대로 남아요. 같은 이름으로 다시 추가하면 되살릴 수 있어요."
        okLabel="삭제"
        cancelLabel="취소"
        danger
        onOk={confirmDeletePart}
        onCancel={cancelDeletePart}
      />
    </View>
  );
}
