import { View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonRegion, SkeletonText } from "../../../components/ui/Skeleton";

function DispatchCardSkeleton() {
  return (
    <SkeletonCard style={{ gap: 11 }}>
      <Skeleton width={96} height={12} />
      <Skeleton width="60%" height={22} />
      <Skeleton width="42%" height={14} />
      <SkeletonText widths={["100%", "82%"]} />
      <View style={{ flexDirection: "row", gap: 12 }}><Skeleton width="48%" height={44} radius={12} /><Skeleton width="48%" height={44} radius={12} /></View>
    </SkeletonCard>
  );
}

export function DispatchSkeleton() {
  return (
    <SkeletonRegion label="Loading dispatch tasks" style={{ gap: 12 }}>
      <DispatchCardSkeleton />
      <DispatchCardSkeleton />
    </SkeletonRegion>
  );
}
