import { View } from "react-native";
import {
  Skeleton,
  SkeletonCard,
  SkeletonListItem,
  SkeletonRegion,
  SkeletonText,
} from "../../../components/ui/Skeleton";

export function RequestsListSkeleton({ label = "Loading requests", count = 4 }: { label?: string; count?: number }) {
  return (
    <SkeletonRegion label={label} style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, index) => <SkeletonListItem key={index} />)}
    </SkeletonRegion>
  );
}

export function RequestReviewSkeleton() {
  return (
    <SkeletonRegion label="Loading review details" style={{ gap: 14 }}>
      <SkeletonCard style={{ minHeight: 132, gap: 12 }}>
        <Skeleton width="48%" height={18} />
        <SkeletonText widths={["86%", "62%", "74%"]} />
      </SkeletonCard>
      <SkeletonCard style={{ minHeight: 250, gap: 16 }}>
        <Skeleton width="38%" height={18} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} width={38} height={38} radius={19} />)}
        </View>
        <Skeleton width="100%" height={108} radius={12} />
        <Skeleton width="100%" height={48} radius={12} />
      </SkeletonCard>
    </SkeletonRegion>
  );
}

export function ActiveRequestCardSkeleton() {
  return (
    <SkeletonRegion label="Loading active emergency request" style={{ marginTop: 14 }}>
      <SkeletonCard style={{ minHeight: 132, gap: 11 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Skeleton width={42} height={42} radius={12} />
          <View style={{ minWidth: 0, flex: 1, gap: 8 }}><Skeleton width="62%" height={15} /><Skeleton width="42%" height={12} /></View>
          <Skeleton width={72} height={24} radius={12} />
        </View>
        <SkeletonText widths={["100%", "76%"]} lineHeight={12} />
      </SkeletonCard>
    </SkeletonRegion>
  );
}
