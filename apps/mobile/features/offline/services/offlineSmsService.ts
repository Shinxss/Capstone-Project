import { Alert } from "react-native";
import * as SMS from "expo-sms";
import type { SmsStatus } from "../models/offlineEmergency.types";
import { formatCompactDateTime, formatCoordinateLabel } from "../utils/offlineEmergency.utils";

export type OfflineSmsContent = {
  kind: "SOS" | "REPORT";
  clientRequestId: string;
  type?: string;
  reporterName?: string;
  reporterContact?: string;
  locationLabel?: string;
  latitude: number;
  longitude: number;
  description?: string;
  timestamp?: string | Date;
};

export function getOfflineSosRecipient(): string | null {
  const number = process.env.EXPO_PUBLIC_OFFLINE_SOS_NUMBER;
  if (!number) return null;
  const trimmed = String(number).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildOfflineEmergencySms(content: OfflineSmsContent): string {
  const lines: string[] = [];

  const header = content.kind === "SOS" ? "LIFELINE SOS" : "LIFELINE REPORT";
  lines.push(header);
  lines.push(`ID: ${content.clientRequestId}`);

  const rawType = content.kind === "SOS" ? "SOS" : (content.type ?? "OTHER").toUpperCase();
  lines.push(`Type: ${rawType}`);

  if (content.reporterName?.trim()) {
    lines.push(`Reporter: ${content.reporterName.trim().slice(0, 50)}`);
  }

  if (content.reporterContact?.trim()) {
    lines.push(`Contact: ${content.reporterContact.trim().slice(0, 25)}`);
  }

  if (content.locationLabel?.trim()) {
    lines.push(`Loc: ${content.locationLabel.trim().slice(0, 80)}`);
  }

  lines.push(`GPS: ${formatCoordinateLabel(content.latitude, content.longitude)}`);

  if (content.description?.trim()) {
    lines.push(`Info: ${content.description.trim().slice(0, 140)}`);
  }

  const date = content.timestamp
    ? typeof content.timestamp === "string"
      ? new Date(content.timestamp)
      : content.timestamp
    : new Date();
  lines.push(`Time: ${formatCompactDateTime(isNaN(date.getTime()) ? new Date() : date)}`);

  return lines.join("\n");
}

export function promptSmsConfirmation(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "Offline Emergency SMS",
      "No internet connection. Lifeline will prepare your emergency details as an SMS. Standard SMS charges may apply.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Continue",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false }
    );
  });
}

export async function openOfflineEmergencySmsComposer(
  content: OfflineSmsContent,
  options?: { skipConfirmation?: boolean }
): Promise<SmsStatus> {
  const recipient = getOfflineSosRecipient();
  if (!recipient) {
    Alert.alert(
      "SMS Fallback Unavailable",
      "The official emergency SMS recipient number is not configured. Your emergency has been saved locally and will sync when internet returns."
    );
    return "unavailable";
  }

  const isAvailable = await SMS.isAvailableAsync().catch(() => false);
  if (!isAvailable) {
    Alert.alert(
      "SMS Unavailable",
      "SMS messaging is not available on this device. Your emergency has been saved locally and will sync when internet returns."
    );
    return "unavailable";
  }

  if (!options?.skipConfirmation) {
    const confirmed = await promptSmsConfirmation();
    if (!confirmed) {
      return "cancelled";
    }
  }

  const message = buildOfflineEmergencySms(content);

  try {
    const response = await SMS.sendSMSAsync([recipient], message);
    if (response.result === "sent") {
      return "sent";
    }
    if (response.result === "cancelled") {
      return "cancelled";
    }
    // On Android, response.result is always 'unknown'
    return "unknown";
  } catch (error) {
    console.warn("[offline-sms] Failed to open SMS composer", error);
    return "unknown";
  }
}
