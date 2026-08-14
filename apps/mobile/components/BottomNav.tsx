import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Siren } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../features/auth/AuthProvider";
import { useBottomNavMetrics } from "../features/common/hooks/useBottomNavMetrics";
import { useResponsiveLayout } from "../features/common/hooks/useResponsiveLayout";
import { useTheme } from "../features/theme/useTheme";

const ACTIVE = "#2563EB";
const INACTIVE_LIGHT = "#94A3B8";
const INACTIVE_DARK = "#94A3B8";
const RED = "#DC2626";

type Props = BottomTabBarProps & {
  onPressReportAction: () => void;
  onPressRegularTab: () => void;
};

type TabKey = "index" | "map" | "tasks" | "more";

const TABS: { name: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: "index", label: "Home", icon: "home-outline" },
  { name: "map", label: "Map", icon: "map-outline" },
  { name: "tasks", label: "Tasks", icon: "clipboard-outline" },
  { name: "more", label: "Profile", icon: "person-outline" },
];

export default function BottomNav(props: Props) {
  const { state, navigation, onPressReportAction, onPressRegularTab } = props;
  const { isDark } = useTheme();
  const { user, isGuest } = useAuth();
  const { bottomInset, contentHeight } = useBottomNavMetrics();
  const { isNarrow } = useResponsiveLayout();
  const normalizedRole = String(user?.role ?? "").trim().toUpperCase();
  const tasksLabel = isGuest || normalizedRole === "COMMUNITY" ? "My Request" : "Tasks";

  const goTo = (name: TabKey) => {
    onPressRegularTab();

    const route = state.routes.find((r) => r.name === name);
    if (!route) return;

    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const isFocused = (name: TabKey) => {
    const idx = state.routes.findIndex((r) => r.name === name);
    return idx === state.index;
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: bottomInset,
          backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
          borderTopColor: isDark ? "#162544" : "#E5E7EB",
        },
      ]}
    >
      <View
        style={[
          styles.row,
          {
            height: contentHeight,
            paddingHorizontal: isNarrow ? 4 : 8,
          },
        ]}
      >
        <TabButton
          label={TABS[0].label}
          icon={TABS[0].icon}
          focused={isFocused("index")}
          isDark={isDark}
          onPress={() => goTo("index")}
          isNarrow={isNarrow}
        />

        <TabButton
          label={TABS[1].label}
          icon={TABS[1].icon}
          focused={isFocused("map")}
          isDark={isDark}
          onPress={() => goTo("map")}
          isNarrow={isNarrow}
        />

        <View style={styles.centerSlot}>
          <Pressable
            onPress={onPressReportAction}
            style={({ pressed }) => [
              styles.fab,
              isNarrow ? styles.fabNarrow : null,
              { borderColor: isDark ? "#0B1220" : "#FFFFFF" },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Siren size={27} color="#FFFFFF" strokeWidth={1.8} />
          </Pressable>
        </View>

        <TabButton
          label={tasksLabel}
          icon={TABS[2].icon}
          focused={isFocused("tasks")}
          isDark={isDark}
          onPress={() => goTo("tasks")}
          isNarrow={isNarrow}
        />

        <TabButton
          label={TABS[3].label}
          icon={TABS[3].icon}
          focused={isFocused("more")}
          isDark={isDark}
          onPress={() => goTo("more")}
          isNarrow={isNarrow}
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  focused,
  isDark,
  onPress,
  isNarrow = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  isDark: boolean;
  onPress: () => void;
  isNarrow?: boolean;
}) {
  const color = focused ? ACTIVE : isDark ? INACTIVE_DARK : INACTIVE_LIGHT;

  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Ionicons name={icon} size={22} color={color} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.86}
        maxFontSizeMultiplier={1.15}
        style={[styles.label, isNarrow ? styles.labelNarrow : null, { color }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 2,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    textAlign: "center",
  },
  labelNarrow: { fontSize: 10 },
  centerSlot: {
    flex: 0.95,
    minWidth: 68,
    maxWidth: 84,
    alignItems: "center",
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 7,
    borderColor: "#FFFFFF",
    marginTop: -34,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  fabNarrow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    marginTop: -30,
  },
});
