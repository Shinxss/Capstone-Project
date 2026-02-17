import React, { useCallback } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../features/auth/AuthProvider";
import { useSession } from "../../features/auth/hooks/useSession";
import { useGoogleLogin } from "../../features/auth/hooks/useGoogleLogin";
import { linkGoogleAccount } from "../../features/auth/services/authApi";

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
};

function SettingsRow({ title, subtitle, onPress, disabled }: SettingsRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, (pressed || disabled) && styles.rowPressed]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.rowArrow}>{">"}</Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { displayName, isUser, session, updateUser } = useSession();

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.sub}>
          Signed in as: <Text style={styles.bold}>{displayName}</Text>
        </Text>

        <View style={styles.sectionGap}>
          <SettingsRow
            title="Reset Password"
            subtitle="Change or recover your password"
            onPress={onResetPassword}
          />

          {isUser && isGoogleLinked && !hasPassword ? (
            <SettingsRow
              title="Create Password"
              subtitle="Enable email and password login"
              onPress={onCreatePassword}
            />
          ) : null}

          {isUser && hasPassword && !isGoogleLinked ? (
            <SettingsRow
              title={linkingGoogle ? "Linking Google..." : "Link Google Account"}
              subtitle="Use Google and password on one account"
              onPress={onLinkGoogle}
              disabled={linkingGoogle}
            />
          ) : null}

          {googleLinkError ? <Text style={styles.errorText}>{googleLinkError}</Text> : null}
        </View>

        <Pressable style={[styles.btn, !isUser && styles.btnDisabled]} onPress={onLogout}>
          <Text style={styles.btnText}>{isUser ? "Log out" : "Log in"}</Text>
        </Pressable>

        {!isUser && (
          <Text style={styles.hint}>
            You are in Guest mode. Tap Log in to continue with your account.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  sub: { marginTop: 6, color: "#6B7280" },
  bold: { fontWeight: "800", color: "#111827" },

  sectionGap: {
    marginTop: 14,
    gap: 10,
  },
  row: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowPressed: { opacity: 0.75 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  rowSubtitle: { marginTop: 2, fontSize: 12, color: "#6B7280" },
  rowArrow: { fontSize: 16, fontWeight: "700", color: "#9CA3AF" },

  errorText: { marginTop: 4, fontSize: 12, color: "#DC2626" },

  btn: {
    marginTop: 16,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.95 },
  btnText: { color: "#fff", fontWeight: "900" },

  hint: { marginTop: 10, fontSize: 12, color: "#9CA3AF" },
});
