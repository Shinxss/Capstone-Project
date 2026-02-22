import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Siren } from "lucide-react-native";

const ACTIVE = "#2563EB"; // blue
const INACTIVE = "#94A3B8"; // gray
const RED = "#EF4444";

type Props = BottomTabBarProps & {
  onPressReportAction: () => void;
  onPressRegularTab: () => void;
};

type TabKey = "index" | "map" | "alert" | "more";

const TABS: { name: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: "index", label: "Home", icon: "home-outline" },
  { name: "map", label: "Map", icon: "map-outline" },
  { name: "alert", label: "Tasks", icon: "clipboard-outline" },
  { name: "more", label: "More", icon: "ellipsis-horizontal" },
];

export default function BottomNav(props: Props) {
  const { state, navigation } = props;
  const { onPressReportAction, onPressRegularTab } = props;
  const insets = useSafeAreaInsets();

  const goTo = (name: TabKey) => {
    onPressRegularTab();

    const route = state.routes.find((r) => r.name === name);
    if (!route) return;

    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  const isFocused = (name: TabKey) => {
    const idx = state.routes.findIndex((r) => r.name === name);
    return idx === state.index;
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row}>
        {/* Left tabs */}
        <TabButton
          label={TABS[0].label}
          icon={TABS[0].icon}
          focused={isFocused("index")}
          onPress={() => goTo("index")}
        />
        <TabButton
          label={TABS[1].label}
          icon={TABS[1].icon}
          focused={isFocused("map")}
          onPress={() => goTo("map")}
        />

        {/* Center big + */}
        <View style={styles.centerSlot}>
          <Pressable
            onPress={onPressReportAction}
            style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
          >
            <Siren size={27} color="#fff" strokeWidth={1.8} />
          </Pressable>
        </View>

        {/* Right tabs */}
        <TabButton
          label={TABS[2].label}
          icon={TABS[2].icon}
          focused={isFocused("alert")}
          onPress={() => goTo("alert")}
        />
        <TabButton
          label={TABS[3].label}
          icon={TABS[3].icon}
          focused={isFocused("more")}
          onPress={() => goTo("more")}
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  onPress: () => void;
}) {
  const color = focused ? ACTIVE : INACTIVE;

  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  row: {
    height: 64,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 2,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
  },
  centerSlot: {
    width: 90,
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
    borderColor: "#fff",
    marginTop: -34, // ✅ makes it float up like your image
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
});
