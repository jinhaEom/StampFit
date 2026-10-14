import { type ReactNode, useEffect } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

const OPEN = { duration: 260, easing: Easing.out(Easing.cubic) };
const CLOSE_DISTANCE = 100;
const CLOSE_VELOCITY = 800;

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, title, description, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Sheet onClose={onClose} title={title} description={description}>
          {children}
        </Sheet>
      </GestureHandlerRootView>
    </Modal>
  );
}

function Sheet({ onClose, title, description, children }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(height);

  useEffect(() => {
    translateY.set(withTiming(0, OPEN));
  }, [translateY]);

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      translateY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > CLOSE_VELOCITY) scheduleOnRN(onClose);
      else translateY.set(withTiming(0, OPEN));
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));

  return (
    <View className="flex-1 justify-end">
      <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
      <Animated.View style={sheetStyle}>
        <View className="rounded-t-[24px] bg-cardBackground px-[20px]" style={{ paddingBottom: insets.bottom + 12 }}>
          <GestureDetector gesture={drag}>
            <View className="pb-[20px] pt-[10px]">
              <View className="mb-[18px] h-[4px] w-[36px] self-center rounded-full bg-cardSelected" />
              <Text className="text-[21px] font-bold text-mainText">{title}</Text>
              {description && <Text className="mt-[6px] text-[14px] text-subText1">{description}</Text>}
            </View>
          </GestureDetector>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}
