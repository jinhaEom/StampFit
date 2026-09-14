import { Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type MyHealthWidgetProps = {
  count: number;
};

const MyHealthWidget = () => {
  'widget';
  return (
    <VStack modifiers={[containerBackground('#FFFFFF', 'widget')]}>
      <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle('#000000')]}>
        Test 위젯
      </Text>
      <Text>This Is TEST Shit</Text>
    </VStack>
  );
};

export default createWidget('MyHealthWidget', MyHealthWidget);