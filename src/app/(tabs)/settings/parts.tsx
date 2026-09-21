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
import { useSettings } from './hooks/useSettings';

export default function PartsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    parts,
    addPart,
    setPartActive,
    setParts,
    newName,
    setNewName,
    duplicateAlertVisible,
    setDuplicateAlertVisible,
    deleteTargetId,
    requestDeletePart,
    cancelDeletePart,
    confirmDeletePart,
  } = useSettings();

  const [editMode, setEditMode] = useState(false);

  const onAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (!addPart(name)) setDuplicateAlertVisible(true);
    else setNewName('');
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
      <View className="flex-row items-center justify-between px-[16px] pb-[8px]">
        <View className="flex-row items-center gap-[8px]">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Colors.gray2Color} />
          </Pressable>
          <Text className="text-[17px] font-medium text-fg">부위 관리</Text>
        </View>
        <TouchableOpacity onPress={() => setEditMode((v) => !v)} hitSlop={8} className="p-[4px]">
          <Ionicons name={editMode ? 'checkmark' : 'pencil'} size={16} color={Colors.gray2Color} />
        </TouchableOpacity>
      </View>

      <NestableScrollContainer
        contentContainerClassName="px-[16px] pb-[24px]"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-[16px] rounded-[16px] bg-card p-[16px]">
          <NestableDraggableFlatList
            data={parts}
            onDragEnd={({ data }) => setParts(data)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<BodyPart>) => {
              const index = getIndex?.() ?? 0;
              return (
                <ScaleDecorator>
                  <View
                    className={`flex-row items-center gap-[10px] py-[6px] ${index > 0 ? 'mt-[4px]' : ''
                      } ${isActive ? 'opacity-70' : ''}`}
                  >
                    <TouchableOpacity
                      onPressIn={drag}
                      disabled={isActive}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="p-[4px]"
                    >
                      <Ionicons name="reorder-two" size={20} color={Colors.gray2Color} />
                    </TouchableOpacity>

                    <Text className={`flex-1 text-[15px] ${item.isActive ? 'text-fg' : 'text-dim line-through'}`}>
                      {item.name}
                    </Text>

                    {editMode ? (
                      <TouchableOpacity onPress={() => requestDeletePart(item.id)} hitSlop={8}>
                        <View className=" rounded-lg bg-red-600 py-[6px] px-[10px]">
                          <Text className="text-[12px] font-bold text-white">삭제</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <Switch
                        value={item.isActive}
                        onValueChange={(v) => setPartActive(item.id, v)}
                        trackColor={{ false: Colors.gray1Color, true: Colors.mainColor }}
                        thumbColor={Colors.whiteColor}
                      />
                    )}
                  </View>
                </ScaleDecorator>
              );
            }}
          />
          <View className="mt-[12px] flex-row items-center gap-[10px]">
            <TextInput
              className="flex-1 rounded-[8px] bg-bg px-[10px] py-[8px] text-[15px] text-fg"
              value={newName}
              onChangeText={setNewName}
              placeholder="새 부위 추가"
              placeholderTextColor={Colors.disabledColor}
              onSubmitEditing={onAdd}
              returnKeyType="done"
            />
            <Pressable onPress={onAdd} hitSlop={8}>
              <Text className="text-[15px] font-medium text-fg">추가</Text>
            </Pressable>
          </View>
          <Text className="mt-[12px] text-[12px] text-dim">
            끄면 기록 화면에서 숨겨져요. 과거 기록은 유지돼요.
          </Text>
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
