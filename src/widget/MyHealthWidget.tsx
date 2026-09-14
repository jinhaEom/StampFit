import { HStack, Image, RoundedRectangle, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  minimumScaleFactor,
  opacity,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type MyHealthWidgetProps = {
  streak: number;
  doneToday: boolean;
  todayLabel?: string;
  nextLabel?: string;
  /** 이번 주 월~일 히트맵 단계 (0 = 기록 없음) */
  weekLevels: number[];
  /** 0 = 월 … 6 = 일 */
  todayIndex: number;
};

// 'widget' 함수는 별도 런타임에서 실행되므로 상수·헬퍼를 전부 함수 안에 둬야 함
const MyHealthWidget = (props: MyHealthWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const ACCENT = '#C8F04A';
  const FG = '#ECECEC';
  const SUB = '#8A8C91';
  const CELL = '#26282C';
  const BG = '#0E0F11';
  const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
  const LEVEL_OPACITY = [1, 0.25, 0.45, 0.75, 1];

  const streak = props.streak ?? 0;
  const weekLevels = props.weekLevels ?? [0, 0, 0, 0, 0, 0, 0];
  const todayIndex = props.todayIndex ?? -1;
  const title = props.todayLabel ?? '미등록';

  const status = !props.todayLabel ? 'empty' : props.doneToday ? 'done' : 'todo';
  const cycleView = (
    {
      empty: {
        caption: '운동 사이클',
        icon: 'arrow.triangle.2.circlepath',
        iconColor: SUB,
        titleColor: SUB,
        detail: '앱에서 사이클을 등록해보세요',
      },
      done: {
        caption: '다음 차례',
        icon: 'checkmark.circle.fill',
        iconColor: ACCENT,
        titleColor: FG,
        detail: '오늘 운동 완료',
      },
      todo: {
        caption: '오늘 할 운동',
        icon: 'figure.strengthtraining.traditional',
        iconColor: SUB,
        titleColor: ACCENT,
        detail: props.nextLabel ? `다음 차례: ${props.nextLabel}` : `${title} 반복 중`,
      },
    } as const
  )[status];

  if (environment.widgetFamily === 'systemSmall') {
    return (
      <HStack spacing={0} modifiers={[containerBackground(BG, 'widget')]}>
        <VStack alignment="leading" spacing={0}>
          <HStack spacing={4}>
            <Image systemName="flame.fill" size={12} color={ACCENT} />
            <Text modifiers={[font({ size: 12 }), foregroundStyle(SUB)]}>연속 기록</Text>
          </HStack>
          <HStack alignment="lastTextBaseline" spacing={2}>
            <Text
              modifiers={[font({ size: 42, weight: 'semibold', design: 'rounded' }), foregroundStyle(FG)]}
            >
              {`${streak}`}
            </Text>
            <Text modifiers={[font({ size: 15, weight: 'medium' }), foregroundStyle(SUB)]}>일</Text>
          </HStack>
          <Spacer minLength={0} />
          <HStack spacing={4}>
            <Image systemName={cycleView.icon} size={11} color={cycleView.iconColor} />
            <Text modifiers={[font({ size: 11 }), foregroundStyle(SUB)]}>{cycleView.caption}</Text>
          </HStack>
          <Text
            modifiers={[
              font({ size: status === 'empty' ? 15 : 19, weight: 'semibold' }),
              foregroundStyle(cycleView.titleColor),
              minimumScaleFactor(0.6),
            ]}
          >
            {title}
          </Text>
        </VStack>
        <Spacer minLength={0} />
      </HStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={0} modifiers={[containerBackground(BG, 'widget')]}>
      <HStack alignment="top" spacing={20}>
        <VStack alignment="leading" spacing={2}>
          <HStack spacing={4}>
            <Image systemName="flame.fill" size={12} color={ACCENT} />
            <Text modifiers={[font({ size: 12 }), foregroundStyle(SUB)]}>연속 기록</Text>
          </HStack>
          <HStack alignment="lastTextBaseline" spacing={2}>
            <Text
              modifiers={[font({ size: 34, weight: 'semibold', design: 'rounded' }), foregroundStyle(FG)]}
            >
              {`${streak}`}
            </Text>
            <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(SUB)]}>일</Text>
          </HStack>
        </VStack>
        <VStack alignment="leading" spacing={2}>
          <HStack spacing={4}>
            <Image systemName={cycleView.icon} size={12} color={cycleView.iconColor} />
            <Text modifiers={[font({ size: 12 }), foregroundStyle(SUB)]}>{cycleView.caption}</Text>
          </HStack>
          <Text
            modifiers={[
              font({ size: 22, weight: 'semibold' }),
              foregroundStyle(cycleView.titleColor),
              minimumScaleFactor(0.6),
            ]}
          >
            {title}
          </Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(SUB), minimumScaleFactor(0.7)]}>
            {cycleView.detail}
          </Text>
        </VStack>
        <Spacer minLength={0} />
      </HStack>
      <Spacer minLength={8} />
      <HStack spacing={6}>
        {weekLevels.map((level, i) => (
          <VStack key={WEEKDAYS[i]} spacing={3}>
            <RoundedRectangle
              cornerRadius={4}
              modifiers={[
                frame({ height: 16 }),
                foregroundStyle(level > 0 ? ACCENT : CELL),
                opacity(LEVEL_OPACITY[Math.min(level, LEVEL_OPACITY.length - 1)]),
              ]}
            />
            <Text
              modifiers={[
                font({ size: 10, weight: i === todayIndex ? 'semibold' : 'regular' }),
                foregroundStyle(i === todayIndex ? FG : SUB),
              ]}
            >
              {WEEKDAYS[i]}
            </Text>
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
};

export default createWidget('MyHealthWidget', MyHealthWidget);
