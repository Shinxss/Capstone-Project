import React, { useMemo } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MyRequestSummary, TrackingLabel } from "../models/myRequests";
import { formatEtaText } from "../utils/formatters";
import { RequestProgressTracker } from "./RequestProgressTracker";

type RequestHistoryCardProps = {
  item: MyRequestSummary;
  actionLabel?: string | null;
  onPress: () => void;
  onPressAction?: () => void;
  cancelLabel?: string | null;
  onPressCancel?: () => void;
  cancelDisabled?: boolean;
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

function progressIndexForLabel(label: TrackingLabel): number {
  if (label === "Resolved" || label === "Review") return 4;
  if (label === "Arrived") return 3;
  if (label === "En Route") return 2;
  if (label === "Assigned") return 1;
  return 0;
}

export function RequestHistoryCard({
  item,
  actionLabel,
  onPress,
  onPressAction,
  cancelLabel,
  onPressCancel,
  cancelDisabled,
}: RequestHistoryCardProps) {
  const iconName = useMemo(() => iconByEmergencyType(item.type), [item.type]);
  const pillStyle = useMemo(() => pillStyleForLabel(item.trackingLabel), [item.trackingLabel]);
  const createdAtText = useMemo(() => formatCreatedAt(item.createdAt), [item.createdAt]);
  const showEta = item.trackingLabel === "En Route";
  const etaText = showEta ? formatEtaText(item.etaSeconds ?? null, item.trackingLabel) : null;
  const isCancelledLike = item.trackingLabel === "Cancelled";
  const rejectionReason = useMemo(() => String(item.rejectionReason ?? "").trim(), [item.rejectionReason]);
  const isRejected = isCancelledLike && Boolean(rejectionReason);
  const statusLabel = isRejected ? "Rejected" : item.trackingLabel;
  const statusMessage = isRejected ? "Request rejected by LGU." : isCancelledLike ? "Request cancelled." : null;
  const activeProgressIndex = useMemo(
    () => progressIndexForLabel(item.trackingLabel),
    [item.trackingLabel]
  );

  const onPressActionButton = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onPressAction?.();
  };

  const onPressCancelButton = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (cancelDisabled) return;
    onPressCancel?.();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <View style={styles.iconWrap}>
            <Ionicons name={iconName} size={20} color="#334155" />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.referenceText} numberOfLines={1}>
              REF#{item.referenceNumber}
            </Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.locationText}
            </Text>
            <Text style={styles.createdAtText}>{createdAtText}</Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: pillStyle.backgroundColor, borderColor: pillStyle.borderColor }]}>
          <Text style={[styles.statusPillText, { color: pillStyle.textColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {etaText ? <Text style={styles.etaText}>{etaText}</Text> : null}

      {statusMessage ? (
        <View style={styles.statusMessageWrap}>
          <Text style={styles.statusMessageText}>{statusMessage}</Text>
          {isRejected ? (
            <>
              <Text style={styles.rejectionReasonTitle}>Reason from LGU</Text>
              <Text style={styles.rejectionReasonText}>{rejectionReason}</Text>
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.progressWrap}>
          <RequestProgressTracker activeIndex={activeProgressIndex} />
        </View>
      )}

      {actionLabel && onPressAction ? (
        <View style={styles.actionWrap}>
          {cancelLabel ? (
            <Pressable
              onPress={onPressCancelButton}
              disabled={cancelDisabled || !onPressCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                cancelDisabled || !onPressCancel ? styles.cancelButtonDisabled : null,
                !cancelDisabled && onPressCancel && pressed ? styles.cancelButtonPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  cancelDisabled || !onPressCancel ? styles.cancelButtonTextDisabled : null,
                ]}
              >
                {cancelLabel}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onPressActionButton}
            style={({ pressed }) => [styles.actionButton, pressed ? styles.actionButtonPressed : null]}
          >
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardPressed: {
    opacity: 0.88,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  leftGroup: {
    marginRight: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrap: {
    marginRight: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F5",
  },
  textWrap: {
    flex: 1,
  },
  referenceText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#18181B",
  },
  locationText: {
    marginTop: 4,
    fontSize: 12,
    color: "#52525B",
  },
  createdAtText: {
    marginTop: 4,
    fontSize: 11,
    color: "#71717A",
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  etaText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },
  progressWrap: {
    marginTop: 12,
    paddingHorizontal: 2,
  },
  statusMessageWrap: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  statusMessageText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B91C1C",
  },
  rejectionReasonTitle: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    color: "#991B1B",
  },
  rejectionReasonText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    color: "#7F1D1D",
    fontWeight: "600",
  },
  actionWrap: {
    marginTop: 12,
    alignItems: "stretch",
  },
  actionButton: {
    marginTop: 8,
    width: "100%",
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4D4D8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3F3F46",
  },
  cancelButton: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonDisabled: {
    backgroundColor: "#FCA5A5",
  },
  cancelButtonPressed: {
    opacity: 0.9,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cancelButtonTextDisabled: {
    color: "#FFE4E6",
  },
});
