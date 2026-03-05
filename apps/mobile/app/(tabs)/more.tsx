import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { UserCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import GradientScreen from "../../src/components/GradientScreen";
import { useAuth } from "../../features/auth/AuthProvider";
import { useSession } from "../../features/auth/hooks/useSession";
import { useGoogleLogin } from "../../features/auth/hooks/useGoogleLogin";
import { useTheme } from "../../features/theme/useTheme";
import { linkGoogleAccount } from "../../features/auth/services/authApi";
import type { MyRequestStatusTab } from "../../features/requests/models/myRequests";
import { useMyRequestCounts } from "../../features/requests/hooks/useMyRequestCounts";
import {
  fetchPushPreferences,
  updatePushPreferences,
} from "../../features/notifications/services/pushRegistrationApi";

type RowIconName = React.ComponentProps<typeof Ionicons>["name"];

type MoreRowProps = {
  title: string;
  subtitle?: string;
  icon: RowIconName;
  onPress?: () => void;
  disabled?: boolean;
  showChevron?: boolean;
  right?: React.ReactNode;
  danger?: boolean;
  isLast?: boolean;
};

function MoreRow({
  title,
  subtitle,
  icon,
  onPress,
  disabled,
  showChevron = true,
  right,
  danger,
  isLast,
}: MoreRowProps) {
  const { isDark } = useTheme();
  const dangerAccentColor = "#DC2626";
  const rowBg = isDark ? "#0E1626" : "#FFFFFF";
  const rowBorder = isDark ? "#162544" : "#E5E7EB";
  const pressedBg = danger
    ? isDark
      ? "#0F1A2E"
      : "#FEF2F2"
    : isDark
      ? "#0F1A2E"
      : "#F9FAFB";
  const iconBg = danger
    ? isDark
      ? "rgba(220,38,38,0.2)"
      : "#FEE2E2"
    : isDark
      ? "#1B2A45"
      : "#F3F4F6";

  return (
    <Pressable
      style={({ pressed }) => ({
        minHeight: 88,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: pressed && onPress && !disabled ? pressedBg : rowBg,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: rowBorder,
        opacity: disabled ? 0.6 : 1,
      })}
      onPress={onPress}
      disabled={!onPress || disabled}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconBg,
        }}
      >
        <Ionicons name={icon} size={22} color={danger ? dangerAccentColor : isDark ? "#CBD5E1" : "#737373"} />
      </View>

      <View className="flex-1">
        <Text
          className={`${danger ? "font-medium" : "font-extrabold"} text-slate-900 dark:text-slate-100`}
          style={
            danger
              ? { color: dangerAccentColor, fontWeight: "500", fontSize: 17 }
              : { color: isDark ? "#F8FAFC" : "#0F172A", fontWeight: "800", fontSize: 17 }
          }
        >
          {title}
        </Text>
        {subtitle ? <Text className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300">{subtitle}</Text> : null}
      </View>

      {right ? (
        right
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color={isDark ? "#94A3B8" : "#7A7A7A"} />
      ) : null}
    </Pressable>
  );
}

function SectionLabel({ label, compact = false }: { label: string; compact?: boolean }) {
  const { isDark } = useTheme();

  return (
    <Text
      className={`px-5 text-[13px] font-bold uppercase tracking-[1.1px] ${
        isDark ? "text-slate-300" : "text-slate-500"
      } ${
        compact ? "pt-2.5 pb-2.5" : "pt-4.5 pb-2.5"
      }`}
    >
      {label}
    </Text>
  );
}

function formatRoleLabel(rawRole?: string) {
  const normalized = String(rawRole ?? "").trim().toUpperCase();
  if (!normalized) return "Community Member";
  if (normalized === "COMMUNITY") return "Community Member";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

type RequestShortcutTab = Extract<MyRequestStatusTab, "assigned" | "en_route" | "arrived" | "resolved">;

const SHORTCUT_SEEN_STORAGE_PREFIX = "lifeline.more.shortcuts.seen";
const DEFAULT_SEEN_SHORTCUT_COUNTS: Record<RequestShortcutTab, number> = {
  assigned: 0,
  en_route: 0,
  arrived: 0,
  resolved: 0,
};

function normalizeSeenShortcutCounts(raw: unknown): Record<RequestShortcutTab, number> {
  const source = (raw ?? {}) as Partial<Record<RequestShortcutTab, unknown>>;

  const toCount = (value: unknown) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(value));
  };

  return {
    assigned: toCount(source.assigned),
    en_route: toCount(source.en_route),
    arrived: toCount(source.arrived),
    resolved: toCount(source.resolved),
  };
}

