import type { PartStat } from '@/lib/analytics';
import { Text, View } from 'react-native';

interface Props {
  partStats: PartStat[];
}

export function PartBalanceCard({ partStats }: Props) {
  const topParts = partStats.slice(0, 2);

  return (
    <View className="flex-1 rounded-[16px] bg-card p-[14px]">
      <Text className="text-[12px] text-sub">부위 밸런스</Text>

      {partStats.length === 0 ? (
        <Text className="mt-[10px] text-[13px] text-dim">기록 없음</Text>
      ) : (
        <>
          <View className="mt-[10px] h-[6px] w-full flex-row overflow-hidden rounded-full bg-line">
            {partStats.map((part) => (
              <View
                key={part.id}
                style={{ width: `${part.percentage}%`, backgroundColor: part.color }}
              />
            ))}
          </View>

          <View className="mt-[8px] gap-[4px]">
            {topParts.map((part) => (
              <View key={part.id} className="flex-row items-center gap-[6px]">
                <View
                  className="h-[6px] w-[6px] rounded-full"
                  style={{ backgroundColor: part.color }}
                />
                <Text className="flex-1 text-[12px] text-fg" numberOfLines={1}>
                  {part.name} · {part.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
