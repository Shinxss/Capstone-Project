import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { DispatchOffer } from "../models/dispatch";
import { getDispatchStatusLabel } from "../utils/dispatchProgress";
import {
  formatDateTime,
  formatEmergencyType,
  getDispatchLocationLabel,
} from "../utils/dispatchFormatters";

type PendingDispatchCardProps = {
  dispatch: DispatchOffer;
  busy: boolean;
  onAccept: (dispatch: DispatchOffer) => void;
  onDecline: (dispatch: DispatchOffer) => void;
};

function readNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatRelativeTime(value: unknown) {
  if (!value) return "Just now";
  const timestamp = new Date(String(value)).getTime();
  if (!Number.isFinite(timestamp)) return "Just now";
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes <= 0) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getPriorityLabel(offer: DispatchOffer) {
  const emergencyType = String(offer.emergency?.emergencyType ?? "").toUpperCase();
  if (emergencyType.includes("SOS")) return "Critical Priority";
  return "High Priority";
}

function getDispatchHeadline(offer: DispatchOffer) {
  const typeLabel = formatEmergencyType(offer.emergency?.emergencyType);
  const barangay = String(offer.emergency?.barangayName ?? "").trim();
  if (barangay) return `${typeLabel} Reported - Barangay ${barangay}`;
  return `${typeLabel} Reported`;
}

function getDistanceLabel(offer: DispatchOffer) {
  const offerRecord = offer as unknown as Record<string, unknown>;
  const emergencyRecord = (offer.emergency ?? {}) as unknown as Record<string, unknown>;
  const km = readNumber(
    offerRecord.distanceKm,
    offerRecord.distance,
    emergencyRecord.distanceKm,
    emergencyRecord.distance,
    emergencyRecord.distance_km
  );
  if (km === null || km < 0) return null;
  return `${km >= 10 ? km.toFixed(0) : km.toFixed(1)} km away`;
}

function getEtaLabel(offer: DispatchOffer) {
  const offerRecord = offer as unknown as Record<string, unknown>;
  const emergencyRecord = (offer.emergency ?? {}) as unknown as Record<string, unknown>;
  const minutes = readNumber(
    offerRecord.etaMinutes,
    offerRecord.etaMin,
    emergencyRecord.etaMinutes,
    emergencyRecord.etaMin,
    emergencyRecord.eta_minutes
  );
  if (minutes === null || minutes < 1) return null;
  const rounded = Math.round(minutes);
  return `ETA: ${rounded} min${rounded === 1 ? "" : "s"}`;
}

function getVolunteersNeededLabel(offer: DispatchOffer) {
  const offerRecord = offer as unknown as Record<string, unknown>;
  const emergencyRecord = (offer.emergency ?? {}) as unknown as Record<string, unknown>;
  const count = readNumber(
    offerRecord.volunteersNeeded,
    offerRecord.requiredVolunteers,
    emergencyRecord.volunteersNeeded,
    emergencyRecord.requiredVolunteers
  );
  if (count === null || count < 1) return null;
  const rounded = Math.round(count);
  return `${rounded} Volunteer${rounded === 1 ? "" : "s"} Needed`;
}

export function PendingDispatchCard({ dispatch, busy, onAccept, onDecline }: PendingDispatchCardProps) {
  const typeLabel = formatEmergencyType(dispatch.emergency?.emergencyType).toUpperCase();
  const priorityLabel = getPriorityLabel(dispatch);
  const headline = getDispatchHeadline(dispatch);
  const locationLabel = getDispatchLocationLabel(dispatch);
  const distanceLabel = getDistanceLabel(dispatch);
  const etaLabel = getEtaLabel(dispatch) ?? "ETA unavailable";
  const volunteersNeededLabel = getVolunteersNeededLabel(dispatch) ?? "Volunteers needed: --";
  const timeLabel = formatRelativeTime(dispatch.createdAt ?? dispatch.emergency?.reportedAt);
  const statusLabel = getDispatchStatusLabel(dispatch);
  const reportedAt = formatDateTime(dispatch.emergency?.reportedAt ?? dispatch.createdAt);
  const locationMeta = distanceLabel ? `${locationLabel} - ${distanceLabel}` : locationLabel;

  return (
    <View className="overflow-hidden rounded-3xl border border-red-200 bg-white">
      <View className="absolute bottom-0 left-0 top-0 w-1 bg-red-500" />
      <View className="px-4 py-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-wrap items-center gap-2 pr-2">
            <View className="flex-row items-center rounded-full bg-red-50 px-2.5 py-1">
              <Ionicons name="flame" size={12} color="#DC2626" />
              <Text className="ml-1 text-[11px] font-extrabold uppercase tracking-wide text-red-600">
                {typeLabel} Emergency
              </Text>
            </View>

            <View className="rounded-full bg-red-100 px-2.5 py-1">
              <Text className="text-[11px] font-bold text-red-700">{priorityLabel}</Text>
            </View>

            <View className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1">
              <Text className="text-[11px] font-semibold text-red-700">{statusLabel}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <Text className="text-xs font-semibold text-slate-500">{timeLabel}</Text>
            <Ionicons name="ellipsis-horizontal" size={16} color="#64748B" />
          </View>
        </View>

        <Text className="mt-2 text-[22px] font-extrabold leading-7 text-slate-900">{headline}</Text>

        <View className="mt-2 flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#4B5563" />
          <Text className="ml-1 text-xs font-medium text-slate-600">{locationMeta}</Text>
        </View>

        <View className="mt-2 flex-row flex-wrap gap-2">
          <View className="flex-row items-center rounded-full bg-slate-100 px-3 py-1">
            <Ionicons name="people-outline" size={13} color="#4B5563" />
            <Text className="ml-1 text-xs font-semibold text-slate-700">{volunteersNeededLabel}</Text>
          </View>
          <View className="flex-row items-center rounded-full bg-slate-100 px-3 py-1">
            <Ionicons name="time-outline" size={13} color="#4B5563" />
            <Text className="ml-1 text-xs font-semibold text-slate-700">{etaLabel}</Text>
          </View>
        </View>

        {reportedAt ? (
          <Text className="mt-2 text-[11px] font-medium text-slate-500">Reported: {reportedAt}</Text>
        ) : null}

        <View className="mt-3 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Accept dispatch"
            onPress={() => onAccept(dispatch)}
            disabled={busy}
            className={`flex-1 flex-row items-center justify-center rounded-full px-4 py-2.5 ${
              busy ? "bg-red-400" : "bg-red-600"
            }`}
          >
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            <Text className="ml-1 text-sm font-extrabold text-white">{busy ? "Working..." : "Accept"}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decline dispatch"
            onPress={() => onDecline(dispatch)}
            disabled={busy}
            className="flex-1 flex-row items-center justify-center rounded-full border border-red-400 bg-white px-4 py-2.5"
          >
            <Ionicons name="close" size={14} color="#DC2626" />
            <Text className="ml-1 text-sm font-extrabold text-red-600">{busy ? "Working..." : "Decline"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
