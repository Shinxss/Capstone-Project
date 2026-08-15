import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientScreen from "../../../src/components/GradientScreen";
import { useSession } from "../../auth/hooks/useSession";
import { useResponsiveLayout } from "../../common/hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";
import AchievementCard from "../components/AchievementCard";
import AchievementDetailModal from "../components/AchievementDetailModal";
import AchievementSummaryCard from "../components/AchievementSummaryCard";
import AchievementsSkeleton from "../components/AchievementsSkeleton";
import { useAchievements } from "../hooks/useAchievements";
import type { Achievement, AchievementFilter } from "../models/achievement.types";

const FILTERS: ReadonlyArray<{ id: AchievementFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "unlocked", label: "Unlocked" },
  { id: "locked", label: "Locked" },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { width } = useResponsiveLayout();
  const { isUser, session } = useSession();
  const userRole = session?.mode === "user" ? String(session.user.role ?? "").toUpperCase() : "";
  const isAchievementAccount = isUser && (userRole === "VOLUNTEER" || userRole === "COMMUNITY");
  const achievementsModel = useAchievements({ enabled: isAchievementAccount });
  const [filter, setFilter] = useState<AchievementFilter>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const maxContentWidth = Math.min(width, 600);
  const horizontalPadding = 16;
  const gridGap = 12;
  const cardWidth = Math.floor((maxContentWidth - horizontalPadding * 2 - gridGap) / 2);
  const badgeSize = Math.min(124, Math.max(96, cardWidth * 0.68));

  const filteredAchievements = useMemo(() => {
    if (filter === "unlocked") return achievementsModel.unlockedAchievements;
    if (filter === "locked") return achievementsModel.lockedAchievements;
    return achievementsModel.achievements;
  }, [achievementsModel.achievements, achievementsModel.lockedAchievements, achievementsModel.unlockedAchievements, filter]);

  const unavailable = !isUser
    ? { title: "Sign in required", message: "Sign in to view your verified Lifeline achievements." }
    : !isAchievementAccount
      ? { title: "Achievements unavailable", message: "Achievement milestones are available to Lifeline volunteer and community accounts." }
      : null;

  const header = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        hitSlop={8}
        style={({ pressed }) => ({ minHeight: 42, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", opacity: pressed ? 0.72 : 1 })}
      >
        <Ionicons name="chevron-back" size={21} color={isDark ? "#F8FAFC" : "#0F172A"} />
        <Text style={{ marginLeft: 2, color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 15, fontWeight: "800" }}>Back</Text>
      </Pressable>

      <Text style={{ marginTop: 8, color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 29, lineHeight: 35, fontWeight: "900" }}>Achievements</Text>
      <Text style={{ marginTop: 6, color: isDark ? "#A8B4C8" : "#64748B", fontSize: 14, lineHeight: 20 }}>Your Lifeline milestones and verified contributions</Text>

      {unavailable ? (
        <View style={{ marginTop: 28, borderRadius: 22, borderWidth: 1, borderColor: isDark ? "#24324A" : "#E2E8F0", backgroundColor: isDark ? "#0E1626" : "#FFFFFF", paddingHorizontal: 22, paddingVertical: 30, alignItems: "center" }}>
          <Ionicons name="shield-outline" size={38} color={isDark ? "#94A3B8" : "#64748B"} />
          <Text style={{ marginTop: 12, color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 17, fontWeight: "800" }}>{unavailable.title}</Text>
          <Text style={{ marginTop: 7, textAlign: "center", color: isDark ? "#A8B4C8" : "#64748B", fontSize: 14, lineHeight: 20 }}>{unavailable.message}</Text>
        </View>
      ) : achievementsModel.loading && achievementsModel.achievements.length === 0 ? (
        <View style={{ marginTop: 22 }}><AchievementsSkeleton cardWidth={cardWidth} /></View>
      ) : (
        <>
          <View style={{ marginTop: 22 }}><AchievementSummaryCard summary={achievementsModel.summary} /></View>
          <View style={{ marginTop: 18, marginBottom: 16, flexDirection: "row", gap: 9 }}>
            {FILTERS.map((item) => {
              const selected = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setFilter(item.id)}
                  style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 17, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: selected ? "#DC2626" : isDark ? "#334155" : "#CBD5E1", backgroundColor: selected ? "#DC2626" : isDark ? "#0E1626" : "#FFFFFF", opacity: pressed ? 0.8 : 1 })}
                >
                  <Text style={{ color: selected ? "#FFFFFF" : isDark ? "#CBD5E1" : "#475569", fontSize: 13, fontWeight: "800" }}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {achievementsModel.error ? (
            <View style={{ marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: isDark ? "#7F1D1D" : "#FCA5A5", backgroundColor: isDark ? "#3B1C28" : "#FEF2F2", padding: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ flex: 1, color: isDark ? "#FCA5A5" : "#B91C1C", fontSize: 13, fontWeight: "700" }}>Unable to load achievements.</Text>
              <Pressable accessibilityRole="button" onPress={() => { void achievementsModel.refresh(); }} style={({ pressed }) => ({ paddingHorizontal: 10, paddingVertical: 6, opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "900" }}>Try Again</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </>
  );

  return (
    <GradientScreen gradientHeight={230}>
      <FlatList
        data={isAchievementAccount ? filteredAchievements : []}
        keyExtractor={(achievement) => achievement.id}
        numColumns={2}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: gridGap }}
        ItemSeparatorComponent={() => <View style={{ height: gridGap }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isAchievementAccount && !achievementsModel.loading && !achievementsModel.error
            ? <Text style={{ marginTop: 12, textAlign: "center", color: isDark ? "#94A3B8" : "#64748B", fontSize: 14 }}>No achievements match this filter.</Text>
            : null
        }
        refreshControl={isAchievementAccount ? <RefreshControl refreshing={achievementsModel.loading && achievementsModel.achievements.length > 0} onRefresh={() => { void achievementsModel.refresh(); }} tintColor="#DC2626" colors={["#DC2626"]} /> : undefined}
        contentContainerStyle={{ width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: horizontalPadding, paddingTop: 10, paddingBottom: Math.max(insets.bottom + 24, 32) }}
        renderItem={({ item }) => (
          <AchievementCard achievement={item} width={cardWidth} badgeSize={badgeSize} onPress={() => setSelectedAchievement(item)} />
        )}
      />

      <AchievementDetailModal achievement={selectedAchievement} onClose={() => setSelectedAchievement(null)} />
    </GradientScreen>
  );
}
