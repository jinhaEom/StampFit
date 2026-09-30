import { Colors } from '@/constants/colors';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// 네이티브 스플래시(app.json: splash-mark.png를 imageWidth만큼, 배경 #0E0F11)와 같은 자리·크기로 점을 그린다
export const SPLASH_IMAGE_WIDTH = 110; // app.json의 imageWidth와 같게
const S = SPLASH_IMAGE_WIDTH / 512; // 원본 이미지는 512px
const CENTERS = [128, 256, 384];
const DOT = 102 * S; // 바깥 점 지름
const CENTER_DOT = 120 * S; // 가운데 점 지름
const FAINT = 'rgba(79, 209, 179, 0.3)';
const SPLASH_BG = '#0E0F11';

/** 바깥 점이 찍히는 순서 (모서리 → 변). 왼쪽 위부터 0~8 */
const ORDER = [0, 2, 6, 8, 1, 3, 5, 7];
// 전체 약 1초 = 점 8개 × STEP_MS(480) + PAUSE_MS(170) + EXIT_MS(350)
const STEP_MS = 110; // 점 하나씩 찍히는 간격
const PAUSE_MS = 250; // 다 찍고 잠깐 멈춤
const EXIT_MS = 250; // 로고가 커지며 사라지는 시간

/**
 * 앱을 켤 때 한 번 — 스플래시 로고의 점이 도장 찍히듯 하나씩 채워진 뒤,
 * 로고는 커지며 사라지고 첫 화면은 살짝 줌인되며 자리를 잡는다. ready(로그인 상태 확인 끝) 후 약 1초.
 */
export function LaunchStamp({ ready, children }: { ready: boolean; children: ReactNode }) {
  const [filled, setFilled] = useState(0);
  const [visible, setVisible] = useState(true);
  const markScale = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1.04);

  useEffect(() => {
    if (!ready) return;
    const timers = ORDER.map((_, i) => setTimeout(() => setFilled(i + 1), STEP_MS * (i + 1)));
    const exitAt = STEP_MS * ORDER.length + PAUSE_MS;
    timers.push(
      setTimeout(() => {
        markScale.value = withTiming(3, { duration: EXIT_MS, easing: Easing.in(Easing.quad) });
        overlayOpacity.value = withTiming(0, { duration: EXIT_MS });
        contentScale.value = withTiming(1, { duration: EXIT_MS, easing: Easing.out(Easing.quad) });
      }, exitAt),
    );
    timers.push(setTimeout(() => setVisible(false), exitAt + EXIT_MS));
    return () => timers.forEach(clearTimeout);
  }, [ready, markScale, overlayOpacity, contentScale]);

  const contentStyle = useAnimatedStyle(() => ({ transform: [{ scale: contentScale.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: markScale.value }] }));

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[{ flex: 1 }, contentStyle]}>{children}</Animated.View>

      {visible && (
        <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
          <Animated.View style={[{ width: SPLASH_IMAGE_WIDTH, height: SPLASH_IMAGE_WIDTH }, markStyle]}>
            {Array.from({ length: 9 }, (_, i) => (
              <StampDot key={i} index={i} on={i === 4 || ORDER.slice(0, filled).includes(i)} />
            ))}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

/** 점 하나 — 찍히는 순간 민트로 바뀌며 톡 커졌다가 탄력 있게 제자리로 */
function StampDot({ index, on }: { index: number; on: boolean }) {
  const isCenter = index === 4;
  const d = isCenter ? CENTER_DOT : DOT;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!on || isCenter) return;
    scale.value = withSequence(
      withTiming(1.35, { duration: 60 }),
      withSpring(1, { damping: 7, stiffness: 420 }),
    );
  }, [on, isCenter, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: CENTERS[index % 3] * S - d / 2,
          top: CENTERS[Math.floor(index / 3)] * S - d / 2,
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: on ? Colors.mainColor : FAINT,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BG,
  },
});
