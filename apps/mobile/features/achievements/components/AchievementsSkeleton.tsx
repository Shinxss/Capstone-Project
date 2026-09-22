import React from "react";
import { View } from "react-native";
import { Skeleton, SkeletonAvatar, SkeletonCard, SkeletonRegion } from "../../../components/ui/Skeleton";

type AchievementsSkeletonProps = {
  cardWidth: number;
};

export default function AchievementsSkeleton({ cardWidth }: AchievementsSkeletonProps) {
  return (
    <SkeletonRegion label="Loading achievements">
      <SkeletonCard style={{ height: 220, borderRadius: 24, padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <SkeletonAvatar size={112} />
          <View style={{ minWidth: 0, flex: 1, marginLeft: 16, gap: 10 }}>
            <Skeleton width={92} height={11} />
            <Skeleton width="75%" height={29} radius={10} />
            <Skeleton width="90%" height={16} />
            <Skeleton width={72} height={17} />
          </View>
        </View>
        <Skeleton style={{ marginTop: 18 }} height={10} radius={5} />
      </SkeletonCard>
      <Skeleton style={{ marginTop: 18 }} width={130} height={17} />
      <View style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
        {[0, 1, 2].map((item) => (
          <SkeletonCard key={item} style={{ minWidth: 0, flex: 1, height: 166, borderRadius: 18, alignItems: "center", paddingTop: 13 }}>
            <SkeletonAvatar size={66} />
            <Skeleton style={{ marginTop: 9 }} width="62%" height={12} />
          </SkeletonCard>
        ))}
      </View>
      <SkeletonCard style={{ marginTop: 14, height: 66, borderRadius: 18 }} />
      <View style={{ marginTop: 14, flexDirection: "row", gap: 8 }}>
        {[0, 1, 2].map((item) => <Skeleton key={item} style={{ flex: 1 }} width={undefined} height={42} radius={21} />)}
      </View>
      <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <SkeletonCard key={item} style={{ width: cardWidth, height: 164, borderRadius: 18, alignItems: "center", padding: 9 }}>
            <SkeletonAvatar size={72} />
            <Skeleton style={{ marginTop: 8 }} width="86%" height={14} />
            <Skeleton style={{ marginTop: 6 }} width="62%" height={10} />
          </SkeletonCard>
        ))}
      </View>
    </SkeletonRegion>
  );
}
