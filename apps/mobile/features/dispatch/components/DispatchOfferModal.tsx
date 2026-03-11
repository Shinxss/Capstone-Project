import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DispatchModalData } from "../models/dispatchModal";
import {
  DEFAULT_DISPATCH_INSTRUCTION,
  DEFAULT_LOCATION_LABEL,
} from "../constants/dispatchModal.constants";

export type DispatchAssignmentModalProps = {
  visible: boolean;
  data: DispatchModalData | null;
  assignedByText: string;
  severityLabel: string;
  statusLabel: string;
  distanceEtaText?: string | null;
  reportedTimeText?: string | null;
  accepting: boolean;
  declining: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onViewDetails: () => void;
  onClose?: () => void;
};

function severityChipClasses(severity?: DispatchModalData["severity"]) {
  if (severity === "critical") return "bg-red-100 border-red-300 text-red-700";
  if (severity === "high") return "bg-rose-100 border-rose-300 text-rose-700";
  if (severity === "medium") return "bg-red-50 border-red-200 text-red-600";
  return "bg-red-50 border-red-200 text-red-600";
}

function statusChipClasses(status?: DispatchModalData["status"]) {
  if (status === "accepted") return "bg-red-100 border-red-300 text-red-700";
  if (status === "declined") return "bg-slate-100 border-slate-300 text-slate-700";
  if (status === "cancelled") return "bg-slate-100 border-slate-300 text-slate-700";
  return "bg-red-100 border-red-300 text-red-700";
}

function Row(props: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  return (
    <View className="mt-3 flex-row items-start gap-2.5">
      <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-red-50">
        <Ionicons name={props.icon} size={16} color="#DC2626" />
      </View>
      <Text className="flex-1 text-[13px] leading-5 font-medium text-gray-700">{props.text}</Text>
    </View>
  );
}

export function DispatchOfferModal(props: DispatchAssignmentModalProps) {
  const {
    visible,
    data,
    assignedByText,
    severityLabel,
    statusLabel,
    distanceEtaText,
    reportedTimeText,
    accepting,
    declining,
    onAccept,
    onDecline,
    onViewDetails,
    onClose,
  } = props;

  if (!visible || !data) return null;

  const instruction =
    String(data.instruction ?? "").trim() || DEFAULT_DISPATCH_INSTRUCTION;
  const locationText = String(
    data.addressLine ?? (data.barangay ? `Brgy. ${data.barangay}` : DEFAULT_LOCATION_LABEL)
  ).trim();
  const submitting = accepting || declining;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        onClose?.();
      }}
    >
      <View className="flex-1">
        <Pressable
          onPress={onClose}
          disabled={!onClose || submitting}
          className="absolute inset-0 bg-black/85"
          accessibilityRole="button"
          accessibilityLabel="Dismiss dispatch modal backdrop"
        />

        <View className="flex-1 justify-center px-4">
          <View className="overflow-hidden rounded-3xl bg-white">
          <View className="bg-red-600 px-5 py-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row items-center pr-3">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="warning" size={22} color="#FFFFFF" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-extrabold text-white">New Dispatch</Text>
                  <Text className="mt-0.5 text-sm font-semibold text-red-100">{assignedByText}</Text>
                </View>
              </View>
              {onClose ? (
                <Pressable
                  onPress={onClose}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel="Close dispatch modal"
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    submitting ? "bg-white/20" : "bg-white/25"
                  }`}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View className="px-5 pb-5 pt-4">
            <Text className="text-xl font-extrabold text-gray-900">{data.emergencyTitle}</Text>

            <View className="mt-3 flex-row flex-wrap gap-2">
              <View className={`rounded-full border px-3 py-1 ${severityChipClasses(data.severity)}`}>
                <Text className="text-[11px] font-extrabold">{severityLabel}</Text>
              </View>
              <View className={`rounded-full border px-3 py-1 ${statusChipClasses(data.status)}`}>
                <Text className="text-[11px] font-extrabold">{statusLabel}</Text>
              </View>
            </View>

            <Row icon="location-outline" text={locationText} />

            {distanceEtaText ? <Row icon="navigate-outline" text={distanceEtaText} /> : null}

            {reportedTimeText ? <Row icon="time-outline" text={reportedTimeText} /> : null}

            <Text className="mt-4 text-sm leading-5 font-medium text-gray-700">{instruction}</Text>

            <View className="mt-5 gap-2.5">
              <Pressable
                onPress={onAccept}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Accept dispatch"
                className={`items-center rounded-2xl px-4 py-3.5 ${submitting ? "bg-red-400" : "bg-red-600"}`}
              >
                <Text className="text-base font-extrabold text-white">
                  {accepting ? "Accepting..." : "Accept Dispatch"}
                </Text>
              </Pressable>

              <Pressable
                onPress={onDecline}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Cannot respond to dispatch"
                className={`items-center rounded-2xl border px-4 py-3.5 ${
                  submitting ? "border-gray-200 bg-gray-100" : "border-gray-300 bg-white"
                }`}
              >
                <Text className="text-base font-bold text-gray-700">
                  {declining ? "Updating..." : "Can't Respond"}
                </Text>
              </Pressable>

              <Pressable
                onPress={onViewDetails}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="View full emergency details"
                className="items-center py-1"
              >
                <Text className="text-sm font-semibold text-gray-600">View Full Details</Text>
              </Pressable>
            </View>
          </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
