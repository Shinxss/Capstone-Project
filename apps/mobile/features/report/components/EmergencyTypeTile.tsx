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
        selected ? styles.tileSelected : styles.tileDefault,
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
        style={[styles.label, selected ? styles.labelSelected : styles.labelDefault]}
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
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tileDefault: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe1ea",
  },
  tileSelected: {
    backgroundColor: "#fff1f2",
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tilePressed: {
    transform: [{ scale: 0.985 }],
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
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "500",
  },
  labelDefault: {
    color: "#0f172a",
  },
  labelSelected: {
    color: "#0f172a",
    fontWeight: "600",
  },
});
