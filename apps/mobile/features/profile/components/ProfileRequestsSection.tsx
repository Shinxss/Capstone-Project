import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserCheck } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import type { ProfileRequestShortcutTab } from "../models/profile";

const REQUEST_SHORTCUTS: Array<{
  tab: ProfileRequestShortcutTab;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  verified?: boolean;
}> = [
  { tab: "assigned", label: "Assigned", icon: "person-circle-outline", verified: true },
  { tab: "en_route", label: "En Route", icon: "navigate-outline" },
  { tab: "arrived", label: "Arrived", icon: "location-outline" },
  { tab: "resolved", label: "Resolved", icon: "checkmark-done-outline" },
];

type ProfileRequestsSectionProps = {
  isUser: boolean;
  onPressRequestHistory: () => void;
  onPressRequestShortcut: (tab: ProfileRequestShortcutTab) => void;
  showDotFor: (tab: ProfileRequestShortcutTab) => boolean;
};

function RequestShortcutTile({
  label,
  icon,
  verified,
  showDot,
  disabled,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  verified?: boolean;
  showDot: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  const accentColor = isDark ? "#3B82F6" : "#DC2626";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 items-center justify-center px-1 py-2 active:opacity-80 ${disabled ? "opacity-60" : ""}`}
    >
      <View
        className="relative h-[42px] w-[42px] items-center justify-center"
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: verified ? 2 : 0,
          }}
        >
          {verified ? (
            <UserCheck size={25} color={accentColor} strokeWidth={2.2} />
          ) : (
            <Ionicons name={icon} size={27} color={accentColor} />
          )}
        </View>

        {showDot ? (
          <View
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#DC2626",
              borderWidth: 1,
              borderColor: isDark ? "#0E1626" : "#FFFFFF",
            }}
          />
        ) : null}
      </View>

      <Text className={`mt-1.5 text-[13px] font-semibold ${isDark ? "text-slate-100" : "text-slate-700"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileRequestsSection({
  isUser,
  onPressRequestHistory,
  onPressRequestShortcut,
  showDotFor,
}: ProfileRequestsSectionProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        marginTop: 20,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 14,
        borderBottomWidth: 1,
        backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
        borderBottomColor: isDark ? "#162544" : "#E5E7EB",
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100">My Requests</Text>
        <Pressable onPress={onPressRequestHistory} hitSlop={8} className="active:opacity-80">
          <Text className="text-xs font-bold" style={{ color: isDark ? "#3B82F6" : "#DC2626" }}>
            View Request History &gt;
          </Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row gap-2 px-1">
        {REQUEST_SHORTCUTS.map((shortcut) => (
          <RequestShortcutTile
            key={shortcut.tab}
            label={shortcut.label}
            icon={shortcut.icon}
            verified={shortcut.verified}
            disabled={!isUser}
            showDot={showDotFor(shortcut.tab)}
            onPress={() => onPressRequestShortcut(shortcut.tab)}
          />
        ))}
      </View>
    </View>
  );
}
