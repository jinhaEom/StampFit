import { Colors } from '@/constants/colors';
import { PRIVACY } from '@/constants/legal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 개인정보처리방침 */
export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const legal = PRIVACY;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-[8px] px-[16px] pb-[8px]">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.subText1} />
        </Pressable>
        <Text className="text-[17px] font-medium text-mainText">{legal.title}</Text>
      </View>

      <ScrollView
        contentContainerClassName="px-[20px] pt-[8px] pb-[24px] ios:pb-[74px] android:pb-[104px]"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[13px] text-subText2">시행일: {legal.effectiveDate}</Text>
        {legal.intro ? (
          <Text className="mt-[12px] text-[14px] leading-[22px] text-subText1">{legal.intro}</Text>
        ) : null}

        {legal.sections.map((section) => (
          <View key={section.title} className="mt-[24px]">
            <Text className="text-[15px] font-medium text-mainText">{section.title}</Text>
            {section.body.map((line, i) => (
              <Text key={i} className="mt-[8px] text-[14px] leading-[22px] text-subText1">
                {line}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
