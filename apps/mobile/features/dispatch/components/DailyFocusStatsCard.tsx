import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import type { DispatchFocusStats } from "../models/dispatchFocusStats";
import { FocusDonut } from "./FocusDonut";

type DailyFocusStatsCardProps = {
  stats: DispatchFocusStats;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatVolunteerHours(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} hour`;
}

export function DailyFocusStatsCard({ stats }: DailyFocusStatsCardProps) {
  const DONUT_SIZE = 142;
  const STAT_BAR_HEIGHT = 7;

  const rows = [
    {
      key: "responded",
      label: "Responded",
      value: `${stats.respondedCount} of ${stats.respondedGoal}`,
      progress: clamp(stats.respondedCount / Math.max(1, stats.respondedGoal), 0, 1),
    },
    {
      key: "volunteer_hours",
      label: "Volunteer Hours",
      value: formatVolunteerHours(stats.volunteerHours),
      progress: clamp(stats.volunteerHours / Math.max(1, stats.volunteerHoursGoal), 0, 1),
    },
    {
      key: "completed",
      label: "Completed",
      value: `${stats.completedCount} of ${stats.completedGoal}`,
      progress: clamp(stats.completedCount / Math.max(1, stats.completedGoal), 0, 1),
    },
  ] as const;

  return (
    <View style={styles.cardWrap}>
      <LinearGradient
        colors={["#860D18", "#A80F1B", "#C01221"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Today's Focus</Text>
          <Ionicons name="ellipsis-vertical" size={18} color="#F6C0C8" />
        </View>

        <View style={styles.contentRow}>
          <View style={[styles.donutWrap, { width: DONUT_SIZE, height: DONUT_SIZE }]}>
            <FocusDonut
              percent={stats.donutPercent}
              size={DONUT_SIZE}
              strokeWidth={11}
              trackColor="rgba(255, 184, 193, 0.62)"
              progressColor="#FFE3E8"
              textColor="#FFFFFF"
              helperTextColor="rgba(255,255,255,0.88)"
            />
          </View>

          <View style={styles.statsCol}>
            {rows.map((row) => (
              <View key={row.key} style={styles.statRow}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>{row.label}</Text>
                  <Text style={styles.statValue}>{row.value}</Text>
                </View>
                <View
                  style={{
                    ...styles.barTrack,
                    height: STAT_BAR_HEIGHT,
                  }}
                >
                  <View
                    style={{
                      ...styles.barFill,
                      width: `${Math.round(row.progress * 100)}%`,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    overflow: "hidden",
    borderRadius: 15,
  },
  card: {
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingTop: 16,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 29,
    fontWeight: "700",
  },
  contentRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 14,
  },
  donutWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  statsCol: {
    flex: 1,
    rowGap: 18,
  },
  statRow: {
    width: "100%",
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 21,
    fontWeight: "400",
  },
  barTrack: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255, 214, 221, 0.84)",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFECEE",
  },
});
