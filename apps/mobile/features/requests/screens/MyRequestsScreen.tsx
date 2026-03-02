import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../auth/hooks/useSession";
import type { MyRequestScope, MyRequestSummary } from "../models/myRequests";
import { useMyRequests } from "../hooks/useMyRequests";

function formatRequestType(raw: string) {
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (!normalized) return "Other";
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCreatedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function ScopePill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.scopePill,
        active ? styles.scopePillActive : null,
        pressed ? styles.scopePillPressed : null,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.scopePillText, active ? styles.scopePillTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function RequestRow({ item, onPress }: { item: MyRequestSummary; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]} onPress={onPress}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>
          {formatRequestType(item.type)} • {item.referenceNumber}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#6B7280" />
      </View>
      <Text style={styles.rowMeta}>Created {formatCreatedAt(item.createdAt)}</Text>
      <View style={styles.rowStatusPill}>
        <Text style={styles.rowStatusText}>{item.trackingStatus}</Text>
      </View>
    </Pressable>
  );
}

export function MyRequestsScreen() {
  const { isUser } = useSession();
  const [scope, setScope] = useState<MyRequestScope>("active");
  const { items, loading, error, refresh } = useMyRequests(scope, { enabled: isUser });

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const emptyText = useMemo(
    () => (scope === "active" ? "No active requests right now." : "No request history yet."),
    [scope]
  );

  if (!isUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Sign in required</Text>
          <Text style={styles.centerSub}>Please sign in to view your emergency requests.</Text>
          <Pressable style={styles.loginBtn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Requests</Text>
        <Text style={styles.subtitle}>Track your requested help</Text>
      </View>

      <View style={styles.scopeRow}>
        <ScopePill active={scope === "active"} label="Active" onPress={() => setScope("active")} />
        <ScopePill active={scope === "history"} label="History" onPress={() => setScope("history")} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#DC2626" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          items.map((item) => (
            <RequestRow
              key={item.id}
              item={item}
              onPress={() =>
                router.push({
                  pathname: "/my-request-tracking",
                  params: { id: item.id },
                })
              }
            />
          ))
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  scopeRow: {
    marginTop: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 10,
  },
  scopePill: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  scopePillActive: {
    borderColor: "#DC2626",
    backgroundColor: "#FEE2E2",
  },
  scopePillPressed: {
    opacity: 0.86,
  },
  scopePillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  scopePillTextActive: {
    color: "#B91C1C",
  },
  content: {
    padding: 18,
    gap: 12,
    paddingBottom: 40,
  },
  row: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.88,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  rowStatusPill: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  rowStatusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  loadingWrap: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyWrap: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  centerSub: {
    marginTop: 6,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
  loginBtn: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
