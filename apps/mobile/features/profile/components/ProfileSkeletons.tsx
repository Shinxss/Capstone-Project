import { View } from "react-native";
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonRegion,
  SkeletonText,
} from "../../../components/ui/Skeleton";

export function ProfileEditSkeleton() {
  return (
    <SkeletonRegion label="Loading profile" style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18, gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <SkeletonAvatar size={74} />
        <View style={{ minWidth: 0, flex: 1, gap: 9 }}><Skeleton width="68%" height={20} /><Skeleton width="46%" height={13} /><Skeleton width="34%" height={22} radius={11} /></View>
      </View>
      {Array.from({ length: 3 }, (_, sectionIndex) => (
        <SkeletonCard key={sectionIndex} style={{ gap: 14 }}>
          <Skeleton width="42%" height={17} />
          {Array.from({ length: sectionIndex === 0 ? 4 : 3 }, (_, rowIndex) => (
            <View key={rowIndex} style={{ gap: 7 }}><Skeleton width="28%" height={11} /><Skeleton width="100%" height={46} radius={12} /></View>
          ))}
        </SkeletonCard>
      ))}
    </SkeletonRegion>
  );
}

export function ProfileSkillsSkeleton() {
  return (
    <SkeletonRegion label="Loading profile skills" style={{ padding: 20, gap: 16 }}>
      <SkeletonCard style={{ gap: 14 }}>
        <Skeleton width="44%" height={18} />
        <SkeletonText widths={["92%", "72%"]} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[88, 112, 96, 124, 104, 90, 118, 82].map((width, index) => <Skeleton key={index} width={width} height={42} radius={12} />)}
        </View>
      </SkeletonCard>
      <SkeletonCard style={{ gap: 12 }}><Skeleton width="38%" height={16} /><Skeleton width="100%" height={48} radius={12} /></SkeletonCard>
    </SkeletonRegion>
  );
}

export function ProfileRemoteSectionsSkeleton() {
  return (
    <SkeletonRegion label="Loading profile details" style={{ marginTop: 14, gap: 14, paddingHorizontal: 16 }}>
      <SkeletonCard style={{ minHeight: 148, gap: 14 }}>
        <Skeleton width="42%" height={17} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          {Array.from({ length: 3 }, (_, index) => <View key={index} style={{ flex: 1, gap: 8 }}><Skeleton width="100%" height={54} radius={12} /><Skeleton width="72%" height={11} /></View>)}
        </View>
      </SkeletonCard>
      <SkeletonCard style={{ minHeight: 220, gap: 14 }}>
        <Skeleton width="48%" height={17} />
        {Array.from({ length: 4 }, (_, index) => <View key={index} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><Skeleton width={38} height={38} radius={12} /><View style={{ flex: 1, gap: 7 }}><Skeleton width="34%" height={11} /><Skeleton width="74%" height={14} /></View></View>)}
      </SkeletonCard>
    </SkeletonRegion>
  );
}
