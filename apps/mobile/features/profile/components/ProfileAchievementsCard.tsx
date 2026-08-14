import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AchievementBadge from "../../achievements/components/AchievementBadge";
import type { Achievement, AchievementSummary } from "../../achievements/models/achievement.types";
import { useTheme } from "../../theme/useTheme";

type ProfileAchievementsCardProps = {
  summary: AchievementSummary;
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewAll: () => void;
};

function unlockedTimestamp(achievement: Achievement) {
  if (!achievement.unlockedAt) return 0;
  const timestamp = new Date(achievement.unlockedAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export default function ProfileAchievementsCard({
  summary,
  achievements,
  loading,
  error,
  onRetry,
  onViewAll,
}: ProfileAchievementsCardProps) {
  const { isDark } = useTheme();

  const previewAchievements = useMemo(() => {
    const unlocked = achievements
      .filter((achievement) => achievement.unlocked)
      .sort((a, b) => unlockedTimestamp(b) - unlockedTimestamp(a));
    const locked = achievements
      .filter((achievement) => !achievement.unlocked)
      .sort((a, b) => b.progress.percent - a.progress.percent || a.sortOrder - b.sortOrder);

    const unlockedLimit = locked.length > 0 ? 3 : 4;
    const recentUnlocked = unlocked.slice(0, unlockedLimit);
    return [...recentUnlocked, ...locked.slice(0, 4 - recentUnlocked.length)];
  }, [achievements]);

  return (
    <View className="mt-4 px-5">
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100">Achievements</Text>
          <Text style={{ marginTop: 2, color: isDark ? "#94A3B8" : "#64748B", fontSize: 12, fontWeight: "600" }}>
            {summary.unlocked} of {summary.total} unlocked
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all achievements"
          onPress={onViewAll}
          hitSlop={8}
          style={({ pressed }) => ({
            minHeight: 36,
            flexDirection: "row",
            alignItems: "center",
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "800" }}>View All</Text>
          <Ionicons name="chevron-forward" size={15} color="#DC2626" />
        </Pressable>
      </View>

      {loading && achievements.length === 0 ? (
        <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }} accessibilityLabel="Loading achievements">
          {[0, 1, 2].map((item) => (
            <View
              key={item}
              style={{
                width: 116,
                height: 154,
                borderRadius: 18,
                backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? "#24324A" : "#E5E7EB",
                alignItems: "center",
                padding: 12,
              }}
            >
              <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: isDark ? "#1B2A45" : "#E5E7EB" }} />
              <View style={{ marginTop: 12, width: 82, height: 12, borderRadius: 6, backgroundColor: isDark ? "#1B2A45" : "#E5E7EB" }} />
            </View>
          ))}
        </View>
      ) : error && achievements.length === 0 ? (
        <View
          style={{
            marginTop: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? "#7F1D1D" : "#FCA5A5",
            backgroundColor: isDark ? "#3B1C28" : "#FEF2F2",
            padding: 13,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ flex: 1, color: isDark ? "#FCA5A5" : "#B91C1C", fontSize: 13, fontWeight: "700" }}>
            Unable to load achievements.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => ({ paddingHorizontal: 8, paddingVertical: 5, opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "900" }}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingRight: 20, gap: 10 }}
        >
          {previewAchievements.map((achievement) => (
            <Pressable
              key={achievement.id}
              accessibilityRole="button"
              accessibilityLabel={`${achievement.title} achievement, ${achievement.unlocked ? "unlocked" : achievement.progress.label}`}
              onPress={onViewAll}
              style={({ pressed }) => ({
                width: 120,
                minHeight: 164,
                borderRadius: 18,
                borderWidth: 1,
                paddingHorizontal: 9,
                paddingVertical: 10,
                alignItems: "center",
                backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
                borderColor: achievement.unlocked
                  ? isDark
                    ? "#7F1D1D"
                    : "#FCA5A5"
                  : isDark
                    ? "#24324A"
                    : "#E5E7EB",
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <AchievementBadge
                achievementId={achievement.id}
                unlocked={achievement.unlocked}
                size={76}
              />
              <Text
                numberOfLines={2}
                style={{
                  marginTop: 7,
                  minHeight: 34,
                  textAlign: "center",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  fontSize: 12,
                  lineHeight: 16,
                  fontWeight: "800",
                }}
              >
                {achievement.title}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 3,
                  color: achievement.unlocked ? (isDark ? "#86EFAC" : "#15803D") : isDark ? "#94A3B8" : "#64748B",
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {achievement.unlocked ? "Unlocked" : achievement.progress.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
