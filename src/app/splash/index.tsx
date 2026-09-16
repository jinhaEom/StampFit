import { Image, Text, View } from "react-native";

export default function SplashScreen() {
  return (
    <View className="flex-1 bg-bg justify-center items-center">
      <Image
        source={require('@/assets/images/stampfit-wordmark.png')}
        style={{ width: 132, height: 36.6 }}
        resizeMode="contain"
      />
      <Text className="text-white font-extrabold text-[16px] mt-[10px]">기록하는 즐거움</Text>
    </View>
  )
}