const REQUEST_SHORTCUTS: Array<{
  tab: RequestShortcutTab;
  label: string;
  icon: RowIconName;
  verified?: boolean;
}> = [
  { tab: "assigned", label: "Assigned", icon: "person-circle-outline", verified: true },
  { tab: "en_route", label: "En Route", icon: "navigate-outline" },
  { tab: "arrived", label: "Arrived", icon: "location-outline" },
  { tab: "resolved", label: "Resolved", icon: "checkmark-done-outline" },
];

type RequestShortcutTileProps = {
  label: string;
  icon: RowIconName;
  showDot: boolean;
  disabled: boolean;
  verified?: boolean;
  onPress: () => void;
};

function RequestShortcutTile({ label, icon, showDot, disabled, verified, onPress }: RequestShortcutTileProps) {
  const { isDark } = useTheme();
  const accentColor = isDark ? "#3B82F6" : "#DC2626";
  const iconBgClass = isDark
    ? "rounded-sm border border-blue-400/45 bg-blue-500/20"
    : "rounded-sm border border-red-200 bg-red-100";
  const labelClass = isDark ? "text-slate-100" : "text-slate-700";

  return (
    <Pressable
      className={`relative flex-1 items-center justify-center px-1 py-2.5 active:opacity-80 ${
        disabled ? "opacity-60" : ""
      }`}
      onPress={onPress}
    >
      <View className={`relative h-[42px] w-[42px] items-center justify-center ${iconBgClass}`}>
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: verified ? 2 : 0,
          }}
        >
          {verified ? (
            <UserCheck size={23} color={accentColor} strokeWidth={2.2} />
          ) : (
            <Ionicons name={icon} size={25} color={accentColor} />
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
      <Text className={`mt-1.5 text-[13px] font-semibold ${labelClass}`}>{label}</Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { displayName, isUser, session, updateUser } = useSession();
  const { mode, isDark, setMode } = useTheme();

  const [communityUpdatesEnabled, setCommunityUpdatesEnabled] = useState(true);
  const [volunteerAssignmentsEnabled, setVolunteerAssignmentsEnabled] = useState(true);
  const [updatingPrefs, setUpdatingPrefs] = useState(false);
  const [seenShortcutCounts, setSeenShortcutCounts] = useState<Record<RequestShortcutTab, number>>(
    DEFAULT_SEEN_SHORTCUT_COUNTS
  );
  const [seenCountsLoaded, setSeenCountsLoaded] = useState(false);
  const {
    counts: requestCounts,
    loading: requestCountsLoading,
    refresh: refreshRequestCounts,
  } = useMyRequestCounts({ enabled: isUser });

  const user = session?.mode === "user" ? session.user : null;
  const hasPassword =
    Boolean(user?.passwordSet) || user?.authProvider === "local" || user?.authProvider === "both";
  const isGoogleLinked =
    Boolean(user?.googleLinked) || user?.authProvider === "google" || user?.authProvider === "both";
  const userRole = useMemo(() => String(user?.role ?? "").trim().toUpperCase(), [user?.role]);
  const seenShortcutStorageKey = useMemo(() => {
    if (!isUser || !user?.id) return null;
    return `${SHORTCUT_SEEN_STORAGE_PREFIX}.${user.id}`;
  }, [isUser, user?.id]);
  const volunteerStatus = useMemo(
    () => String(user?.volunteerStatus ?? "").trim().toUpperCase(),
    [user?.volunteerStatus]
  );
  const canShowVolunteerAssignmentsToggle =
    isUser && (userRole === "VOLUNTEER" || volunteerStatus === "APPROVED");

  const {
    start: startGoogleLink,
    loading: linkingGoogle,
    error: googleLinkError,
    clearError: clearGoogleLinkError,
  } = useGoogleLogin({
    onIdToken: async (idToken: string) => {
      const linkedUser = await linkGoogleAccount({ idToken });
      await updateUser({
        firstName: linkedUser.firstName,
        lastName: linkedUser.lastName,
        email: linkedUser.email,
        role: linkedUser.role,
        volunteerStatus: linkedUser.volunteerStatus,
        authProvider: linkedUser.authProvider,
        emailVerified: linkedUser.emailVerified,
        passwordSet: linkedUser.passwordSet,
        googleLinked: linkedUser.googleLinked,
      });

      Alert.alert("Success", "Google account linked successfully.");
    },
  });

  const onLogout = useCallback(() => {
    if (!isUser) {
      void (async () => {
        await signOut();
        router.replace("/(auth)/login");
      })();
      return;
    }

    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/login");
          } catch {
            Alert.alert("Logout failed", "Please try again.");
          }
        },
      },
    ]);
  }, [isUser, router, signOut]);

  const onResetPassword = useCallback(() => {
    router.push("/forgot-password");
  }, [router]);

  const onCreatePassword = useCallback(() => {
    router.push("/set-password");
  }, [router]);

  const onLinkGoogle = useCallback(async () => {
    if (linkingGoogle) return;
    clearGoogleLinkError();
    await startGoogleLink();
  }, [clearGoogleLinkError, linkingGoogle, startGoogleLink]);

  const onComingSoon = useCallback((title: string) => {
    Alert.alert(title, "This page is not available yet.");
  }, []);

  const promptSignInForRequests = useCallback(() => {
    Alert.alert("Sign in required", "Please sign in to view your request history.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign In",
        onPress: () => {
          void onLogout();
        },
      },
    ]);
  }, [onLogout]);

  const markShortcutSeen = useCallback(
    (tab: RequestShortcutTab) => {
      if (!isUser || requestCountsLoading) return;
      setSeenShortcutCounts((prev) => ({
        ...prev,
        [tab]: Math.max(prev[tab], requestCounts[tab]),
      }));
    },
    [isUser, requestCounts, requestCountsLoading]
  );

  const markAllShortcutsSeen = useCallback(() => {
    if (!isUser || requestCountsLoading) return;
    setSeenShortcutCounts({
      assigned: requestCounts.assigned,
      en_route: requestCounts.en_route,
      arrived: requestCounts.arrived,
      resolved: requestCounts.resolved,
    });
  }, [isUser, requestCounts, requestCountsLoading]);

  const onPressRequestHistory = useCallback(() => {
    if (!isUser) {
      promptSignInForRequests();
      return;
    }
    markAllShortcutsSeen();
    router.push("/my-requests/history");
  }, [isUser, markAllShortcutsSeen, promptSignInForRequests, router]);

  const onPressRequestShortcut = useCallback(
    (tab: RequestShortcutTab) => {
      if (!isUser) {
        promptSignInForRequests();
        return;
      }
      markShortcutSeen(tab);

      router.push({
        pathname: "/my-requests/history",
        params: { tab },
      });
    },
    [isUser, markShortcutSeen, promptSignInForRequests, router]
  );

  const onPressProfileSettings = useCallback(() => {
    const actions: {
      text: string;
      style?: "default" | "cancel" | "destructive";
      onPress?: () => void;
    }[] = [
      {
        text: "Reset Password",
        onPress: onResetPassword,
      },
    ];

    if (isUser && isGoogleLinked && !hasPassword) {
      actions.push({
        text: "Create Password",
        onPress: onCreatePassword,
      });
    }

    if (isUser && hasPassword && !isGoogleLinked) {
      actions.push({
        text: linkingGoogle ? "Linking Google..." : "Link Google Account",
        onPress: () => {
          void onLinkGoogle();
        },
      });
    }

    actions.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Profile Settings", "Manage your account credentials.", actions);
  }, [
    hasPassword,
    isGoogleLinked,
    isUser,
    linkingGoogle,
    onCreatePassword,
    onLinkGoogle,
    onResetPassword,
  ]);

  const accountName = useMemo(() => {
    if (!isUser) return "Guest User";
    const firstName = String(user?.firstName ?? "").trim();
    const lastName = String(user?.lastName ?? "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    return fullName || displayName;
  }, [displayName, isUser, user?.firstName, user?.lastName]);

  const profileRoleText = useMemo(() => formatRoleLabel(user?.role), [user?.role]);
  const profileEmailText = useMemo(
    () => String(user?.email ?? "").trim() || "No email set",
    [user?.email]
  );

  useFocusEffect(
    useCallback(() => {
      if (!isUser) return;
      void refreshRequestCounts();
    }, [isUser, refreshRequestCounts])
  );

  useEffect(() => {
    if (!isUser || !seenShortcutStorageKey) {
      setSeenShortcutCounts(DEFAULT_SEEN_SHORTCUT_COUNTS);
      setSeenCountsLoaded(true);
      return;
    }

    let alive = true;
    setSeenCountsLoaded(false);

    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(seenShortcutStorageKey);
        if (!alive) return;
        if (!raw) {
          setSeenShortcutCounts(DEFAULT_SEEN_SHORTCUT_COUNTS);
        } else {
          const parsed = JSON.parse(raw) as unknown;
          setSeenShortcutCounts(normalizeSeenShortcutCounts(parsed));
        }
      } catch {
        if (!alive) return;
        setSeenShortcutCounts(DEFAULT_SEEN_SHORTCUT_COUNTS);
      } finally {
        if (alive) setSeenCountsLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isUser, seenShortcutStorageKey]);

  useEffect(() => {
    if (!isUser || !seenShortcutStorageKey || !seenCountsLoaded) return;
    void AsyncStorage.setItem(seenShortcutStorageKey, JSON.stringify(seenShortcutCounts));
  }, [isUser, seenShortcutCounts, seenCountsLoaded, seenShortcutStorageKey]);

  useEffect(() => {
    if (!isUser) return;

    let alive = true;
    void (async () => {
      try {
        const prefs = await fetchPushPreferences();
        if (!alive) return;
        setCommunityUpdatesEnabled(Boolean(prefs.notificationPrefs?.communityRequestUpdates ?? true));
        setVolunteerAssignmentsEnabled(Boolean(prefs.notificationPrefs?.volunteerAssignments ?? true));
      } catch {
        // keep defaults
      }
    })();

    return () => {
      alive = false;
    };
  }, [isUser]);

  const onToggleCommunityUpdates = useCallback(
    async (nextValue: boolean) => {
      if (!isUser || updatingPrefs) return;
      setCommunityUpdatesEnabled(nextValue);
      setUpdatingPrefs(true);
      try {
        const updated = await updatePushPreferences({ communityRequestUpdates: nextValue });
        setCommunityUpdatesEnabled(Boolean(updated.notificationPrefs?.communityRequestUpdates ?? nextValue));
      } catch {
        setCommunityUpdatesEnabled((prev) => !prev);
      } finally {
        setUpdatingPrefs(false);
      }
    },
    [isUser, updatingPrefs]
  );

  const onToggleVolunteerAssignments = useCallback(
    async (nextValue: boolean) => {
      if (!isUser || updatingPrefs) return;
      setVolunteerAssignmentsEnabled(nextValue);
      setUpdatingPrefs(true);
      try {
        const updated = await updatePushPreferences({ volunteerAssignments: nextValue });
        setVolunteerAssignmentsEnabled(Boolean(updated.notificationPrefs?.volunteerAssignments ?? nextValue));
      } catch {
        setVolunteerAssignmentsEnabled((prev) => !prev);
      } finally {
        setUpdatingPrefs(false);
      }
    },
    [isUser, updatingPrefs]
  );

  const isDarkModeEnabled = mode === "dark" || (mode === "system" && isDark);
  const sectionCardClass = isDark ? "bg-[#0E1626]" : "border-gray-200 bg-white";
  const darkSectionCardStyle = isDark ? { backgroundColor: "#0E1626", borderColor: "#162544" } : undefined;
  const profileSectionStyle = isDark
    ? { backgroundColor: "#0B1220", borderBottomColor: "#162544" }
    : { backgroundColor: "transparent", borderBottomColor: "#E5E7EB" };
  const myRequestsCardStyle = isDark
    ? { backgroundColor: "#0E1626", borderBottomColor: "#162544" }
    : { backgroundColor: "#FFFFFF", borderBottomColor: "#E5E7EB" };
  const editButtonStyle = {
    borderColor: isDark ? "#3B82F6" : "#DC2626",
    backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
  };

  return (
    <GradientScreen gradientHeight={220}>
      <ScrollView
        className="bg-transparent"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <View style={{ marginTop: 12, paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30, borderBottomWidth: 1, ...profileSectionStyle }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                position: "relative",
                width: 88,
                height: 88,
                borderRadius: 44,
                borderWidth: 2,
                borderColor: isDark ? "#2563EB" : "#DC2626",
                backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={isUser ? "person-outline" : "help"}
                  size={30}
                  color={isDark ? "#94A3B8" : "#A3A3A3"}
                />
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 0, marginLeft: 10, marginRight: 12 }}>
              <Text className="text-xl font-extrabold text-slate-900 dark:text-slate-100" numberOfLines={1}>
                {accountName}
              </Text>
              {isUser ? (
                <>
                  <Text className=" text-[13px] text-slate-600 dark:text-slate-300" numberOfLines={1}>
                    {profileRoleText}
                  </Text>
                  <Text className="text-xs text-slate-600 dark:text-slate-300" numberOfLines={1}>
                    {profileEmailText}
                  </Text>
                </>
              ) : (
                <Text className="mt-0.5 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                  Sign in to access all features
                </Text>
              )}
            </View>

            <Pressable
              className="items-center justify-center active:opacity-80"
              style={{
                ...editButtonStyle,
                borderWidth: 0.2,
                borderRadius: 12,
                minWidth: isUser ? 70 : 88,
                height: 35,
                paddingHorizontal: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={isUser ? onPressProfileSettings : onLogout}
            >
              <Text
                className={`font-semibold text-slate-900 dark:text-slate-100 ${isUser ? "text-sm" : "text-base"}`}
                style={{ textAlign: "center", lineHeight: isUser ? 18 : 20 }}
              >
                {isUser ? "Edit" : "Sign In"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={{paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, ...myRequestsCardStyle }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100">My Requests</Text>
            <Pressable onPress={onPressRequestHistory} hitSlop={8} className="active:opacity-80">
              <Text className="text-xs font-bold" style={{ color: isDark ? "#3B82F6" : "#DC2626" }}>
                View Request History &gt;
              </Text>
            </Pressable>
          </View>

          <View className="mt-3 flex-row gap-2">
            {REQUEST_SHORTCUTS.map((shortcut) => (
              <RequestShortcutTile
                key={shortcut.tab}
                label={shortcut.label}
                icon={shortcut.icon}
                disabled={!isUser}
                showDot={
                  isUser &&
                  seenCountsLoaded &&
                  !requestCountsLoading &&
                  requestCounts[shortcut.tab] > (seenShortcutCounts[shortcut.tab] ?? 0)
                }
                verified={Boolean(shortcut.verified)}
                onPress={() => onPressRequestShortcut(shortcut.tab)}
              />
            ))}
          </View>
        </View>

        <SectionLabel label="ACCOUNT" compact />
        <View className={`border-y ${sectionCardClass}`} style={darkSectionCardStyle}>
          <MoreRow
            title="Profile Settings"
            subtitle="Manage your personal information"
            icon="person-outline"
            onPress={onPressProfileSettings}
          />
          <MoreRow
            title="Request Updates"
            subtitle="Status alerts for your emergency requests"
            icon="notifications-outline"
            showChevron={false}
            right={
              <Switch
                value={communityUpdatesEnabled}
                onValueChange={onToggleCommunityUpdates}
                trackColor={{ false: isDark ? "#1B2A45" : "#D1D5DB", true: isDark ? "#3B82F6" : "#DC2626" }}
                thumbColor="#FFFFFF"
                disabled={!isUser || updatingPrefs}
              />
            }
          />
          {canShowVolunteerAssignmentsToggle ? (
            <MoreRow
              title="Volunteer Assignments"
              subtitle="Alerts when a new dispatch is assigned"
              icon="clipboard-outline"
              showChevron={false}
              right={
                <Switch
                  value={volunteerAssignmentsEnabled}
                  onValueChange={onToggleVolunteerAssignments}
                  trackColor={{ false: isDark ? "#1B2A45" : "#D1D5DB", true: isDark ? "#3B82F6" : "#DC2626" }}
                  thumbColor="#FFFFFF"
                  disabled={!isUser || updatingPrefs}
                />
              }
            />
          ) : null}

          <MoreRow
            title="Dark Mode"
            subtitle="Toggle dark theme"
            icon="moon-outline"
            showChevron={false}
            isLast
            right={
              <Switch
                value={isDarkModeEnabled}
                onValueChange={(nextValue) => setMode(nextValue ? "dark" : "light")}
                trackColor={{ false: isDark ? "#1B2A45" : "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <SectionLabel label="VOLUNTEER" compact />
        <View className={`border-y ${sectionCardClass}`} style={darkSectionCardStyle}>
          <MoreRow
            title="Volunteer Program"
            subtitle="Apply to become a verified responder"
            icon="shield-checkmark-outline"
            onPress={() => onComingSoon("Volunteer Program")}
          />
          <MoreRow
            title="My Tasks"
            subtitle="View assigned emergency tasks"
            icon="clipboard-outline"
            onPress={() => onComingSoon("My Tasks")}
          />
          <MoreRow
            title="My Contributions"
            subtitle="View your volunteer history"
            icon="heart-outline"
            onPress={() => onComingSoon("My Contributions")}
            isLast
          />
        </View>

        <SectionLabel label="RESOURCES" compact />
        <View className={`border-y ${sectionCardClass}`} style={darkSectionCardStyle}>
          <MoreRow
            title="Emergency Guidelines"
            subtitle="Safety tips and procedures"
            icon="book-outline"
            onPress={() => onComingSoon("Emergency Guidelines")}
          />
          <MoreRow
            title="Emergency Hotlines"
            subtitle="Important contact numbers"
            icon="call-outline"
            onPress={() => onComingSoon("Emergency Hotlines")}
          />
          <MoreRow
            title="Evacuation Centers"
            subtitle="Find nearby safe zones"
            icon="location-outline"
            onPress={() => onComingSoon("Evacuation Centers")}
            isLast
          />
        </View>

        <SectionLabel label="SUPPORT" compact />
        <View className={`border-y ${sectionCardClass}`} style={darkSectionCardStyle}>
          <MoreRow
            title="Help & FAQ"
            subtitle="Get help using the app"
            icon="help-circle-outline"
            onPress={() => onComingSoon("Help & FAQ")}
          />
          <MoreRow
            title="Terms & Privacy"
            subtitle="Legal information"
            icon="document-text-outline"
            onPress={() => onComingSoon("Terms & Privacy")}
          />
          <MoreRow
            title="App Settings"
            subtitle="Language, data, permissions"
            icon="settings-outline"
            onPress={() => onComingSoon("App Settings")}
            isLast
          />
        </View>

        <View className={`border-y ${sectionCardClass}`} style={darkSectionCardStyle}>
          <MoreRow
            title={isUser ? "Log Out" : "Sign In"}
            subtitle={isUser ? "Sign out from your account" : "Sign in to access all features"}
            icon={isUser ? "log-out-outline" : "log-in-outline"}
            danger={isUser}
            onPress={onLogout}
            isLast
          />
        </View>

        {googleLinkError ? <Text className="mt-1 px-5 text-xs text-lgu-danger">{googleLinkError}</Text> : null}

        <View className="items-center justify-center py-4.5">
          <Text className="text-[13px] text-slate-500 dark:text-slate-300">Lifeline v1.0.0</Text>
          <Text className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-300">
            Copyright 2024 LGU Emergency Response
          </Text>
        </View>
      </ScrollView>
    </GradientScreen>
  );
}
