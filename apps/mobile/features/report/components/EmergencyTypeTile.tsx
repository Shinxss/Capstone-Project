import React from "react";
import { Pressable, Text, View } from "react-native";
import { LucideIcon } from "lucide-react-native";
import type { EmergencyTypeOption } from "../models/report.types";

type Props = {
  option: EmergencyTypeOption;
  selected: boolean;
  onPress: () => void;
};

function isLucideElement(
  icon: EmergencyTypeOption["icon"]
): icon is React.ReactElement<{ size?: number; className?: string }, LucideIcon> {
  return React.isValidElement(icon);
}

export function EmergencyTypeTile({ option, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 w-[31%] rounded-2xl border bg-white p-3 ${
        selected ? "border-red-500" : "border-zinc-200"
      }`}
    >
      <View
        className={`mb-2 h-12 w-12 items-center justify-center rounded-xl ${option.iconBgClass}`}
      >
        {isLucideElement(option.icon)
          ? React.cloneElement(option.icon, {
              size: 22,
              className: option.iconColorClass,
            })
          : option.icon}
      </View>

      <Text className="text-sm font-semibold text-zinc-800">{option.label}</Text>
    </Pressable>
  );
}
