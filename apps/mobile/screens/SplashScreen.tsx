import React from "react";
import { ActivityIndicator, View } from "react-native";

export default function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#EF4444" />
    </View>
  );
}
