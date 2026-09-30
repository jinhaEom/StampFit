import { useAdsStore } from '@/store/useAdsStore';
import { Platform, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// TODO: AdMob 실제 광고 단위 ID로 교체
const PROD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  default: TestIds.BANNER,
});

const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : PROD_UNIT_ID;

/** 하단 배너 광고 (광고 제거 안 산 사용자만) */
export function AdBanner() {
  const adsRemoved = useAdsStore((s) => s.adsRemoved);
  if (adsRemoved) return null;

  return (
    <View className="items-center bg-bg">
      <BannerAd unitId={BANNER_UNIT_ID} size={BannerAdSize.BANNER} />
    </View>
  );
}
