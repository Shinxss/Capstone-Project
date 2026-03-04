import React, { useMemo } from "react";
import { GestureResponderEvent, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MyRequestSummary, TrackingLabel } from "../models/myRequests";
import { formatEtaText } from "../utils/formatters";

type RequestHistoryCardProps = {
  item: MyRequestSummary;
  actionLabel?: string | null;
  onPress: () => void;
  onPressAction?: () => void;
};

type PillStyle = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

function iconByEmergencyType(type: string): React.ComponentProps<typeof Ionicons>["name"] {
  const normalized = String(type ?? "").trim().toLowerCase();
  if (normalized === "fire") return "flame-outline";
  if (normalized === "flood") return "water-outline";
  if (normalized === "medical") return "medkit-outline";
  if (normalized === "earthquake") return "pulse-outline";
  if (normalized === "collapse") return "business-outline";
  if (normalized === "typhoon") return "thunderstorm-outline";
  return "alert-circle-outline";
}

function pillStyleForLabel(label: TrackingLabel): PillStyle {
  if (label === "Submitted") return { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE", textColor: "#4338CA" };
  if (label === "Verification") return { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", textColor: "#1D4ED8" };
  if (label === "Assigned") return { backgroundColor: "#FEF3C7", borderColor: "#FCD34D", textColor: "#92400E" };
  if (label === "En Route") return { backgroundColor: "#FFEDD5", borderColor: "#FDBA74", textColor: "#C2410C" };
  if (label === "Arrived") return { backgroundColor: "#DBEAFE", borderColor: "#93C5FD", textColor: "#1D4ED8" };
  if (label === "Review") return { backgroundColor: "#FCE7F3", borderColor: "#FBCFE8", textColor: "#9D174D" };
  if (label === "Resolved") return { backgroundColor: "#DCFCE7", borderColor: "#86EFAC", textColor: "#166534" };
  return { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5", textColor: "#B91C1C" };
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RequestHistoryCard({
  item,
  actionLabel,
  onPress,
  onPressAction,
}: RequestHistoryCardProps) {
  const iconName = useMemo(() => iconByEmergencyType(item.type), [item.type]);
  const pillStyle = useMemo(() => pillStyleForLabel(item.trackingLabel), [item.trackingLabel]);
  const createdAtText = useMemo(() => formatCreatedAt(item.createdAt), [item.createdAt]);
  const showEta = item.trackingLabel === "En Route";
  const etaText = showEta ? formatEtaText(item.etaSeconds ?? null, item.trackingLabel) : null;

  const onPressActionButton = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onPressAction?.();
  };

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-zinc-200 bg-white p-4"
      style={({ pressed }) => (pressed ? { opacity: 0.88 } : undefined)}
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1 flex-row items-start">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
            <Ionicons name={iconName} size={20} color="#334155" />
          </View>

          <View className="flex-1">
            <Text className="text-[13px] font-extrabold text-zinc-900" numberOfLines={1}>
              REF#{item.referenceNumber}
            </Text>
            <Text className="mt-1 text-xs text-zinc-600" numberOfLines={1}>
              {item.locationText}
            </Text>
            <Text className="mt-1 text-[11px] text-zinc-500">{createdAtText}</Text>
          </View>
        </View>

        <View
          className="rounded-full border px-3 py-1"
          style={{ backgroundColor: pillStyle.backgroundColor, borderColor: pillStyle.borderColor }}
        >
          <Text className="text-[11px] font-extrabold" style={{ color: pillStyle.textColor }}>
            {item.trackingLabel}
          </Text>
        </View>
      </View>

      {etaText ? <Text className="mt-3 text-xs font-bold text-amber-700">{etaText}</Text> : null}

      {actionLabel && onPressAction ? (
        <View className="mt-3 items-end">
          <Pressable
            onPress={onPressActionButton}
            className="rounded-xl bg-zinc-900 px-4 py-2"
            style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
          >
            <Text className="text-xs font-extrabold text-white">{actionLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}
