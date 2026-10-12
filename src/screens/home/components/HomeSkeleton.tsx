import { Skeleton } from '@/components/Skeleton';
import { View } from 'react-native';

/** 로그인 직후 서버 기록 받는 동안 홈 자리 표시 (실제 카드와 같은 배치) */
export function HomeSkeleton() {
  return (
    <View>
      {/* 연속 달성 */}
      <View className="mt-[12px] gap-[12px] px-[4px]">
        <Skeleton width="55%" height={30} />
        <Skeleton width="100%" height={8} radius={4} />
      </View>

      {/* 이번 주 */}
      <View className="mt-[20px] rounded-[20px] bg-cardBackground p-[16px]">
        <View className="flex-row justify-between">
          <Skeleton width={48} height={14} />
          <Skeleton width={72} height={14} />
        </View>
        <View className="mt-[16px] flex-row justify-between">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} width={36} height={36} radius={18} />
          ))}
        </View>
      </View>

      {/* 운동 싸이클 */}
      <View className="mt-[12px] flex-row items-center gap-[12px] rounded-[20px] bg-cardBackground p-[16px]">
        <Skeleton width={44} height={44} radius={22} />
        <View className="flex-1 gap-[8px]">
          <Skeleton width="45%" height={15} />
          <Skeleton width="70%" height={12} />
        </View>
      </View>
    </View>
  );
}
