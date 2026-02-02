import React, { useCallback } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../../features/auth/hooks/useSession";

export default function MoreScreen() {
  const router = useRouter();
  const { logout, displayName, isUser } = useSession();

  const onLogout = useCallback(() => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }, [logout, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.sub}>
          Signed in as: <Text style={styles.bold}>{displayName}</Text>
        </Text>

        <Pressable
          style={[styles.btn, !isUser && styles.btnDisabled]}
          onPress={onLogout}
        >
          <Text style={styles.btnText}>Log out</Text>
        </Pressable>

        {!isUser && (
          <Text style={styles.hint}>
            You are using Guest mode. Logging out will return you to Login.
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

  btn: {
    marginTop: 14,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.95 },
  btnText: { color: "#fff", fontWeight: "900" },

  hint: { marginTop: 10, fontSize: 12, color: "#9CA3AF" },
});
