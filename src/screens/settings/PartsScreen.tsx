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
import Swipeable from 'react-native-gesture-handler/Swipeable';
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
          <Text className={`text-[15px] ${editMode ? 'font-medium text-main' : 'text-mainText'}`}>
            {editMode ? '완료' : '편집'}
          </Text>
        </Pressable>
      </View>

      <NestableScrollContainer
        contentContainerClassName="px-[16px] pb-[24px]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // 키보드 떠 있어도 추가 버튼 한 번에 눌림
      >
        <View className="mb-[8px] mt-[16px] flex-row justify-between px-[4px]">
          <Text className="text-[14px] font-medium text-mainText">부위 목록 ({parts.length})</Text>
          <Text className="text-[12px] text-subText1">
            {editMode ? '끌어서 순서 변경' : '밀어서 삭제 · 끄면 기록에서 숨김'}
          </Text>
        </View>

        <View className="overflow-hidden rounded-[16px] bg-cardBackground">
          {/* 새 부위 인라인 입력 행 (편집 모드가 아닐 때 노출) */}
          {!editMode && (
            <View className="min-h-[52px] flex-row items-center gap-[10px] border-b border-border bg-cardBackground px-[16px]">
              <Ionicons name="add-circle" size={20} color={canAdd ? Colors.main : Colors.subText2} />
              <TextInput
                className="flex-1 py-[12px] text-[15px] text-mainText"
                value={newName}
                onChangeText={setNewName}
                placeholder="새 부위 추가..."
                placeholderTextColor={Colors.disabledText}
                onSubmitEditing={onAdd}
                returnKeyType="done"
              />
              {canAdd && (
                <TouchableOpacity
                  onPress={onAdd}
                  activeOpacity={0.7}
                  hitSlop={8}
                  className="rounded-full bg-main p-[4px]"
                >
                  <Ionicons name="arrow-up" size={16} color={Colors.textOnMain} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <NestableDraggableFlatList
            data={parts}
            onDragEnd={({ data }) => reorderParts(data)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<BodyPart>) => {
              const isLast = (getIndex?.() ?? 0) === parts.length - 1;

              const renderRightActions = () => {
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => requestDeletePart(item.id)}
                    className="w-[72px] items-center justify-center bg-danger"
                  >
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                    <Text className="mt-[2px] text-[12px] font-medium text-white">삭제</Text>
                  </TouchableOpacity>
                );
              };

              return (
                <ScaleDecorator>
                  <Swipeable
                    enabled={!editMode} // 편집 모드(드래그)일 때는 제스처 충돌 방지를 위해 스와이프 비활성화
                    renderRightActions={renderRightActions}
                    friction={2}
                    overshootRight={false}
                    rightThreshold={36}
                  >
                    <View
                      className={`min-h-[52px] flex-row items-center gap-[12px] bg-cardBackground px-[16px] ${
                        isLast ? '' : 'border-b border-border'
                      } ${isActive ? 'opacity-70' : ''}`}
                    >
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
                  </Swipeable>
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
