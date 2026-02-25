import React from "react";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Emergency } from "../models/map.types";

type EmergencyOverviewSheetProps = {
  emergency: Emergency;
  onDirectionPress: () => void;
  onClose: () => void;
};

export function EmergencyOverviewSheet({
  emergency,
  onDirectionPress,
  onClose,
}: EmergencyOverviewSheetProps) {
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(280, width - 32);
  const imageHeight = Math.round(imageWidth * 0.74);
  const emptyStateHeight = Math.max(imageHeight, 360);

  const badgeTone =
    emergency.type === "SOS"
      ? {
          background: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-600",
        }
      : {
          background: "bg-sky-50",
          border: "border-sky-200",
          text: "text-sky-700",
        };

  return (
    <View className="px-4 pt-3 pb-4">
      <View className="pb-1">
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-rose-100">
            <MaterialCommunityIcons name="bell-alert" size={16} color="#E11D48" />
          </View>

          <View className="flex-1">
            <Text className="text-[23px] font-bold text-slate-900" numberOfLines={1}>
              {emergency.title}
            </Text>
            <Text className="text-[13px] font-semibold text-slate-500" numberOfLines={1}>
              {emergency.location.label?.trim() || "Emergency in nearby area"}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
          >
            <Feather name="x" size={17} color="#334155" />
          </Pressable>
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <View
            className={`h-8 min-w-[56px] items-center justify-center rounded-full border px-3 ${badgeTone.background} ${badgeTone.border}`}
          >
            <Text className={`text-xs font-bold uppercase tracking-wide ${badgeTone.text}`}>
              {emergency.type}
            </Text>
          </View>
          <Text className="text-[12px] font-semibold text-slate-600">
            Updated {emergency.updatedAt ?? "just now"}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onDirectionPress}
        className="mt-3 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-slate-900"
      >
        <Feather name="navigation" size={16} color="#FFFFFF" />
        <Text className="text-sm font-bold text-white">Direction</Text>
      </Pressable>

      {emergency.images.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 12 }}
        >
          {emergency.images.map((image, index) => (
            <Image
              key={`${emergency.id}-img-${index}`}
              source={{ uri: image }}
              resizeMode="cover"
              style={{ width: imageWidth, height: imageHeight, borderRadius: 16 }}
            />
          ))}
        </ScrollView>
      ) : (
        <View
          className="mt-3 w-full items-center justify-center"
          style={{ height: emptyStateHeight }}
        >
          <Text className="w-full text-center text-lg font-semibold text-slate-500">
            No emergency images
          </Text>
        </View>
      )}
    </View>
  );
}
