import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../features/auth/AuthProvider";
import { useSession } from "../../features/auth/hooks/useSession";
import { useGoogleLogin } from "../../features/auth/hooks/useGoogleLogin";
import { linkGoogleAccount } from "../../features/auth/services/authApi";

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
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        danger && styles.rowDanger,
        pressed && onPress && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
      onPress={onPress}
      disabled={!onPress || disabled}
    >
      <View style={[styles.rowIconWrap, danger && styles.rowIconWrapDanger]}>
        <Ionicons name={icon} size={22} color={danger ? "#DC2626" : "#737373"} />
      </View>

      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>

      {right ? (
        right
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color="#7A7A7A" />
      ) : null}
    </Pressable>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export default function MoreScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { displayName, isUser, session, updateUser } = useSession();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const user = session?.mode === "user" ? session.user : null;
  const hasPassword =
    Boolean(user?.passwordSet) || user?.authProvider === "local" || user?.authProvider === "both";
  const isGoogleLinked =
    Boolean(user?.googleLinked) || user?.authProvider === "google" || user?.authProvider === "both";

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

  const accountName = isUser ? displayName : "Guest User";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileHead}>
            <View style={styles.avatar}>
              <Ionicons name={isUser ? "person-outline" : "help"} size={30} color="#777777" />
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{accountName}</Text>
              <Text style={styles.profileSub}>
                {isUser ? "Manage your account and emergency settings" : "Sign in to access all features"}
              </Text>
            </View>

            <Pressable style={styles.authButton} onPress={onLogout}>
              <Text style={styles.authButtonText}>{isUser ? "Log out" : "Sign In"}</Text>
            </Pressable>
          </View>
        </View>

        <SectionLabel label="ACCOUNT" />
        <View style={styles.section}>
          <MoreRow
            title="Profile Settings"
            subtitle="Manage your personal information"
            icon="person-outline"
            onPress={onPressProfileSettings}
          />
          <MoreRow
            title="Notifications"
            subtitle="Push notifications and alerts"
            icon="notifications-outline"
            showChevron={false}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#D9D9D9", true: "#EF4444" }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <MoreRow
            title="Dark Mode"
            subtitle="Toggle dark theme"
            icon="moon-outline"
            showChevron={false}
            isLast
            right={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: "#D9D9D9", true: "#EF4444" }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <SectionLabel label="VOLUNTEER" />
        <View style={styles.section}>
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

        <SectionLabel label="RESOURCES" />
        <View style={styles.section}>
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

        <SectionLabel label="SUPPORT" />
        <View style={styles.section}>
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

        <View style={styles.section}>
          <MoreRow
            title={isUser ? "Log Out" : "Sign In"}
            subtitle={isUser ? "Sign out from your account" : "Sign in to access all features"}
            icon={isUser ? "log-out-outline" : "log-in-outline"}
            danger
            onPress={onLogout}
            isLast
          />
        </View>

        {googleLinkError ? <Text style={styles.errorText}>{googleLinkError}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.footerMain}>Lifeline v1.0.0</Text>
          <Text style={styles.footerSub}>Copyright 2024 LGU Emergency Response</Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  profileHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#E3E3E3",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCopy: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
  },
  profileSub: {
    marginTop: 2,
    color: "#585858",
    fontSize: 13,
    lineHeight: 18,
  },
  authButton: {
    backgroundColor: "#EF1D20",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    shadowColor: "#991B1B",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#656565",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E4E4E7",
    marginBottom: 12,
  },
  row: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowDisabled: {
    opacity: 1,
  },
  rowDanger: {
    backgroundColor: "#FFFFFF",
  },
  rowIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconWrapDanger: {
    backgroundColor: "#FEE2E2",
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#181818",
  },
  rowTitleDanger: {
    color: "#DC2626",
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#686868",
  },
  errorText: {
    paddingHorizontal: 20,
    marginTop: -4,
    marginBottom: 10,
    color: "#DC2626",
    fontSize: 12,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  footerMain: {
    fontSize: 13,
    color: "#666666",
  },
  footerSub: {
    marginTop: 2,
    fontSize: 13,
    color: "#666666",
  },
});
