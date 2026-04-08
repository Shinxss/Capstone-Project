import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

function SkeletonRow({ dark }: { dark: boolean }) {
  return (
    <View style={[styles.row, dark ? styles.rowDark : null]}>
      <View style={[styles.circle, dark ? styles.blockDark : styles.blockLight]} />
      <View style={styles.content}>
        <View style={[styles.lineLg, dark ? styles.blockDark : styles.blockLight]} />
        <View style={[styles.lineSm, dark ? styles.blockDark : styles.blockLight]} />
      </View>
    </View>
  );
}

export function NotificationsListSkeleton() {
  const { isDark } = useTheme();
  return (
    <View style={styles.wrap}>
      <SkeletonRow dark={isDark} />
      <SkeletonRow dark={isDark} />
      <SkeletonRow dark={isDark} />
      <SkeletonRow dark={isDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingHorizontal: 16,
    gap: 10,
  },
  row: {
    height: 78,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowDark: {
    borderColor: "#1E293B",
    backgroundColor: "#0B1220",
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  lineLg: {
    height: 14,
    borderRadius: 6,
    width: "72%",
  },
  lineSm: {
    height: 12,
    borderRadius: 6,
    width: "48%",
  },
  blockLight: {
    backgroundColor: "#E5E7EB",
  },
  blockDark: {
    backgroundColor: "#1F2A44",
  },
});
