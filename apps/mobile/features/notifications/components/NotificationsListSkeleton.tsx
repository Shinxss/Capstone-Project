import { View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonRegion } from "../../../components/ui/Skeleton";

export function NotificationsListSkeleton() {
  return (
    <SkeletonRegion label="Loading notifications" style={{ marginTop: 8, paddingHorizontal: 16, gap: 10 }}>
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonCard key={index} style={{ height: 78, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }}>
          <Skeleton width={32} height={32} radius={16} />
          <View style={{ minWidth: 0, flex: 1, marginLeft: 10, gap: 8 }}>
            <Skeleton width="72%" height={14} />
            <Skeleton width="48%" height={12} />
          </View>
        </SkeletonCard>
      ))}
    </SkeletonRegion>
  );
}
