import React from "react";
import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function LifelineLogo() {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
          stroke="#ef4444"
          strokeWidth={2}
          fill="white"
        />
      </Svg>
      <Text className="text-[20px] font-semibold">
        <Text className="text-red-500">Life</Text>
        <Text className="text-gray-800">line</Text>
      </Text>
    </View>
  );
}
