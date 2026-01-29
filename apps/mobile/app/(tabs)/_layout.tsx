import React from "react";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#EF4444",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: Math.max(insets.bottom, 10),
            height: 64 + insets.bottom,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Use your existing explore.tsx as "Map" (like the mockup) */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Center + */}
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarIcon: () => null,
          tabBarButton: () => (
            <Pressable
              onPress={() => router.push("/modal")}
              style={({ pressed }) => [
                styles.plusWrap,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
              hitSlop={12}
            >
              <View style={styles.plusBtn}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="alert"
        options={{
          title: "Alert",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderTopWidth: 0,

    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  label: {
    fontSize: 11,
    marginTop: -2,
  },
  plusWrap: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -29 }],
    bottom: 28, // floats above the bar (won't scroll)
  },
  plusBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#fff",

    elevation: 18,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
