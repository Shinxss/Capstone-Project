import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";

type DrawerRowProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  disabled?: boolean;
  right?: React.ReactNode;
  isLast?: boolean;
};

function DrawerRow({
  title,
  subtitle,
  icon,
  onPress,
  disabled,
  right,
  isLast,
}: DrawerRowProps) {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      style={({ pressed }) => ({
        minHeight: 84,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 12,
        opacity: disabled ? 0.55 : pressed && onPress ? 0.85 : 1,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: isDark ? "#162544" : "#E5E7EB",
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#1B2A45" : "#F3F4F6",
        }}
      >
        <Ionicons name={icon} size={20} color={isDark ? "#CBD5E1" : "#737373"} />
      </View>

      <View style={{ flex: 1 }}>
        <Text className="text-[16px] font-extrabold text-slate-900 dark:text-slate-100">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300">{subtitle}</Text>
        ) : null}
      </View>

      {right ?? <Ionicons name="chevron-forward" size={18} color={isDark ? "#94A3B8" : "#7A7A7A"} />}
    </Pressable>
  );
}

function DrawerSectionLabel({ label }: { label: string }) {
  const { isDark } = useTheme();
  return (
    <Text
      style={{
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 10,
        color: isDark ? "#CBD5E1" : "#64748B",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.1,
        textTransform: "uppercase",
      }}
    >
      {label}
    </Text>
  );
}

type ProfileMoreDrawerProps = {
  visible: boolean;
  isUser: boolean;
  canShowVolunteerAssignmentsToggle: boolean;
  communityUpdatesEnabled: boolean;
  volunteerAssignmentsEnabled: boolean;
  updatingPrefs: boolean;
  isDarkModeEnabled: boolean;
  onClose: () => void;
  onPressProfileSettings: () => void;
  onToggleCommunityUpdates: (nextValue: boolean) => void;
  onToggleVolunteerAssignments: (nextValue: boolean) => void;
  onToggleDarkMode: (nextValue: boolean) => void;
  onPressResource: (title: string) => void;
  onPressSupport: (title: string) => void;
  onPressSessionAction: () => void;
};

