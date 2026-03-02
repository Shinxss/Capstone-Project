import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  publishInAppNotification,
  subscribeInAppNotification,
  type InAppNotificationPayload,
} from "../services/inAppNotificationBus";

type QueueItem = InAppNotificationPayload & { id: string };

const SHOW_MS = 3400;

function toneStyles(tone: InAppNotificationPayload["tone"]) {
  if (tone === "success") {
    return {
      border: "#86EFAC",
      bg: "#ECFDF5",
      title: "#14532D",
      body: "#166534",
      iconBg: "#16A34A",
      icon: "checkmark",
    };
  }

  if (tone === "warning") {
    return {
      border: "#FCD34D",
      bg: "#FFFBEB",
      title: "#92400E",
      body: "#B45309",
      iconBg: "#D97706",
      icon: "warning",
    };
  }

  return {
    border: "#93C5FD",
    bg: "#EFF6FF",
    title: "#1E3A8A",
    body: "#1D4ED8",
    iconBg: "#2563EB",
    icon: "notifications",
  };
}

export function InAppNotificationHost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [active, setActive] = useState<QueueItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(26)).current;

  useEffect(() => {
    return subscribeInAppNotification((payload) => {
      setQueue((prev) => [
        ...prev,
        {
          ...payload,
          id: payload.id ?? `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        },
      ]);
    });
  }, []);

  useEffect(() => {
    if (active || queue.length === 0) return;
    setActive(queue[0]);
    setQueue((prev) => prev.slice(1));
  }, [active, queue]);

  useEffect(() => {
    if (!active) return;

    opacity.setValue(0);
    translateX.setValue(26);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 18,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setActive(null);
      });
    }, SHOW_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [active, opacity, translateX]);

  const palette = useMemo(() => toneStyles(active?.tone), [active?.tone]);

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: Math.max(8, insets.top + 8),
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      <Pressable
        style={[
          styles.card,
          {
            borderColor: palette.border,
            backgroundColor: palette.bg,
          },
        ]}
        onPress={() => {
          if (active.target?.pathname) {
            router.push({
              pathname: active.target.pathname as never,
              params: active.target.params as never,
            });
          }
          setActive(null);
        }}
      >
        <View style={[styles.iconWrap, { backgroundColor: palette.iconBg }]}>
          <Ionicons name={palette.icon as any} size={13} color="#FFFFFF" />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.title, { color: palette.title }]}>
            {active.title}
          </Text>
          {active.body ? (
            <Text numberOfLines={2} style={[styles.body, { color: palette.body }]}>
              {active.body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function showInAppNotification(payload: InAppNotificationPayload) {
  publishInAppNotification(payload);
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 12,
    zIndex: 5000,
    width: "74%",
    maxWidth: 340,
    minWidth: 220,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  copy: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
  },
  body: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
});
