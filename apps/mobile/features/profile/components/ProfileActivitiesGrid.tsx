import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import type { ProfileSummary } from "../models/profile";

type ProfileActivitiesGridProps = {
  summary: ProfileSummary;
  onPressApplyVolunteer: () => void;
};

function formatInteger(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return Math.round(safeValue).toLocaleString("en-US");
}

function formatMetricValue(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const rounded = Number.isInteger(safeValue) ? safeValue : Math.round(safeValue * 10) / 10;
  return String(rounded);
}

export default function ProfileActivitiesGrid({
  summary,
  onPressApplyVolunteer,
}: ProfileActivitiesGridProps) {
  const { isDark } = useTheme();
  const normalizedRole = String(summary.role ?? "").trim().toUpperCase();
  const isCommunityUser = normalizedRole === "COMMUNITY";

  const cards = useMemo(
    () => [
      {
        key: "completedTasks",
        label: "Completed\nTasks",
        value: formatInteger(summary.stats.completedTasks),
        unit: "",
        subtitle: "tasks completed",
        icon: "checkmark-circle-outline" as const,
        iconBgLight: "#DCFCE7",
        iconBgDark: "rgba(34,197,94,0.2)",
        iconColorLight: "#15803D",
        iconColorDark: "#4ADE80",
      },
      {
        key: "volunteerHours",
        label: "Service\nHours",
        value: formatMetricValue(summary.stats.volunteerHours),
        unit: "h",
        subtitle: "hours served",
        icon: "time-outline" as const,
        iconBgLight: "#DBEAFE",
        iconBgDark: "rgba(59,130,246,0.22)",
        iconColorLight: "#1D4ED8",
        iconColorDark: "#60A5FA",
      },
      {
        key: "avgResponseTimeMinutes",
        label: "Avg Response\nTime",
        value:
          summary.stats.avgResponseTimeMinutes === null
            ? "—"
            : formatMetricValue(summary.stats.avgResponseTimeMinutes),
        unit: summary.stats.avgResponseTimeMinutes === null ? "" : "m",
        subtitle: "average response",
        icon: "flash-outline" as const,
        iconBgLight: "#FEF3C7",
        iconBgDark: "rgba(245,158,11,0.2)",
        iconColorLight: "#B45309",
        iconColorDark: "#FBBF24",
      },
      {
        key: "verifiedTasks",
        label: "Verified\nTasks",
        value: formatInteger(summary.stats.verifiedTasks),
        unit: "",
        subtitle: "verified tasks",
        icon: "shield-checkmark-outline" as const,
        iconBgLight: "#FEE2E2",
        iconBgDark: "rgba(239,68,68,0.2)",
        iconColorLight: "#B91C1C",
        iconColorDark: "#F87171",
      },
    ],
    [summary.stats]
  );

  return (
    <View style={{ marginTop: 7 }}>
      <View
        style={{
          borderRadius: 0,
          borderWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#162544" : "#E5E7EB",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 14,
          backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
        }}
      >
        {isCommunityUser ? (
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 14,
              backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
              borderColor: isDark ? "#162544" : "#E5E7EB",
            }}
          >
            <Text className="mb-3 text-[16px] font-extrabold text-slate-900 dark:text-slate-100">
              Volunteer Activities
            </Text>
            <Text className="text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              This section is available for verified volunteers.
            </Text>
            <Pressable
              onPress={onPressApplyVolunteer}
              style={({ pressed }) => ({
                marginTop: 12,
                width: "100%",
                minHeight: 40,
                borderRadius: 10,
                borderWidth: 1,
                paddingHorizontal: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#1E3A8A" : "#DC2626",
                borderColor: isDark ? "#3B82F6" : "#DC2626",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text className="text-sm font-semibold text-white">Apply as Volunteer</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100">My Activities</Text>

            <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
              {cards.map((card) => (
                <View
                  key={card.key}
                  style={{
                    width: "48.5%",
                    aspectRatio: 1.09,
                    borderRadius: 12,
                    borderWidth: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 20,
                    backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
                    borderColor: isDark ? "#162544" : "#E5E7EB",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        paddingRight: 8,
                        color: isDark ? "#CBD5E1" : "#64748B",
                        fontSize: 13,
                        fontWeight: "600",
                        lineHeight: 17,
                      }}
                      numberOfLines={2}
                    >
                      {card.label}
                    </Text>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDark ? card.iconBgDark : card.iconBgLight,
                      }}
                    >
                      <Ionicons
                        name={card.icon}
                        size={26}
                        color={isDark ? card.iconColorDark : card.iconColorLight}
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                      <Text className="text-[38px] leading-[40px] font-semibold text-slate-900 dark:text-slate-100">
                        {card.value}
                      </Text>
                      {card.unit ? (
                        <Text
                          style={{
                            marginLeft: 4,
                            marginBottom: 5,
                            color: isDark ? "#94A3B8" : "#6B7280",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {card.unit}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={{
                        marginTop: 3,
                        color: isDark ? "#64748B" : "#94A3B8",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {card.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
