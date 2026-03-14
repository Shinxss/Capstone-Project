import React, { useMemo } from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  NativeViewGestureHandler,
  ScrollView,
} from "react-native-gesture-handler";
import type { Emergency } from "../models/map.types";
import type { EmergencyReportDetail } from "../../emergency/models/emergency.types";

type EtaSummary = {
  durationMin: number;
  distanceKm: number;
};

type EmergencyOverviewSheetProps = {
  emergency: Emergency;
  emergencyDetail: EmergencyReportDetail | null;
  loadingDetail: boolean;
  etaSummary: EtaSummary | null;
  loadingEta: boolean;
  authToken?: string | null;
  onDirectionPress: () => void;
  onClose: () => void;
};

function toSeverityLabel(typeRaw: string): "High" | "Medium" {
  const normalized = String(typeRaw ?? "").trim().toUpperCase();
  if (normalized === "SOS" || normalized === "FIRE" || normalized === "FLOOD") return "High";
  return "Medium";
}

function toStatusLabel(statusRaw?: string) {
  const normalized = String(statusRaw ?? "open")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!normalized) return "Open";
  const canonical = normalized === "acknowledged" ? "assigned" : normalized;
  return canonical
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatReportedAt(raw?: string) {
  if (!raw) return "-";
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

function maskContact(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";

  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}***${digits.slice(-4)}`;
  }

  return raw;
}

function extractBarangay(label?: string) {
  const value = String(label ?? "").trim();
  if (!value) return "-";

  const segments = value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const segmentWithBarangay = segments.find((segment) =>
    /\b(brgy\.?|barangay)\b/i.test(segment)
  );
  if (segmentWithBarangay) return segmentWithBarangay;

  const match = value.match(/\b(brgy\.?|barangay)\b[^,]*/i);
  return match ? match[0].trim() : "-";
}

function toAbsoluteAssetUrl(raw: string) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const apiBase = String(process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  if (!apiBase) return value;
  return `${apiBase.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

export function EmergencyOverviewSheet({
  emergency,
  emergencyDetail,
  loadingDetail,
  etaSummary,
  loadingEta,
  authToken,
  onDirectionPress,
  onClose,
}: EmergencyOverviewSheetProps) {
  const { width } = useWindowDimensions();
  const locationLabel = String(
    emergencyDetail?.location?.label ?? emergency.location.label ?? ""
  ).trim();
  const severity = toSeverityLabel(emergency.type);
  const statusLabel = toStatusLabel(emergencyDetail?.status ?? emergency.status ?? "open");
  const reportId =
    String(emergency.referenceNumber ?? emergencyDetail?.referenceNumber ?? "").trim() ||
    emergency.id;
  const reportedTime = formatReportedAt(
    emergency.reportedAt ?? emergencyDetail?.reportedAt ?? emergencyDetail?.createdAt
  );
  const etaText = loadingEta
    ? "Loading..."
    : etaSummary
      ? `${etaSummary.durationMin} min | ${etaSummary.distanceKm.toFixed(1)} km`
      : "-";

  const photos = useMemo(
    () =>
      Array.isArray(emergencyDetail?.photos)
        ? emergencyDetail.photos
            .map((photo) => String(photo ?? "").trim())
            .filter(Boolean)
        : [],
    [emergencyDetail?.photos]
  );
  const imageHeaders = authToken?.trim()
    ? { Authorization: `Bearer ${authToken.trim()}` }
    : undefined;
  const imageTileWidth = Math.max(148, Math.floor((width - 48) / 2));
  const imageTileHeight = Math.round(imageTileWidth * 1.25);

  const reporter = emergencyDetail?.reporter;
  const reporterName = useMemo(() => {
    const firstName = String(reporter?.firstName ?? "").trim();
    const lastName = String(reporter?.lastName ?? "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (fullName) return fullName;
    if (reporter?.isGuest) return "Guest Reporter";
    return "Guest Reporter";
  }, [reporter?.firstName, reporter?.isGuest, reporter?.lastName]);
  const reporterContact = maskContact(reporter?.contactNo);
  const reporterLifelineId = String(reporter?.lifelineId ?? "").trim() || "-";
  const reporterAvatarUri = useMemo(
    () => toAbsoluteAssetUrl(String(reporter?.avatarUrl ?? "")),
    [reporter?.avatarUrl]
  );
  const reporterAddress = useMemo(() => {
    const parts = [
      String(reporter?.barangay ?? "").trim(),
      String(reporter?.municipality ?? "").trim(),
      String(reporter?.country ?? "").trim(),
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "-";
  }, [reporter?.barangay, reporter?.country, reporter?.municipality]);
  const barangayLabel = extractBarangay(locationLabel);

  return (
    <View className="px-4 pb-5 pt-3">
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="text-[21px] font-bold text-slate-900" numberOfLines={1}>
            {emergency.title}
          </Text>
          <Text className="mt-1 text-[12px] font-medium text-slate-500" numberOfLines={1}>
            {locationLabel || "Location unavailable"}
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
        >
          <Feather name="x" size={16} color="#334155" />
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className={[
              "rounded-full border px-3 py-1",
              severity === "High"
                ? "border-rose-200 bg-rose-50"
                : "border-amber-200 bg-amber-50",
            ].join(" ")}
          >
            <Text
              className={[
                "text-[11px] font-bold uppercase",
                severity === "High" ? "text-rose-700" : "text-amber-700",
              ].join(" ")}
            >
              {severity}
            </Text>
          </View>

          <View className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <Text className="text-[11px] font-bold text-slate-700">{statusLabel}</Text>
          </View>
        </View>

        <Text className="text-[12px] font-semibold text-slate-700">Drive ETA: {etaText}</Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-[12px] font-semibold text-slate-700">ID: {reportId}</Text>
        <Text className="text-[12px] font-medium text-slate-500">Reported: {reportedTime}</Text>
      </View>

      <Pressable
        onPress={onDirectionPress}
        className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-blue-600"
      >
        <Feather name="navigation" size={16} color="#FFFFFF" />
        <Text className="text-sm font-bold text-white">Directions</Text>
      </Pressable>

      <View className="mt-4">
        <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          Images
        </Text>
        {photos.length ? (
          <NativeViewGestureHandler
            disallowInterruption
            shouldActivateOnStart
          >
            <ScrollView
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              overScrollMode="never"
              scrollEnabled={photos.length > 1}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingTop: 10, paddingRight: 16, gap: 10 }}
            >
              {photos.map((photo, index) => {
                const uri = toAbsoluteAssetUrl(photo);
                if (!uri) return null;
                return (
                  <View key={`${emergency.id}-thumb-${index}`} className="relative">
                    <Image
                      source={imageHeaders ? { uri, headers: imageHeaders } : { uri }}
                      style={{ width: imageTileWidth, height: imageTileHeight, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                  </View>
                );
              })}
            </ScrollView>
          </NativeViewGestureHandler>
        ) : (
          <Text className="mt-2 text-sm font-medium text-slate-500">No emergency images</Text>
        )}
      </View>

      <View className="mt-4 border-t border-slate-200 pt-3">
        <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          Location
        </Text>
        <Text className="mt-1 text-[14px] font-semibold text-slate-900">{barangayLabel}</Text>
        <Text className="mt-1 text-[12px] text-slate-500">{locationLabel || "-"}</Text>
      </View>

      <View className="mt-3 border-t border-slate-200 pt-3">
        <Text className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          Reporter
        </Text>
        <View className="mt-2 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {reporterAvatarUri ? (
              <Image
                source={imageHeaders ? { uri: reporterAvatarUri, headers: imageHeaders } : { uri: reporterAvatarUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Feather name="user" size={18} color="#64748B" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-slate-900" numberOfLines={1}>
              {loadingDetail ? "Loading..." : reporterName}
            </Text>
            <Text className="mt-1 text-[12px] text-slate-500" numberOfLines={1}>
              Lifeline ID: {loadingDetail ? "Loading..." : reporterLifelineId}
            </Text>
          </View>
        </View>
        <Text className="mt-2 text-[12px] text-slate-600">Contact: {reporterContact}</Text>
        <Text className="mt-1 text-[12px] text-slate-500">Address: {reporterAddress}</Text>
      </View>
    </View>
  );
}
