import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LucideIcon } from "lucide-react-native";
import type { EmergencyTypeOption } from "../models/report.types";

type Props = {
  option: EmergencyTypeOption;
  selected: boolean;
  onPress: () => void;
};

function isLucideElement(
  icon: EmergencyTypeOption["icon"]
): icon is React.ReactElement<
  { size?: number; color?: string; strokeWidth?: number; className?: string },
  LucideIcon
> {
  return React.isValidElement(icon);
}

export function EmergencyTypeTile({ option, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.tileSelected,
        pressed && styles.tilePressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: option.iconBgColor }]}>
        {isLucideElement(option.icon)
          ? React.cloneElement(option.icon, {
              size: 24,
              color: option.iconColor,
              strokeWidth: 2.3,
            })
          : option.icon}
      </View>

      <Text
        style={styles.label}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "31.4%",
    height: 132,
    marginBottom: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D6D6D6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tileSelected: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF6F6",
  },
  tilePressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 12,
    width: "100%",
    paddingHorizontal: 2,
    textAlign: "center",
    color: "#121212",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "500",
  },
});