export default function ProfileMoreDrawer({
  visible,
  isUser,
  canShowVolunteerAssignmentsToggle,
  communityUpdatesEnabled,
  volunteerAssignmentsEnabled,
  updatingPrefs,
  isDarkModeEnabled,
  onClose,
  onPressProfileSettings,
  onToggleCommunityUpdates,
  onToggleVolunteerAssignments,
  onToggleDarkMode,
  onPressResource,
  onPressSupport,
  onPressSessionAction,
}: ProfileMoreDrawerProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = useMemo(() => Math.min(Math.max(width * 0.82, 292), 360), [width]);
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(-drawerWidth);
    }
  }, [drawerWidth, slideAnim, visible]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [drawerWidth, overlayAnim, slideAnim, visible]);

  if (!mounted) return null;

  const closeThen = (action: () => void) => {
    onClose();
    action();
  };

  const sessionActionLabel = isUser ? "Log Out" : "Sign In";
  const sessionActionStyle = isUser
    ? {
        backgroundColor: isDark ? "rgba(220,38,38,0.12)" : "#FEF2F2",
        borderColor: "#DC2626",
        color: "#DC2626",
      }
    : {
        backgroundColor: isDark ? "rgba(37,99,235,0.18)" : "#EFF6FF",
        borderColor: isDark ? "#3B82F6" : "#2563EB",
        color: isDark ? "#BFDBFE" : "#1D4ED8",
      };

  return (
    <Modal transparent visible={mounted} animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start" }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: overlayAnim,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              flex: 1,
              backgroundColor: isDark ? "rgba(2,6,23,0.58)" : "rgba(15,23,42,0.22)",
            }}
          />
        </Animated.View>

        <Animated.View
          style={{
            width: drawerWidth,
            height: "100%",
            transform: [{ translateX: slideAnim }],
            backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
            borderRightWidth: 1,
            borderRightColor: isDark ? "#162544" : "#E5E7EB",
            paddingTop: insets.top + 22,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 18,
              paddingBottom: 8,
            }}
          >
            <Text className="text-[18px] font-extrabold text-slate-900 dark:text-slate-100">More</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={isDark ? "#F8FAFC" : "#0F172A"} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(20, insets.bottom + 12) }}
          >
            <DrawerSectionLabel label="Account" />
            <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: isDark ? "#162544" : "#E5E7EB" }}>
              <DrawerRow
                title="Profile Settings"
                subtitle="Manage your personal information"
                icon="person-outline"
                onPress={() => closeThen(onPressProfileSettings)}
              />
              <DrawerRow
                title="Request Updates"
                subtitle="Status alerts for your emergency requests"
                icon="notifications-outline"
                right={
                  <Switch
                    value={communityUpdatesEnabled}
                    onValueChange={onToggleCommunityUpdates}
                    trackColor={{ false: isDark ? "#1B2A45" : "#D1D5DB", true: isDark ? "#3B82F6" : "#DC2626" }}
                    thumbColor="#FFFFFF"
                    disabled={!isUser || updatingPrefs}
                  />
                }
                disabled={!isUser}
              />
              {canShowVolunteerAssignmentsToggle ? (
                <DrawerRow
                  title="Volunteer Assignments"
                  subtitle="Alerts when a new dispatch is assigned"
                  icon="clipboard-outline"
                  right={
                    <Switch
                      value={volunteerAssignmentsEnabled}
                      onValueChange={onToggleVolunteerAssignments}
                      trackColor={{ false: isDark ? "#1B2A45" : "#D1D5DB", true: isDark ? "#3B82F6" : "#DC2626" }}
                      thumbColor="#FFFFFF"
                      disabled={!isUser || updatingPrefs}
                    />
                  }
                  disabled={!isUser}
                />
              ) : null}
              <DrawerRow
                title="Dark Mode"
                subtitle="Toggle dark theme"
                icon="moon-outline"
                isLast
                right={
                  <Switch
                    value={isDarkModeEnabled}
                    onValueChange={onToggleDarkMode}
                    trackColor={{ false: isDark ? "#1B2A45" : "#D1D5DB", true: "#3B82F6" }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
            </View>

            <DrawerSectionLabel label="Resources" />
            <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: isDark ? "#162544" : "#E5E7EB" }}>
              <DrawerRow
                title="Emergency Guidelines"
                subtitle="Safety tips and procedures"
                icon="book-outline"
                onPress={() => closeThen(() => onPressResource("Emergency Guidelines"))}
              />
              <DrawerRow
                title="Emergency Hotlines"
                subtitle="Important contact numbers"
                icon="call-outline"
                onPress={() => closeThen(() => onPressResource("Emergency Hotlines"))}
              />
              <DrawerRow
                title="Evacuation Centers"
                subtitle="Find nearby safe zones"
                icon="location-outline"
                onPress={() => closeThen(() => onPressResource("Evacuation Centers"))}
                isLast
              />
            </View>

            <DrawerSectionLabel label="Support" />
            <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: isDark ? "#162544" : "#E5E7EB" }}>
              <DrawerRow
                title="Help & FAQ"
                subtitle="Get help using the app"
                icon="help-circle-outline"
                onPress={() => closeThen(() => onPressSupport("Help & FAQ"))}
              />
              <DrawerRow
                title="Terms & Privacy"
                subtitle="Legal information"
                icon="document-text-outline"
                onPress={() => closeThen(() => onPressSupport("Terms & Privacy"))}
              />
              <DrawerRow
                title="App Settings"
                subtitle="Language, data, permissions"
                icon="settings-outline"
                onPress={() => closeThen(() => onPressSupport("App Settings"))}
                isLast
              />
            </View>

            <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
              <Pressable
                onPress={() => closeThen(onPressSessionAction)}
                style={({ pressed }) => ({
                  minHeight: 48,
                  borderRadius: 16,
                  borderWidth: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: sessionActionStyle.backgroundColor,
                  borderColor: sessionActionStyle.borderColor,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: sessionActionStyle.color, fontSize: 15, fontWeight: "600" }}>
                  {sessionActionLabel}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
