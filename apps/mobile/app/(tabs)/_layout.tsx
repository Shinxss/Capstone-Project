import React from "react";
import { Tabs } from "expo-router";
import BottomNav from "../../components/BottomNav";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="alert" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
