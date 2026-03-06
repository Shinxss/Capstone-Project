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
        label: "Completed Tasks",
        value: formatInteger(summary.stats.completedTasks),
        unit: "tasks",
        icon: "checkmark-circle-outline" as const,
        iconBgLight: "#DCFCE7",
        iconBgDark: "rgba(34,197,94,0.2)",
        iconColorLight: "#15803D",
        iconColorDark: "#4ADE80",
      },
      {
        key: "volunteerHours",
        label: "Volunteer Hours",
        value: formatMetricValue(summary.stats.volunteerHours),
        unit: "hours",
        icon: "time-outline" as const,
        iconBgLight: "#DBEAFE",
        iconBgDark: "rgba(59,130,246,0.22)",
        iconColorLight: "#1D4ED8",
        iconColorDark: "#60A5FA",
      },
      {
        key: "avgResponseTimeMinutes",
        label: "Avg Response Time",
        value:
          summary.stats.avgResponseTimeMinutes === null
            ? "—"
            : formatMetricValue(summary.stats.avgResponseTimeMinutes),
        unit: summary.stats.avgResponseTimeMinutes === null ? "" : "min",
        icon: "flash-outline" as const,
        iconBgLight: "#FEF3C7",
        iconBgDark: "rgba(245,158,11,0.2)",
        iconColorLight: "#B45309",
        iconColorDark: "#FBBF24",
      },
      {
        key: "verifiedTasks",
        label: "Verified Tasks",
        value: formatInteger(summary.stats.verifiedTasks),
        unit: "tasks",
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
    <View className="mt-4">
      <View
        style={{
          borderRadius: 0,
          borderWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#162544" : "#E5E7EB",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 14,
          backgroundColor: "#FFFFFF",
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
            <Text className="text-[16px] font-extrabold text-slate-900 dark:text-slate-100">
              Volunteer Activities
            </Text>
            <Text className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              This section is available for verified volunteers.
            </Text>
            <Pressable
              onPress={onPressApplyVolunteer}
              style={({ pressed }) => ({
                marginTop: 12,
                minHeight: 40,
                borderRadius: 10,
                borderWidth: 1,
                paddingHorizontal: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#1E3A8A" : "#DC2626",
                borderColor: isDark ? "#3B82F6" : "#DC2626",
                opacity: pressed ? 0.9 : 1,
                alignSelf: "flex-start",
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
                    minHeight: 96,
                    borderRadius: 12,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
                    borderColor: isDark ? "#162544" : "#E5E7EB",
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
                        fontSize: 12,
                        fontWeight: "600",
                        lineHeight: 15,
                      }}
                    >
                      {card.label}
                    </Text>
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDark ? card.iconBgDark : card.iconBgLight,
                      }}
                    >
                      <Ionicons
                        name={card.icon}
                        size={20}
                        color={isDark ? card.iconColorDark : card.iconColorLight}
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 10, flexDirection: "row", alignItems: "flex-end" }}>
                    <Text className="text-[34px] leading-[36px] font-extrabold text-slate-900 dark:text-slate-100">
                      {card.value}
                    </Text>
                    {card.unit ? (
                      <Text
                        style={{
                          marginLeft: 4,
                          marginBottom: 4,
                          color: isDark ? "#94A3B8" : "#6B7280",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {card.unit}
                      </Text>
                    ) : null}
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
